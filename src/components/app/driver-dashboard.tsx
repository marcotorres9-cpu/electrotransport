'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import {
  Power, PowerOff, DollarSign, Truck, Star, Menu, X,
  MapPin, CheckCircle2, Map
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { apiFetch, formatPrice } from '@/lib/api'

const MapView = dynamic(() => import('@/components/app/map-view'), { ssr: false })

export default function DriverDashboard() {
  const {
    currentUser, setCurrentView, logout,
    unreadCount, setNotifications, setUnreadCount,
    setDriverOnline, isDriverOnline, driverOrders, setDriverOrders,
    availableOrders, setAvailableOrders, setCurrentUser
  } = useAppStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function loadData() {
    try {
      const [ordersData, availData, notifData] = await Promise.all([
        apiFetch('/api/orders'),
        apiFetch('/api/orders?type=available'),
        apiFetch('/api/notifications'),
      ])
      setDriverOrders(ordersData.orders)
      setAvailableOrders(availData.orders)
      setNotifications(notifData.notifications)
      setUnreadCount(notifData.unreadCount)
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function toggleOnlineStatus() {
    if (!currentUser?.driver) return
    try {
      const data = await apiFetch(`/api/drivers/${currentUser.driver.id}/toggle-status`, {
        method: 'POST',
      })
      setDriverOnline(!isDriverOnline)
      const updatedUser = { ...currentUser }
      if (updatedUser.driver) {
        updatedUser.driver.isOnline = !isDriverOnline
      }
      setCurrentUser(updatedUser)
      toast.success(data.driver.isOnline ? '¡Estás en línea!' : 'Modo offline activado')

      if (!isDriverOnline) {
        loadData()
      }
    } catch {
      toast.error('Error al cambiar estado')
    }
  }

  function handleNavClick(viewId: string) {
    setCurrentView(viewId as any)
    setSidebarOpen(false)
  }

  function handleLogout() {
    logout()
    toast.success('Sesión cerrada')
  }

  const driverNavItems = [
    { id: 'driver-dashboard', label: 'Panel Principal' },
    { id: 'driver-available-orders', label: 'Pedidos Disponibles' },
    { id: 'driver-my-orders', label: 'Mis Pedidos' },
    { id: 'driver-notifications', label: 'Notificaciones' },
    { id: 'driver-profile', label: 'Mi Perfil' },
  ]

  const totalEarnings = driverOrders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + (o.acceptedPrice || o.proposedPrice), 0)

  const activeOrders = driverOrders.filter(
    (o) => o.status === 'accepted' || o.status === 'in_progress' || o.status === 'offer_received'
  )

  return (
    <div className="min-h-screen bg-[#181818]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Driver Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-[#1e1e1e] border-r border-[#333333] z-50 transform transition-transform duration-300 lg:transform-none ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-[#1DB954] flex items-center justify-center">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-white text-sm">ElectroTransport</h2>
                <p className="text-xs text-[#888888]">Panel de Transportista</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-[#888888]">
              <X className="h-5 w-5" />
            </button>
          </div>
          <Separator className="bg-[#333333]" />
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1DB954]/15 flex items-center justify-center">
                <span className="text-[#1DB954] font-semibold text-sm">{currentUser?.name?.charAt(0) || 'T'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-white truncate">{currentUser?.name}</p>
                <p className="text-xs text-[#888888] truncate">{currentUser?.email}</p>
              </div>
            </div>
          </div>
          <Separator className="bg-[#333333]" />
          <nav className="flex-1 p-3 space-y-1">
            {driverNavItems.map((item) => {
              const isActive = useAppStore.getState().currentView === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                    isActive ? 'bg-[#1DB954]/10 text-[#1DB954]' : 'text-[#8a8a8a] hover:bg-[#262626]'
                  }`}
                >
                  {item.id === 'driver-notifications' && unreadCount > 0 && (
                    <Badge className="bg-[#FFC145] text-black text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center mr-auto">
                      {unreadCount}
                    </Badge>
                  )}
                  {item.label}
                </button>
              )
            })}
          </nav>
          {currentUser?.driver && (
            <div className="p-4">
              <div className="bg-[#262626] border border-[#333333] rounded-xl p-3 flex items-center gap-3">
                <Star className="h-5 w-5 text-[#FFC145] fill-[#FFC145]" />
                <div>
                  <p className="text-sm font-semibold text-white">{currentUser.driver.rating.toFixed(1)}</p>
                  <p className="text-xs text-[#888888]">{currentUser.driver.totalTrips} viajes</p>
                </div>
              </div>
            </div>
          )}
          <Separator className="bg-[#333333]" />
          <div className="p-3">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-colors">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 bg-[#1e1e1e] border-b border-[#333333] px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-[#8a8a8a]">
            <Menu className="h-6 w-6" />
          </button>
          <Truck className="h-5 w-5 text-[#1DB954]" />
          <h1 className="font-semibold text-white flex-1">Panel</h1>
          <Button
            size="sm"
            variant={isDriverOnline ? 'default' : 'outline'}
            className={isDriverOnline ? 'bg-[#1DB954] hover:bg-[#17a34a] text-black' : 'border-[#333333] text-[#8a8a8a]'}
            onClick={toggleOnlineStatus}
          >
            {isDriverOnline ? 'En línea' : 'Offline'}
          </Button>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Online Toggle + Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Panel de Transportista</h1>
              <p className="text-sm text-[#8a8a8a]">Gestiona tus entregas y gana dinero</p>
            </div>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={toggleOnlineStatus}
                className={`font-semibold py-5 px-6 transition-all ${
                  isDriverOnline
                    ? 'bg-[#1DB954] hover:bg-[#17a34a] text-black animate-pulse-emerald'
                    : 'bg-[#333] hover:bg-[#666666] text-white'
                }`}
              >
                {isDriverOnline ? (
                  <>
                    <Power className="h-5 w-5 mr-2" />
                    En Línea - Disponible
                  </>
                ) : (
                  <>
                    <PowerOff className="h-5 w-5 mr-2" />
                    Conectarse
                  </>
                )}
              </Button>
            </motion.div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Ganancias', value: formatPrice(totalEarnings), icon: DollarSign, color: 'bg-[#1DB954]/10 text-[#1DB954]' },
              { label: 'Viajes', value: currentUser?.driver?.totalTrips || 0, icon: CheckCircle2, color: 'bg-[#00C9A7]/10 text-[#00C9A7]' },
              { label: 'En Progreso', value: driverOrders.filter((o) => o.status === 'accepted' || o.status === 'in_progress').length, icon: Truck, color: 'bg-[#FFC145]/10 text-[#FFC145]' },
              { label: 'Calificación', value: currentUser?.driver?.rating.toFixed(1) || '0.0', icon: Star, color: 'bg-[#845EF7]/10 text-[#845EF7]' },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="bg-[#1e1e1e] border border-[#333333] shadow-none">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-[#888888]">{stat.label}</p>
                      <p className="text-lg font-bold text-white">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Map Section */}
          {isDriverOnline && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Map className="h-5 w-5 text-[#1DB954]" />
                  Radar de Vehículos
                </h2>
                <span className="text-xs text-[#888888]">Quito, Ecuador</span>
              </div>
              <MapView
                height="300px"
                showDriverLocations={true}
                orders={activeOrders.map((o) => ({
                  id: o.id,
                  originLat: o.originLat,
                  originLng: o.originLng,
                  destLat: o.destLat,
                  destLng: o.destLng,
                  status: o.status,
                  orderNumber: o.orderNumber,
                }))}
              />
            </motion.div>
          )}

          {/* Available orders preview */}
          {isDriverOnline && availableOrders.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-white">Pedidos Disponibles</h2>
                <button onClick={() => setCurrentView('driver-available-orders')} className="text-sm text-[#1DB954] font-medium hover:underline">
                  Ver todos ({availableOrders.length})
                </button>
              </div>
              <div className="space-y-3">
                {availableOrders.slice(0, 3).map((order) => (
                  <div key={order.id} className="bg-[#1e1e1e] rounded-xl border border-[#333333] p-4 hover:border-[#1DB954]/30 transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-[#888888]">#{order.orderNumber}</span>
                        {order.store && <Badge variant="outline" className="text-xs border-[#333333] text-[#8a8a8a]">{order.store.storeName}</Badge>}
                      </div>
                      <span className="font-bold text-[#1DB954]">{formatPrice(order.proposedPrice)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#8a8a8a]">
                      <MapPin className="h-3.5 w-3.5 text-[#1DB954] shrink-0" />
                      <span className="truncate">{order.originAddress} → {order.destAddress}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {!isDriverOnline && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="bg-[#1e1e1e] border border-[#333333] shadow-none">
                <CardContent className="p-8 text-center">
                  <PowerOff className="h-12 w-12 text-[#666666] mx-auto mb-3" />
                  <h3 className="font-semibold text-[#8a8a8a] mb-1">Estás Offline</h3>
                  <p className="text-sm text-[#888888]">Conéctate para ver pedidos disponibles</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Active orders */}
          {activeOrders.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <h2 className="text-lg font-semibold text-white mb-3">Pedidos Activos</h2>
              <div className="space-y-3">
                {activeOrders.map((order) => (
                  <div key={order.id} className={`bg-[#1e1e1e] rounded-xl p-4 ${
                    order.status === 'offer_received'
                      ? 'border-2 border-[#FFC145]/40 animate-pulse-offer'
                      : 'border border-[#1DB954]/30'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-[#888888]">#{order.orderNumber}</span>
                      <Badge className={`text-xs ${
                        order.status === 'offer_received'
                          ? 'bg-[#FFC145]/15 text-[#FFC145]'
                          : 'bg-[#1DB954]/15 text-[#1DB954]'
                      }`}>
                        {order.status === 'offer_received' ? 'Oferta Enviada' : order.status === 'accepted' ? 'Aceptado' : 'En Progreso'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#8a8a8a] mb-2">
                      <MapPin className="h-3.5 w-3.5 text-[#1DB954] shrink-0" />
                      <span className="truncate">{order.originAddress} → {order.destAddress}</span>
                    </div>
                    <div className="flex gap-2">
                      {order.status === 'offer_received' && (
                        <Badge variant="outline" className="text-xs border-[#FFC145]/30 text-[#FFC145]">
                          Esperando confirmación del local...
                        </Badge>
                      )}
                      {(order.status === 'accepted' || order.status === 'in_progress') && (
                        <Button size="sm" className="bg-[#1DB954] hover:bg-[#17a34a] text-black text-xs" onClick={() => {
                          apiFetch(`/api/orders/${order.id}/complete`, { method: 'POST' }).then(() => {
                            toast.success('Pedido entregado')
                            loadData()
                          }).catch(() => toast.error('Error'))
                        }}>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Marcar Entregado
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}

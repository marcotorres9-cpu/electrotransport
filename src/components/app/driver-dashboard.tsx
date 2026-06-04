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
    <div className="min-h-screen bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Driver Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 lg:transform-none ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-sm">ElectroTransport</h2>
                <p className="text-xs text-muted-foreground">Panel de Transportista</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
          <Separator />
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-emerald-700 font-semibold text-sm">{currentUser?.name?.charAt(0) || 'T'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-slate-800 truncate">{currentUser?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{currentUser?.email}</p>
              </div>
            </div>
          </div>
          <Separator />
          <nav className="flex-1 p-3 space-y-1">
            {driverNavItems.map((item) => {
              const isActive = useAppStore.getState().currentView === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                    isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.id === 'driver-notifications' && unreadCount > 0 && (
                    <Badge className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center mr-auto">
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
              <div className="bg-emerald-50 rounded-xl p-3 flex items-center gap-3">
                <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{currentUser.driver.rating.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">{currentUser.driver.totalTrips} viajes</p>
                </div>
              </div>
            </div>
          )}
          <Separator />
          <div className="p-3">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-600">
            <Menu className="h-6 w-6" />
          </button>
          <Truck className="h-5 w-5 text-emerald-600" />
          <h1 className="font-semibold text-slate-800 flex-1">Panel</h1>
          <Button
            size="sm"
            variant={isDriverOnline ? 'default' : 'outline'}
            className={isDriverOnline ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
            onClick={toggleOnlineStatus}
          >
            {isDriverOnline ? 'En línea' : 'Offline'}
          </Button>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Online Toggle + Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Panel de Transportista</h1>
              <p className="text-sm text-muted-foreground">Gestiona tus entregas y gana dinero</p>
            </div>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={toggleOnlineStatus}
                className={`font-semibold py-5 px-6 shadow-lg transition-all ${
                  isDriverOnline
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse-emerald'
                    : 'bg-slate-600 hover:bg-slate-700 text-white'
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
              { label: 'Ganancias', value: formatPrice(totalEarnings), icon: DollarSign, color: 'bg-emerald-100 text-emerald-600' },
              { label: 'Viajes', value: currentUser?.driver?.totalTrips || 0, icon: CheckCircle2, color: 'bg-sky-100 text-sky-600' },
              { label: 'En Progreso', value: driverOrders.filter((o) => o.status === 'accepted' || o.status === 'in_progress').length, icon: Truck, color: 'bg-amber-100 text-amber-600' },
              { label: 'Calificación', value: currentUser?.driver?.rating.toFixed(1) || '0.0', icon: Star, color: 'bg-purple-100 text-purple-600' },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="border-none shadow-sm">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-lg font-bold text-slate-800">{stat.value}</p>
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
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Map className="h-5 w-5 text-emerald-600" />
                  Radar de Vehículos
                </h2>
                <span className="text-xs text-muted-foreground">Quito, Ecuador</span>
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
                <h2 className="text-lg font-semibold text-slate-800">Pedidos Disponibles</h2>
                <button onClick={() => setCurrentView('driver-available-orders')} className="text-sm text-emerald-600 font-medium hover:underline">
                  Ver todos ({availableOrders.length})
                </button>
              </div>
              <div className="space-y-3">
                {availableOrders.slice(0, 3).map((order) => (
                  <div key={order.id} className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">#{order.orderNumber}</span>
                        {order.store && <Badge variant="outline" className="text-xs">{order.store.storeName}</Badge>}
                      </div>
                      <span className="font-bold text-emerald-600">{formatPrice(order.proposedPrice)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{order.originAddress} → {order.destAddress}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {!isDriverOnline && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border-none shadow-sm bg-slate-100">
                <CardContent className="p-8 text-center">
                  <PowerOff className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="font-semibold text-slate-700 mb-1">Estás Offline</h3>
                  <p className="text-sm text-muted-foreground">Conéctate para ver pedidos disponibles</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Active orders */}
          {activeOrders.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <h2 className="text-lg font-semibold text-slate-800 mb-3">Pedidos Activos</h2>
              <div className="space-y-3">
                {activeOrders.map((order) => (
                  <div key={order.id} className={`bg-white rounded-xl p-4 ${
                    order.status === 'offer_received' 
                      ? 'border-2 border-orange-300 animate-pulse-offer' 
                      : 'border border-emerald-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-muted-foreground">#{order.orderNumber}</span>
                      <Badge className={`text-xs ${
                        order.status === 'offer_received' 
                          ? 'bg-orange-100 text-orange-700' 
                          : 'bg-sky-100 text-sky-700'
                      }`}>
                        {order.status === 'offer_received' ? 'Oferta Enviada' : order.status === 'accepted' ? 'Aceptado' : 'En Progreso'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                      <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{order.originAddress} → {order.destAddress}</span>
                    </div>
                    <div className="flex gap-2">
                      {order.status === 'offer_received' && (
                        <Badge variant="outline" className="text-xs border-orange-200 text-orange-600">
                          Esperando confirmación del local...
                        </Badge>
                      )}
                      {(order.status === 'accepted' || order.status === 'in_progress') && (
                        <Button size="sm" className="gradient-primary text-white text-xs" onClick={() => {
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

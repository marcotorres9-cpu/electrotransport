'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import {
  Power, PowerOff, DollarSign, Truck, Star, Menu, X,
  MapPin, CheckCircle2, Bell
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { apiFetch, formatPrice } from '@/lib/api'
import type { OrderItem } from '@/store/use-app-store'

const OrderMap = dynamic(() => import('./order-map'), { ssr: false })

export default function DriverDashboard() {
  const {
    currentUser, setCurrentView, logout,
    unreadCount, setNotifications, setUnreadCount,
    setDriverOnline, isDriverOnline, driverOrders, setDriverOrders,
    availableOrders, setAvailableOrders, setCurrentUser,
    onlineDrivers, setOnlineDrivers,
    lastPolledOrderIds, setLastPolledOrderIds,
    setIncomingOrder, setShowIncomingNotification,
  } = useAppStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  async function loadData() {
    try {
      const [ordersData, availData, notifData, driversData] = await Promise.all([
        apiFetch('/api/orders'),
        apiFetch('/api/orders?type=available'),
        apiFetch('/api/notifications'),
        apiFetch('/api/drivers'),
      ])
      setDriverOrders(ordersData.orders)
      setAvailableOrders(availData.orders)
      setNotifications(notifData.notifications)
      setUnreadCount(notifData.unreadCount)

      // Transform driver data for map
      const drivers = (driversData.drivers || []).map((d: any) => ({
        id: d.id,
        userId: d.userId,
        vehicleType: d.vehicleType,
        vehiclePlate: d.vehiclePlate,
        lat: d.lat || 0,
        lng: d.lng || 0,
        isOnline: true,
        rating: d.rating,
        name: d.user?.name || 'Conductor',
      }))
      setOnlineDrivers(drivers)
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Polling for new orders when driver is online
  const pollNewOrders = useCallback(async () => {
    if (!isDriverOnline) return
    try {
      const availData = await apiFetch('/api/orders?type=available')
      const newOrders = availData.orders as OrderItem[]

      // Find new orders not in our last polled list
      const currentIds = newOrders.map((o) => o.id)
      const newOrderIds = currentIds.filter((id) => !lastPolledOrderIds.includes(id))

      if (newOrderIds.length > 0) {
        // Find the newest order
        const newOrder = newOrders.find((o) => newOrderIds.includes(o.id))
        if (newOrder) {
          setIncomingOrder(newOrder)
          setShowIncomingNotification(true)
        }
        // Update available orders
        setAvailableOrders(newOrders)
      }

      setLastPolledOrderIds(currentIds)
    } catch {
      // silently fail
    }
  }, [isDriverOnline, lastPolledOrderIds, setAvailableOrders, setIncomingOrder, setShowIncomingNotification, setLastPolledOrderIds])

  useEffect(() => {
    if (isDriverOnline) {
      // Initial poll
      pollNewOrders()
      // Set up polling every 10 seconds
      pollingRef.current = setInterval(pollNewOrders, 10000)
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [isDriverOnline, pollNewOrders])

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
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Driver Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-72 glass-sidebar z-50 transform transition-transform duration-300 lg:transform-none ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-emerald-600/20">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-sm">ElectroTransport</h2>
                <p className="text-xs text-muted-foreground">Panel de Transportista</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground hover:text-slate-700 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <Separator />
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shadow-sm">
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
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50/80'
                  }`}
                >
                  {item.label}
                  {item.id === 'driver-notifications' && unreadCount > 0 && (
                    <Badge className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center ml-auto">
                      {unreadCount}
                    </Badge>
                  )}
                </button>
              )
            })}
          </nav>
          {currentUser?.driver && (
            <div className="p-4">
              <div className="glass-card rounded-xl p-3 flex items-center gap-3 shadow-sm">
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
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 glass-sidebar border-b border-slate-200/50 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-600 hover:text-slate-800 transition-colors">
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
                <Card className="glass-card border border-slate-200/60 shadow-sm">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center shadow-sm`}>
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

          {/* Map */}
          {isDriverOnline && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border border-slate-200/60 shadow-sm overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                    Mapa de Pedidos y Conductores
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <OrderMap
                    orders={availableOrders.map((o) => ({
                      id: o.id,
                      originLat: o.originLat,
                      originLng: o.originLng,
                      destLat: o.destLat,
                      destLng: o.destLng,
                      proposedPrice: o.proposedPrice,
                      orderNumber: o.orderNumber,
                    }))}
                    drivers={onlineDrivers}
                    height="350px"
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Available orders preview */}
          {isDriverOnline && availableOrders.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-amber-500" />
                  Pedidos Disponibles
                </h2>
                <button onClick={() => setCurrentView('driver-available-orders')} className="text-sm text-emerald-600 font-medium hover:underline">
                  Ver todos ({availableOrders.length})
                </button>
              </div>
              <div className="space-y-3">
                {availableOrders.slice(0, 3).map((order) => (
                  <div key={order.id} className="glass-card border border-slate-200/60 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground bg-slate-50 px-2 py-0.5 rounded-lg">#{order.orderNumber}</span>
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
              <Card className="glass-card border border-slate-200/60 shadow-sm">
                <CardContent className="p-8 text-center">
                  <PowerOff className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="font-semibold text-slate-700 mb-1">Estás Offline</h3>
                  <p className="text-sm text-muted-foreground">Conéctate para ver pedidos disponibles</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Active orders */}
          {driverOrders.filter((o) => o.status === 'accepted' || o.status === 'in_progress').length > 0 && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <h2 className="text-lg font-semibold text-slate-800 mb-3">Pedidos Activos</h2>
              <div className="space-y-3">
                {driverOrders.filter((o) => o.status === 'accepted' || o.status === 'in_progress').map((order) => (
                  <div key={order.id} className="glass-card border-2 border-emerald-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-muted-foreground">#{order.orderNumber}</span>
                      <Badge className="bg-sky-100 text-sky-700 text-xs">{order.status === 'accepted' ? 'Aceptado' : 'En Progreso'}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                      <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{order.originAddress} → {order.destAddress}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="gradient-primary text-white text-xs shadow-sm" onClick={() => {
                        apiFetch(`/api/orders/${order.id}/complete`, { method: 'POST' }).then(() => {
                          toast.success('Pedido entregado')
                          loadData()
                        }).catch(() => toast.error('Error'))
                      }}>
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Marcar Entregado
                      </Button>
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

'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { motion } from 'framer-motion'
import {
  PackagePlus, ClipboardList, CheckCircle2, Truck, TrendingUp,
  Handshake, User, DollarSign
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { apiFetch, formatDate, getStatusColor, getStatusLabel, formatPrice } from '@/lib/api'
import type { OrderItem } from '@/store/use-app-store'

const MapView = dynamic(() => import('@/components/app/map-view'), { ssr: false })

export default function StoreDashboard() {
  const { setCurrentView, setOrders, orders, currentUser } = useAppStore()

  async function loadOrders() {
    try {
      const data = await apiFetch('/api/orders')
      setOrders(data.orders)
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const offerOrders = orders.filter((o) => o.status === 'offer_received')

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    offers: offerOrders.length,
    inProgress: orders.filter((o) => o.status === 'accepted' || o.status === 'in_progress').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
  }

  const recentOrders = orders.filter((o) => o.status !== 'offer_received').slice(0, 5)

  async function handleApproveOffer(orderId: string) {
    try {
      await apiFetch(`/api/orders/${orderId}/approve-offer`, { method: 'POST' })
      toast.success('¡Oferta aceptada!')
      loadOrders()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al aceptar oferta')
    }
  }

  async function handleRejectOffer(orderId: string) {
    try {
      await apiFetch(`/api/orders/${orderId}/reject-offer`, { method: 'POST' })
      toast.success('Oferta declinada')
      loadOrders()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al declinar oferta')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bienvenido, {currentUser?.store?.storeName || currentUser?.name}
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            onClick={() => setCurrentView('store-create-order')}
            className="gradient-primary text-white font-semibold shadow-lg hover:shadow-xl transition-shadow"
          >
            <PackagePlus className="h-4 w-4 mr-2" />
            Crear Pedido
          </Button>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Pedidos', value: stats.total, icon: ClipboardList, color: 'bg-slate-100 text-slate-600', iconColor: 'text-slate-500' },
          { label: 'Pendientes', value: stats.pending, icon: Truck, color: 'bg-amber-100 text-amber-700', iconColor: 'text-amber-500' },
          { label: 'Ofertas Pendientes', value: stats.offers, icon: Handshake, color: 'bg-orange-100 text-orange-700', iconColor: 'text-orange-500' },
          { label: 'En Progreso', value: stats.inProgress, icon: TrendingUp, color: 'bg-sky-100 text-sky-700', iconColor: 'text-sky-500' },
          { label: 'Entregados', value: stats.delivered, icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700', iconColor: 'text-emerald-500' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={`border-none shadow-sm hover:shadow-md transition-shadow ${stat.label === 'Ofertas Pendientes' && stats.offers > 0 ? 'ring-2 ring-orange-300' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                    <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Pending Offers Section */}
      {offerOrders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-orange-800">
                <Handshake className="h-5 w-5" />
                Ofertas Pendientes ({offerOrders.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              {offerOrders.map((order: OrderItem) => (
                <div key={order.id} className="bg-white/80 rounded-xl p-4 border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground bg-slate-50 px-2 py-0.5 rounded">
                        #{order.orderNumber}
                      </span>
                      <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                        Oferta Recibida
                      </Badge>
                    </div>
                  </div>

                  {/* Driver info */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-orange-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-800">{order.driver?.name || 'Transportista'}</span>
                    {order.acceptedPrice && (
                      <span className="text-lg font-bold text-orange-700 ml-auto">{formatPrice(order.acceptedPrice)}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                    <span className="truncate">{order.originAddress} → {order.destAddress}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                      onClick={() => handleApproveOffer(order.id)}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Aceptar Oferta
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50 text-xs"
                      onClick={() => handleRejectOffer(order.id)}
                    >
                      Declinar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-200 text-amber-700 hover:bg-amber-50 text-xs"
                      onClick={() => {
                        useAppStore.getState().setSelectedOrderId(order.id)
                        setCurrentView('store-order-detail')
                      }}
                    >
                      Ver Detalle
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg font-semibold">Pedidos Recientes</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-emerald-600 hover:text-emerald-700 text-sm"
              onClick={() => setCurrentView('store-orders')}
            >
              Ver todos →
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {recentOrders.length === 0 ? (
              <div className="text-center py-10">
                <Truck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No hay pedidos aún</p>
                <p className="text-xs text-muted-foreground mt-1">Crea tu primer pedido de transporte</p>
                <Button
                  className="mt-4 gradient-primary text-white text-sm"
                  onClick={() => setCurrentView('store-create-order')}
                >
                  Crear Pedido
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentOrders.map((order: OrderItem) => (
                  <button
                    key={order.id}
                    onClick={() => {
                      useAppStore.getState().setSelectedOrderId(order.id)
                      setCurrentView('store-order-detail')
                    }}
                    className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-muted-foreground">#{order.orderNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="truncate max-w-[140px]">{order.originAddress}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="truncate max-w-[140px]">{order.destAddress}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
                      <span className="font-semibold text-emerald-600 text-sm">{formatPrice(order.proposedPrice)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Map Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-800">Mapa de Actividad</h2>
          <span className="text-xs text-muted-foreground">Centrado en Quito, Ecuador</span>
        </div>
        <MapView
          height="300px"
          showDriverLocations={true}
          orders={orders
            .filter((o) => o.status === 'accepted' || o.status === 'in_progress' || o.status === 'offer_received')
            .map((o) => ({
              id: o.id,
              originLat: o.originLat,
              originLng: o.originLng,
              destLat: o.destLat,
              destLng: o.destLng,
              status: o.status,
              orderNumber: o.orderNumber,
            }))
          }
        />
      </motion.div>
    </div>
  )
}

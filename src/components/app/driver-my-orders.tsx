'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { motion } from 'framer-motion'
import {
  ChevronLeft, Package, MapPin, CheckCircle2, Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { apiFetch, formatDate, getStatusColor, getStatusLabel, formatPrice } from '@/lib/api'
import type { OrderItem } from '@/store/use-app-store'

export default function DriverMyOrdersPage() {
  const { setCurrentView, driverOrders, setDriverOrders } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    setLoading(true)
    try {
      const data = await apiFetch('/api/orders')
      setDriverOrders(data.orders)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = driverOrders.filter((o) => {
    if (filter === 'all') return true
    if (filter === 'active') return o.status === 'accepted' || o.status === 'in_progress'
    return o.status === filter
  })

  const filterButtons = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'delivered', label: 'Entregados' },
    { value: 'cancelled', label: 'Cancelados' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setCurrentView('driver-dashboard')} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mis Pedidos</h1>
          <p className="text-sm text-muted-foreground">{driverOrders.length} pedidos</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {filterButtons.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f.value ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-16 w-16 text-slate-200 mx-auto mb-4" />
          <p className="text-muted-foreground">No hay pedidos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order: OrderItem, i: number) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xs font-mono text-muted-foreground">#{order.orderNumber}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-600">{formatPrice(order.acceptedPrice || order.proposedPrice)}</span>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{order.originAddress} → {order.destAddress}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatDate(order.createdAt)}
                    </span>
                    {(order.status === 'accepted' || order.status === 'in_progress') && (
                      <Button
                        size="sm"
                        className="gradient-primary text-white text-xs"
                        onClick={async () => {
                          try {
                            await apiFetch(`/api/orders/${order.id}/complete`, { method: 'POST' })
                            toast.success('¡Entrega completada!')
                            loadOrders()
                          } catch {
                            toast.error('Error al completar')
                          }
                        }}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Entregado
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { motion } from 'framer-motion'
import {
  Search, ChevronLeft, Package, MapPin
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { apiFetch, formatDate, getStatusColor, getStatusLabel, formatPrice } from '@/lib/api'
import type { OrderItem } from '@/store/use-app-store'

const filters = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'accepted', label: 'Aceptados' },
  { value: 'in_progress', label: 'En Progreso' },
  { value: 'delivered', label: 'Entregados' },
  { value: 'cancelled', label: 'Cancelados' },
]

export default function StoreOrdersPage() {
  const { setCurrentView, setOrders, orders, orderFilter, setOrderFilter } = useAppStore()
  const [search, setSearch] = useState('')

  async function loadOrders() {
    try {
      const url = orderFilter && orderFilter !== 'all'
        ? `/api/orders?status=${orderFilter}`
        : '/api/orders'
      const data = await apiFetch(url)
      setOrders(data.orders)
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    loadOrders()
  }, [orderFilter])

  const filteredOrders = orders.filter((o) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      o.orderNumber.toLowerCase().includes(s) ||
      o.originAddress.toLowerCase().includes(s) ||
      o.destAddress.toLowerCase().includes(s)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCurrentView('store-dashboard')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mis Pedidos</h1>
          <p className="text-sm text-muted-foreground">{orders.length} pedidos en total</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por número, origen o destino..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setOrderFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              orderFilter === f.value
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-slate-200 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {search ? 'No se encontraron resultados' : 'No hay pedidos con este filtro'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order: OrderItem, i: number) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <button
                onClick={() => {
                  useAppStore.getState().setSelectedOrderId(order.id)
                  setCurrentView('store-order-detail')
                }}
                className="w-full text-left bg-white rounded-xl border border-slate-100 p-4 hover:border-emerald-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground bg-slate-50 px-2 py-0.5 rounded">
                      #{order.orderNumber}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <span className="font-bold text-emerald-600">{formatPrice(order.proposedPrice)}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-slate-700 truncate">{order.originAddress}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-slate-700 truncate">{order.destAddress}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    {order.cargoType && (
                      <Badge variant="outline" className="text-xs">{order.cargoType}</Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
                </div>
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

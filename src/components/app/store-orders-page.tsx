'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { motion } from 'framer-motion'
import {
  Search, ChevronLeft, Package, MapPin, User, DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { apiFetch, formatDate, getStatusColor, getStatusLabel, formatPrice } from '@/lib/api'
import type { OrderItem } from '@/store/use-app-store'

const filters = [
  { value: 'all', label: 'Todos' },
  { value: 'offer_received', label: 'Ofertas Recibidas' },
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
          className="text-[#666] hover:text-white"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Mis Pedidos</h1>
          <p className="text-sm text-[#8a8a8a]">{orders.length} pedidos en total</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
        <Input
          placeholder="Buscar por número, origen o destino..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-[#111] border-[#222] text-white"
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
                ? 'bg-[#1DB954] text-black'
                : 'bg-[#111] text-[#8a8a8a] hover:bg-[#1a1a1a] border border-[#1a1a1a]'
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
            <Package className="h-16 w-16 text-[#333] mx-auto mb-4" />
            <p className="text-[#666]">
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
                className={`w-full text-left bg-[#0a0a0a] rounded-xl border p-4 hover:border-[#1DB954]/30 transition-all ${
                  order.status === 'offer_received'
                    ? 'border-2 border-[#FFC145]/40 animate-pulse-offer'
                    : 'border border-[#1a1a1a]'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#666] bg-[#111] px-2 py-0.5 rounded">
                      #{order.orderNumber}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <span className="font-bold text-[#1DB954]">{formatPrice(order.proposedPrice)}</span>
                </div>

                {/* Offer received - Show driver info and offered price */}
                {order.status === 'offer_received' && (
                  <div className="bg-[#FFC145]/10 rounded-lg p-2 mb-3 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#FFC145]/15 flex items-center justify-center shrink-0">
                      <User className="h-3.5 w-3.5 text-[#FFC145]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#FFC145] truncate">
                        {order.driver?.name || 'Transportista'}
                      </p>
                      <p className="text-xs text-[#FFC145]/70">
                        Ofrece: <span className="font-bold">{formatPrice(order.acceptedPrice || 0)}</span>
                      </p>
                    </div>
                    <DollarSign className="h-4 w-4 text-[#FFC145] shrink-0" />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-[#1DB954] mt-0.5 shrink-0" />
                    <span className="text-[#ccc] truncate">{order.originAddress}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-[#FFC145] mt-0.5 shrink-0" />
                    <span className="text-[#ccc] truncate">{order.destAddress}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1a1a1a]">
                  <div className="flex items-center gap-2">
                    {order.cargoType && (
                      <Badge variant="outline" className="text-xs border-[#1a1a1a] text-[#8a8a8a]">{order.cargoType}</Badge>
                    )}
                  </div>
                  <span className="text-xs text-[#666]">{formatDate(order.createdAt)}</span>
                </div>
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, MapPin, Store, Package, DollarSign,
  CheckCircle2, Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { apiFetch, formatDate, formatPrice } from '@/lib/api'
import type { OrderItem } from '@/store/use-app-store'

export default function DriverAvailableOrdersPage() {
  const { setCurrentView, availableOrders, setAvailableOrders, setDriverOrders, driverOrders } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [counterPrice, setCounterPrice] = useState<string>('')
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    loadAvailable()
  }, [])

  async function loadAvailable() {
    setLoading(true)
    try {
      const data = await apiFetch('/api/orders?type=available')
      setAvailableOrders(data.orders)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  async function handleAccept(price?: number) {
    if (!selectedOrder) return
    setAccepting(true)

    try {
      await apiFetch(`/api/orders/${selectedOrder.id}/accept`, {
        method: 'POST',
        body: JSON.stringify({ acceptedPrice: price || selectedOrder.proposedPrice }),
      })

      toast.success(price ? 'Contraoferta enviada' : '¡Oferta enviada, esperando confirmación del local!')
      setSelectedOrder(null)
      setCounterPrice('')

      // Refresh both lists
      const [availData, ordersData] = await Promise.all([
        apiFetch('/api/orders?type=available'),
        apiFetch('/api/orders'),
      ])
      setAvailableOrders(availData.orders)
      setDriverOrders(ordersData.orders)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al aceptar')
    } finally {
      setAccepting(false)
    }
  }

  // Slider + input synced state for the selected order
  const maxPrice = selectedOrder ? selectedOrder.proposedPrice * 2 : 0
  const minPrice = 0
  const numericCounterPrice = counterPrice ? parseFloat(counterPrice) : selectedOrder?.proposedPrice || 0

  function handleSliderChange(value: number) {
    setCounterPrice(value.toFixed(2))
  }

  function handleInputChange(value: string) {
    const num = parseFloat(value)
    if (value === '' || isNaN(num)) {
      setCounterPrice('')
    } else {
      setCounterPrice(Math.max(minPrice, Math.min(maxPrice, num)).toFixed(2))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setCurrentView('driver-dashboard')} className="text-[#666] hover:text-white">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Pedidos Disponibles</h1>
          <p className="text-sm text-[#8a8a8a]">{availableOrders.length} pedidos esperando transportista</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1DB954]" />
        </div>
      ) : availableOrders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-16 w-16 text-[#333] mx-auto mb-4" />
          <p className="text-[#666] text-lg">No hay pedidos disponibles</p>
          <p className="text-sm text-[#666] mt-1">Vuelve más tarde para ver nuevos pedidos</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {availableOrders.map((order: OrderItem, i: number) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="bg-[#0a0a0a] border border-[#1a1a1a] shadow-none overflow-hidden">
                  {/* Price accent bar */}
                  <div className="h-1 bg-[#1DB954]" />
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-[#666] bg-[#111] px-2 py-0.5 rounded">
                            #{order.orderNumber}
                          </span>
                          {order.store && (
                            <Badge variant="outline" className="text-xs border-[#1a1a1a] text-[#8a8a8a]">
                              <Store className="h-3 w-3 mr-1" />
                              {order.store.storeName}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-[#666]">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#666]">Precio</p>
                        <p className="text-xl font-bold text-[#1DB954]">{formatPrice(order.proposedPrice)}</p>
                      </div>
                    </div>

                    {/* Route */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-[#1DB954] mt-0.5 shrink-0" />
                        <span className="text-[#ccc]">{order.originAddress}</span>
                      </div>
                      <div className="ml-2 border-l-2 border-dashed border-[#222] h-2" />
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-[#FFC145] mt-0.5 shrink-0" />
                        <span className="text-[#ccc]">{order.destAddress}</span>
                      </div>
                    </div>

                    {/* Cargo info */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {order.cargoType && (
                        <Badge variant="secondary" className="text-xs bg-[#111] text-[#8a8a8a]">
                          <Package className="h-3 w-3 mr-1" /> {order.cargoType}
                        </Badge>
                      )}
                      {order.cargoWeight && (
                        <Badge variant="secondary" className="text-xs bg-[#111] text-[#8a8a8a]">{order.cargoWeight} kg</Badge>
                      )}
                      {order.cargoQuantity && (
                        <Badge variant="secondary" className="text-xs bg-[#111] text-[#8a8a8a]">{order.cargoQuantity} uds</Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-[#1DB954] hover:bg-[#17a34a] text-black font-semibold"
                        onClick={() => {
                          setSelectedOrder(order)
                          setCounterPrice('')
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Aceptar {formatPrice(order.proposedPrice)}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Accept Dialog with Slider + Input */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => { if (!open) { setSelectedOrder(null); setCounterPrice('') } }}>
        <DialogContent className="max-w-md bg-[#0a0a0a] border-[#1a1a1a]">
          <DialogHeader>
            <DialogTitle className="text-white">Aceptar Pedido #{selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 py-2">
              <div className="bg-[#111] rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-[#1DB954]" />
                  <span className="text-[#ccc]">{selectedOrder.originAddress}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-[#FFC145]" />
                  <span className="text-[#ccc]">{selectedOrder.destAddress}</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-[#8a8a8a]">Precio propuesto:</span>
                <span className="text-lg font-bold text-[#1DB954]">{formatPrice(selectedOrder.proposedPrice)}</span>
              </div>

              <Separator className="bg-[#1a1a1a]" />

              <div className="space-y-3">
                <p className="text-sm font-medium text-white">¿Quieres contraofertar? (opcional)</p>

                {/* Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#666]">
                    <span>$0.00</span>
                    <span className="text-[#1DB954] font-medium">
                      Propuesto: {formatPrice(selectedOrder.proposedPrice)}
                    </span>
                    <span>{formatPrice(selectedOrder.proposedPrice * 2)}</span>
                  </div>
                  <input
                    type="range"
                    min={minPrice}
                    max={maxPrice}
                    step={0.50}
                    value={numericCounterPrice}
                    onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-[#222] rounded-lg appearance-none cursor-pointer accent-[#1DB954]"
                  />
                </div>

                {/* Exact Value Input */}
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
                  <Input
                    type="number"
                    placeholder="Tu precio exacto"
                    value={counterPrice}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className="pl-10 bg-[#111] border-[#222] text-white"
                    min={minPrice}
                    max={maxPrice}
                    step={0.50}
                  />
                </div>

                {/* Show comparison */}
                {counterPrice && parseFloat(counterPrice) > 0 && parseFloat(counterPrice) !== selectedOrder.proposedPrice && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#666]">Propuesto:</span>
                    <span className="text-[#1DB954] font-medium">{formatPrice(selectedOrder.proposedPrice)}</span>
                    <span className="text-[#666]">→ Tu oferta:</span>
                    <span className={`font-bold ${parseFloat(counterPrice) > selectedOrder.proposedPrice ? 'text-[#FFC145]' : 'text-[#00C9A7]'}`}>
                      {formatPrice(parseFloat(counterPrice))}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setSelectedOrder(null); setCounterPrice('') }} className="border-[#1a1a1a] text-[#8a8a8a]">
              Cancelar
            </Button>
            {counterPrice && parseFloat(counterPrice) > 0 && parseFloat(counterPrice) !== selectedOrder?.proposedPrice && (
              <Button
                className="bg-[#FFC145] hover:bg-[#e0ad3a] text-black"
                onClick={() => handleAccept(parseFloat(counterPrice))}
                disabled={accepting}
              >
                <Send className="h-4 w-4 mr-2" />
                {accepting ? 'Enviando...' : `Contraofertar ${formatPrice(parseFloat(counterPrice))}`}
              </Button>
            )}
            <Button
              className="bg-[#1DB954] hover:bg-[#17a34a] text-black"
              onClick={() => handleAccept()}
              disabled={accepting}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {accepting ? 'Enviando...' : `Aceptar ${formatPrice(selectedOrder?.proposedPrice || 0)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

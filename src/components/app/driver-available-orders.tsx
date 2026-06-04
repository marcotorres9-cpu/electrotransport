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
        <button onClick={() => setCurrentView('driver-dashboard')} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pedidos Disponibles</h1>
          <p className="text-sm text-muted-foreground">{availableOrders.length} pedidos esperando transportista</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      ) : availableOrders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-16 w-16 text-slate-200 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">No hay pedidos disponibles</p>
          <p className="text-sm text-muted-foreground mt-1">Vuelve más tarde para ver nuevos pedidos</p>
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
                <Card className="border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  {/* Price accent bar */}
                  <div className="h-1 gradient-primary" />
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-muted-foreground bg-slate-50 px-2 py-0.5 rounded">
                            #{order.orderNumber}
                          </span>
                          {order.store && (
                            <Badge variant="outline" className="text-xs">
                              <Store className="h-3 w-3 mr-1" />
                              {order.store.storeName}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Precio</p>
                        <p className="text-xl font-bold text-emerald-600">{formatPrice(order.proposedPrice)}</p>
                      </div>
                    </div>

                    {/* Route */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-slate-700">{order.originAddress}</span>
                      </div>
                      <div className="ml-2 border-l-2 border-dashed border-slate-200 h-2" />
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                        <span className="text-slate-700">{order.destAddress}</span>
                      </div>
                    </div>

                    {/* Cargo info */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {order.cargoType && (
                        <Badge variant="secondary" className="text-xs">
                          <Package className="h-3 w-3 mr-1" /> {order.cargoType}
                        </Badge>
                      )}
                      {order.cargoWeight && (
                        <Badge variant="secondary" className="text-xs">{order.cargoWeight} kg</Badge>
                      )}
                      {order.cargoQuantity && (
                        <Badge variant="secondary" className="text-xs">{order.cargoQuantity} uds</Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 gradient-primary text-white font-semibold"
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Aceptar Pedido #{selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 py-2">
              <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-emerald-500" />
                  <span>{selectedOrder.originAddress}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-amber-500" />
                  <span>{selectedOrder.destAddress}</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Precio propuesto:</span>
                <span className="text-lg font-bold text-emerald-600">{formatPrice(selectedOrder.proposedPrice)}</span>
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-sm font-medium">¿Quieres contraofertar? (opcional)</p>

                {/* Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>$0.00</span>
                    <span className="text-emerald-600 font-medium">
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
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>

                {/* Exact Value Input */}
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Tu precio exacto"
                    value={counterPrice}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className="pl-10"
                    min={minPrice}
                    max={maxPrice}
                    step={0.50}
                  />
                </div>

                {/* Show comparison */}
                {counterPrice && parseFloat(counterPrice) > 0 && parseFloat(counterPrice) !== selectedOrder.proposedPrice && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Propuesto:</span>
                    <span className="text-emerald-600 font-medium">{formatPrice(selectedOrder.proposedPrice)}</span>
                    <span className="text-muted-foreground">→ Tu oferta:</span>
                    <span className={`font-bold ${parseFloat(counterPrice) > selectedOrder.proposedPrice ? 'text-orange-600' : 'text-sky-600'}`}>
                      {formatPrice(parseFloat(counterPrice))}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setSelectedOrder(null); setCounterPrice('') }}>
              Cancelar
            </Button>
            {counterPrice && parseFloat(counterPrice) > 0 && parseFloat(counterPrice) !== selectedOrder?.proposedPrice && (
              <Button
                className="bg-amber-500 hover:bg-amber-600 text-white"
                onClick={() => handleAccept(parseFloat(counterPrice))}
                disabled={accepting}
              >
                <Send className="h-4 w-4 mr-2" />
                {accepting ? 'Enviando...' : `Contraofertar ${formatPrice(parseFloat(counterPrice))}`}
              </Button>
            )}
            <Button
              className="gradient-primary text-white"
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

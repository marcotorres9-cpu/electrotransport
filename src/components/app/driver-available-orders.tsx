'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import {
  ChevronLeft, MapPin, Store, Package, DollarSign,
  CheckCircle2, Send, Navigation
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import { apiFetch, formatDate, formatPrice } from '@/lib/api'
import type { OrderItem } from '@/store/use-app-store'

const OrderMap = dynamic(() => import('./order-map'), { ssr: false })

export default function DriverAvailableOrdersPage() {
  const {
    setCurrentView, availableOrders, setAvailableOrders, setDriverOrders, driverOrders,
    setIncomingOrder, setShowIncomingNotification, lastPolledOrderIds, setLastPolledOrderIds,
  } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null)
  const [counterPrice, setCounterPrice] = useState(0)
  const [accepting, setAccepting] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadAvailable()
  }, [])

  // Polling for new orders
  const pollNewOrders = useCallback(async () => {
    try {
      const availData = await apiFetch('/api/orders?type=available')
      const newOrders = availData.orders as OrderItem[]
      const currentIds = newOrders.map((o) => o.id)
      const newOrderIds = currentIds.filter((id) => !lastPolledOrderIds.includes(id))

      if (newOrderIds.length > 0) {
        const newOrder = newOrders.find((o) => newOrderIds.includes(o.id))
        if (newOrder) {
          setIncomingOrder(newOrder)
          setShowIncomingNotification(true)
        }
      }

      setAvailableOrders(newOrders)
      setLastPolledOrderIds(currentIds)
    } catch {
      // silently fail
    }
  }, [lastPolledOrderIds, setAvailableOrders, setIncomingOrder, setShowIncomingNotification, setLastPolledOrderIds])

  useEffect(() => {
    // Initial load sets lastPolledOrderIds
    if (availableOrders.length > 0 && lastPolledOrderIds.length === 0) {
      setLastPolledOrderIds(availableOrders.map((o) => o.id))
    }

    pollingRef.current = setInterval(pollNewOrders, 10000)
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [availableOrders, lastPolledOrderIds, pollNewOrders, setLastPolledOrderIds])

  async function loadAvailable() {
    setLoading(true)
    try {
      const data = await apiFetch('/api/orders?type=available')
      setAvailableOrders(data.orders)
      if (data.orders.length > 0 && lastPolledOrderIds.length === 0) {
        setLastPolledOrderIds(data.orders.map((o: OrderItem) => o.id))
      }
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

      toast.success(price !== undefined && price !== selectedOrder.proposedPrice ? 'Contraoferta enviada' : '¡Pedido aceptado!')
      setSelectedOrder(null)

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

  // Counter-offer price range
  const minPrice = selectedOrder ? Math.floor(selectedOrder.proposedPrice * 0.8) : 0
  const maxPrice = selectedOrder ? Math.ceil(selectedOrder.proposedPrice * 1.5) : 100
  const sliderValue = selectedOrder ? ((counterPrice - minPrice) / (maxPrice - minPrice)) * 100 : 50

  function openOrderDialog(order: OrderItem) {
    setSelectedOrder(order)
    setCounterPrice(order.proposedPrice)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setCurrentView('driver-dashboard')} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800">Pedidos Disponibles</h1>
          <p className="text-sm text-muted-foreground">{availableOrders.length} pedidos esperando transportista</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMap(!showMap)}
          className="gap-2"
        >
          <MapPin className="h-4 w-4" />
          {showMap ? 'Lista' : 'Mapa'}
        </Button>
      </div>

      {/* Map View */}
      {showMap && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.3 }}>
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
            height="400px"
          />
        </motion.div>
      )}

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
                <Card className="glass-card border border-slate-200/60 shadow-sm hover:shadow-lg transition-all overflow-hidden">
                  {/* Price accent bar */}
                  <div className="h-1 gradient-primary" />
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-muted-foreground bg-slate-50 px-2 py-0.5 rounded-lg">
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

                    {/* Distance info */}
                    {order.distanceKm && (
                      <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
                        <Navigation className="h-3.5 w-3.5" />
                        <span>{order.distanceKm.toFixed(1)} km</span>
                        {order.estimatedTime && <span>· ~{order.estimatedTime} min</span>}
                      </div>
                    )}

                    {/* Route */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-start gap-2 text-sm">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span className="text-slate-700">{order.originAddress}</span>
                      </div>
                      <div className="ml-1 border-l-2 border-dashed border-slate-200 h-2" />
                      <div className="flex items-start gap-2 text-sm">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
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
                        className="flex-1 gradient-primary text-white font-semibold shadow-sm"
                        onClick={() => openOrderDialog(order)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Ver y Aceptar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Accept Dialog with Enhanced Bidding */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => { if (!open) setSelectedOrder(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-emerald-600" />
              Pedido #{selectedOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 py-2">
              {/* Route */}
              <div className="bg-gradient-to-br from-slate-50 to-emerald-50/30 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-slate-700">{selectedOrder.originAddress}</span>
                </div>
                <div className="ml-1 border-l-2 border-dashed border-slate-200 h-2" />
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-slate-700">{selectedOrder.destAddress}</span>
                </div>
              </div>

              {/* Distance */}
              {selectedOrder.distanceKm && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Navigation className="h-4 w-4" />
                  <span>{selectedOrder.distanceKm.toFixed(1)} km</span>
                  {selectedOrder.estimatedTime && <span>· ~{selectedOrder.estimatedTime} min de viaje</span>}
                </div>
              )}

              {/* Price + Slider */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-emerald-700 font-medium">Precio del local:</span>
                  <span className="text-lg font-bold text-emerald-600">{formatPrice(selectedOrder.proposedPrice)}</span>
                </div>

                <Separator className="mb-3" />

                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Tu contraoferta:</span>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                    <input
                      type="number"
                      min={minPrice}
                      max={maxPrice}
                      step="0.50"
                      value={counterPrice.toFixed(2)}
                      onChange={(e) => {
                        let val = parseFloat(e.target.value)
                        if (isNaN(val)) val = minPrice
                        val = Math.max(minPrice, Math.min(maxPrice, val))
                        setCounterPrice(val)
                      }}
                      className="w-32 bg-white border border-emerald-300 rounded-lg pl-8 pr-2 py-2 text-emerald-700 font-bold text-base text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
                <Slider
                  value={[sliderValue]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(v) => {
                    const pct = v[0] / 100
                    const newPrice = Math.round((minPrice + pct * (maxPrice - minPrice)) * 100) / 100
                    setCounterPrice(newPrice)
                  }}
                  className="w-full mb-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatPrice(minPrice)} (mín)</span>
                  <span>{formatPrice(maxPrice)} (máx)</span>
                </div>

                {/* Comparison */}
                {counterPrice !== selectedOrder.proposedPrice && (
                  <div className="mt-3 pt-3 border-t border-emerald-200/50 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Local propuso:</span>
                      <span className="text-slate-600">{formatPrice(selectedOrder.proposedPrice)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-emerald-600 font-medium">Tu oferta:</span>
                      <span className={`font-semibold ${counterPrice < selectedOrder.proposedPrice ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {formatPrice(counterPrice)}
                        {counterPrice < selectedOrder.proposedPrice && (
                          <span className="text-amber-500 ml-1">
                            (ahorro: {formatPrice(selectedOrder.proposedPrice - counterPrice)})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setSelectedOrder(null)} className="flex-1">
              Cancelar
            </Button>
            {counterPrice !== selectedOrder?.proposedPrice && (
              <Button
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                onClick={() => handleAccept(counterPrice)}
                disabled={accepting}
              >
                <Send className="h-4 w-4 mr-2" />
                {accepting ? '...' : `Contraofertar`}
              </Button>
            )}
            <Button
              className="flex-1 gradient-primary text-white font-semibold"
              onClick={() => handleAccept()}
              disabled={accepting}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {accepting ? '...' : 'ACEPTAR'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

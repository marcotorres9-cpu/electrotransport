'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { motion } from 'framer-motion'
import {
  MapPin, Clock, Package, DollarSign, User, Phone, Car,
  ChevronLeft, CheckCircle2, XCircle, AlertCircle, Handshake,
  Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { apiFetch, formatDate, getStatusColor, getStatusLabel, formatPrice } from '@/lib/api'

const statusSteps = [
  { key: 'pending', label: 'Pendiente', icon: Clock },
  { key: 'offer_received', label: 'Oferta', icon: Handshake },
  { key: 'accepted', label: 'Aceptado', icon: CheckCircle2 },
  { key: 'in_progress', label: 'En Progreso', icon: Car },
  { key: 'delivered', label: 'Entregado', icon: CheckCircle2 },
]

export default function OrderDetailPage() {
  const { selectedOrderId, setCurrentView, setOrders, currentUser } = useAppStore()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cancelDialog, setCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (selectedOrderId) {
      loadOrder()
    }
  }, [selectedOrderId])

  async function loadOrder() {
    if (!selectedOrderId) return
    setLoading(true)
    try {
      const data = await apiFetch(`/api/orders/${selectedOrderId}`)
      setOrder(data.order)
    } catch {
      toast.error('Error al cargar el pedido')
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel() {
    if (!selectedOrderId) return
    try {
      await apiFetch(`/api/orders/${selectedOrderId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ cancelReason: cancelReason || 'Cancelado por el usuario' }),
      })
      toast.success('Pedido cancelado')
      setCancelDialog(false)
      loadOrder()
      const ordersData = await apiFetch('/api/orders')
      setOrders(ordersData.orders)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cancelar')
    }
  }

  async function handleApproveOffer() {
    if (!selectedOrderId) return
    setActionLoading('approve')
    try {
      await apiFetch(`/api/orders/${selectedOrderId}/approve-offer`, { method: 'POST' })
      toast.success('¡Oferta aceptada!')
      loadOrder()
      const ordersData = await apiFetch('/api/orders')
      setOrders(ordersData.orders)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al aceptar oferta')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRejectOffer() {
    if (!selectedOrderId) return
    setActionLoading('reject')
    try {
      await apiFetch(`/api/orders/${selectedOrderId}/reject-offer`, { method: 'POST' })
      toast.success('Oferta declinada, buscando otro transportista')
      loadOrder()
      const ordersData = await apiFetch('/api/orders')
      setOrders(ordersData.orders)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al declinar oferta')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1DB954]" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="h-12 w-12 text-[#666666] mx-auto mb-3" />
        <p className="text-[#888888]">Pedido no encontrado</p>
        <Button className="mt-4 bg-[#1DB954] hover:bg-[#17a34a] text-black" onClick={() => setCurrentView('store-orders')}>Volver</Button>
      </div>
    )
  }

  const currentStepIndex = statusSteps.findIndex((s) => s.key === order.status)
  const isCreator = currentUser?.id === order.createdBy
  const isOfferReceived = order.status === 'offer_received'

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => setCurrentView('store-orders')} className="text-[#888888] hover:text-white">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">Pedido #{order.orderNumber}</h1>
          <p className="text-sm text-[#8a8a8a]">{formatDate(order.createdAt)}</p>
        </div>
        <Badge className={`${getStatusColor(order.status)} text-xs px-3 py-1`}>
          {getStatusLabel(order.status)}
        </Badge>
      </div>

      {/* Status Timeline */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-[#1e1e1e] border border-[#333333] shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between overflow-x-auto">
              {statusSteps.map((step, i) => {
                const Icon = step.icon
                const isActive = i <= currentStepIndex
                const isCurrent = i === currentStepIndex
                return (
                  <div key={step.key} className="flex flex-col items-center flex-1 relative min-w-[60px]">
                    {i > 0 && (
                      <div className={`absolute top-4 right-1/2 left-[-50%] h-0.5 ${
                        i <= currentStepIndex ? 'bg-[#1DB954]' : 'bg-[#2e2e2e]'
                      }`} />
                    )}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                      isCurrent
                        ? 'bg-[#1DB954] text-white ring-4 ring-[#1DB954]/20'
                        : isActive
                        ? 'bg-[#1DB954] text-white'
                        : 'bg-[#2e2e2e] text-[#777777]'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className={`text-xs mt-1.5 text-center ${isActive ? 'text-[#1DB954] font-medium' : 'text-[#777777]'}`}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Offer Received - Special Section for Store */}
      {isOfferReceived && isCreator && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="border-2 border-[#FFC145]/40 bg-[#1e1e1e]">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#FFC145]/15 flex items-center justify-center">
                  <Handshake className="h-5 w-5 text-[#FFC145]" />
                </div>
                <div>
                  <p className="font-semibold text-[#FFC145]">¡Oferta del Transportista!</p>
                  <p className="text-sm text-[#FFC145]/70">Revisa la oferta y decide</p>
                </div>
              </div>

              {/* Driver Info */}
              {order.driver && (
                <div className="flex items-center gap-3 mb-4 bg-[#262626] rounded-xl p-3 border border-[#333333]">
                  <div className="w-10 h-10 rounded-full bg-[#1DB954]/15 flex items-center justify-center">
                    <span className="text-[#1DB954] font-bold">{order.driver.name?.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{order.driver.name}</p>
                    {order.driver.driver && (
                      <p className="text-xs text-[#8a8a8a] flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        {order.driver.driver.vehicleType}
                        {order.driver.driver.vehiclePlate && ` · ${order.driver.driver.vehiclePlate}`}
                      </p>
                    )}
                  </div>
                  {order.driver.phone && (
                    <Badge variant="outline" className="text-xs border-[#333333] text-[#8a8a8a]">
                      <Phone className="h-3 w-3 mr-1" />
                      {order.driver.phone}
                    </Badge>
                  )}
                </div>
              )}

              {/* Offer Price */}
              <div className="bg-[#262626] rounded-xl p-3 mb-4 border border-[#333333]">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#8a8a8a]">Precio propuesto por ti:</span>
                  <span className="font-medium text-[#ccc]">{formatPrice(order.proposedPrice)}</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#FFC145]/20">
                  <span className="text-sm font-semibold text-[#FFC145]">Oferta del transportista:</span>
                  <span className="text-xl font-bold text-[#FFC145]">{formatPrice(order.acceptedPrice || 0)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  className="w-full bg-[#1DB954] hover:bg-[#17a34a] text-black font-semibold"
                  onClick={handleApproveOffer}
                  disabled={actionLoading === 'approve'}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {actionLoading === 'approve' ? 'Aceptando...' : `Aceptar Oferta ${formatPrice(order.acceptedPrice || 0)}`}
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-[#FF6B6B]/30 text-[#FF6B6B] hover:bg-[#FF6B6B]/10"
                    onClick={handleRejectOffer}
                    disabled={actionLoading === 'reject'}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {actionLoading === 'reject' ? 'Declinando...' : 'Declinar Oferta'}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-[#FFC145]/30 text-[#FFC145] hover:bg-[#FFC145]/10"
                    onClick={handleRejectOffer}
                    disabled={actionLoading === 'reject'}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {actionLoading === 'reject' ? 'Buscando...' : 'Buscar Otro'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Route */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="bg-[#1e1e1e] border border-[#333333] shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-white">
              <MapPin className="h-5 w-5 text-[#1DB954]" />
              Ruta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-[#1DB954] mt-1.5 shrink-0" />
              <div>
                <p className="text-xs text-[#888888]">Origen</p>
                <p className="text-sm text-[#ccc]">{order.originAddress}</p>
              </div>
            </div>
            <div className="ml-1.5 border-l-2 border-dashed border-[#333] h-4" />
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-[#FFC145] mt-1.5 shrink-0" />
              <div>
                <p className="text-xs text-[#888888]">Destino</p>
                <p className="text-sm text-[#ccc]">{order.destAddress}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Cargo Details */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="bg-[#1e1e1e] border border-[#333333] shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-white">
              <Package className="h-5 w-5 text-[#1DB954]" />
              Detalles de la Carga
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {order.cargoType && (
                <div>
                  <p className="text-xs text-[#888888]">Tipo</p>
                  <p className="text-sm font-medium text-white">{order.cargoType}</p>
                </div>
              )}
              {order.cargoWeight && (
                <div>
                  <p className="text-xs text-[#888888]">Peso</p>
                  <p className="text-sm font-medium text-white">{order.cargoWeight} kg</p>
                </div>
              )}
              {order.cargoQuantity && (
                <div>
                  <p className="text-xs text-[#888888]">Cantidad</p>
                  <p className="text-sm font-medium text-white">{order.cargoQuantity} unidades</p>
                </div>
              )}
            </div>
            {order.specialNotes && (
              <div className="mt-3 pt-3 border-t border-[#333333]">
                <p className="text-xs text-[#888888] mb-1">Notas especiales</p>
                <p className="text-sm text-[#8a8a8a]">{order.specialNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Price */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-2 border-[#1DB954]/30 bg-[#1e1e1e]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-[#1DB954]">
              <DollarSign className="h-5 w-5 text-[#1DB954]" />
              Precios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-[#1DB954]">Precio propuesto</span>
              <span className="font-bold text-[#1DB954]">{formatPrice(order.proposedPrice)}</span>
            </div>
            {order.counterPrice && (
              <div className="flex justify-between">
                <span className="text-sm text-[#FFC145]">Contraoferta</span>
                <span className="font-bold text-[#FFC145]">{formatPrice(order.counterPrice)}</span>
              </div>
            )}
            {order.acceptedPrice && (
              <div className="flex justify-between pt-2 border-t border-[#1DB954]/20">
                <span className="text-sm font-semibold text-[#1DB954]">Precio aceptado</span>
                <span className="text-lg font-bold text-[#1DB954]">{formatPrice(order.acceptedPrice)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Driver Info (for non-offer statuses) */}
      {order.driver && !isOfferReceived && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="bg-[#1e1e1e] border border-[#333333] shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-white">
                <User className="h-5 w-5 text-[#8a8a8a]" />
                Transportista
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-[#1DB954]/15 flex items-center justify-center">
                  <span className="text-[#1DB954] font-bold">{order.driver.name?.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-semibold text-white">{order.driver.name}</p>
                  {order.driver.phone && (
                    <p className="text-sm text-[#8a8a8a] flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {order.driver.phone}
                    </p>
                  )}
                </div>
              </div>
              {order.driver.driver && (
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs border-[#333333] text-[#8a8a8a]">
                    <Car className="h-3 w-3 mr-1" />
                    {order.driver.driver.vehicleType}
                  </Badge>
                  {order.driver.driver.vehiclePlate && (
                    <Badge variant="outline" className="text-xs border-[#333333] text-[#8a8a8a]">{order.driver.driver.vehiclePlate}</Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Actions (Cancel for pending/accepted) */}
      {isCreator && (order.status === 'pending' || order.status === 'accepted') && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-[#FF6B6B]/30 text-[#FF6B6B] hover:bg-[#FF6B6B]/10"
              onClick={() => setCancelDialog(true)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancelar Pedido
            </Button>
          </div>
        </motion.div>
      )}

      {/* Cancel Dialog */}
      <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
        <DialogContent className="bg-[#1e1e1e] border-[#333333]">
          <DialogHeader>
            <DialogTitle className="text-white">¿Cancelar pedido #{order.orderNumber}?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-[#8a8a8a]">Esta acción no se puede deshacer.</p>
            <Textarea
              placeholder="Razón de cancelación (opcional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="bg-[#262626] border-[#2e2e2e] text-white"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelDialog(false)} className="border-[#333333] text-[#8a8a8a]">No, volver</Button>
            <Button className="bg-[#FF6B6B] hover:bg-[#e55c5c] text-white" onClick={handleCancel}>
              Sí, cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

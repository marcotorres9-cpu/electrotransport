'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { motion } from 'framer-motion'
import {
  MapPin, Clock, Package, DollarSign, User, Phone, Car,
  ChevronLeft, CheckCircle2, XCircle, AlertCircle
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
      // Refresh orders list
      const ordersData = await apiFetch('/api/orders')
      setOrders(ordersData.orders)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cancelar')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <p className="text-muted-foreground">Pedido no encontrado</p>
        <Button className="mt-4" onClick={() => setCurrentView('store-orders')}>Volver</Button>
      </div>
    )
  }

  const currentStepIndex = statusSteps.findIndex((s) => s.key === order.status)
  const isCreator = currentUser?.id === order.createdBy

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => setCurrentView('store-orders')} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-800">Pedido #{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
        </div>
        <Badge className={`${getStatusColor(order.status)} text-xs px-3 py-1`}>
          {getStatusLabel(order.status)}
        </Badge>
      </div>

      {/* Status Timeline */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {statusSteps.map((step, i) => {
                const Icon = step.icon
                const isActive = i <= currentStepIndex
                const isCurrent = i === currentStepIndex
                return (
                  <div key={step.key} className="flex flex-col items-center flex-1 relative">
                    {i > 0 && (
                      <div className={`absolute top-4 right-1/2 left-[-50%] h-0.5 ${
                        i <= currentStepIndex ? 'bg-emerald-400' : 'bg-slate-200'
                      }`} />
                    )}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                      isCurrent
                        ? 'bg-emerald-500 text-white ring-4 ring-emerald-100'
                        : isActive
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-400'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className={`text-xs mt-1.5 text-center ${isActive ? 'text-emerald-700 font-medium' : 'text-muted-foreground'}`}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Route */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emerald-600" />
              Ruta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Origen</p>
                <p className="text-sm text-slate-700">{order.originAddress}</p>
              </div>
            </div>
            <div className="ml-1.5 border-l-2 border-dashed border-slate-200 h-4" />
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Destino</p>
                <p className="text-sm text-slate-700">{order.destAddress}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Cargo Details */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-teal-600" />
              Detalles del Carga
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {order.cargoType && (
                <div>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <p className="text-sm font-medium">{order.cargoType}</p>
                </div>
              )}
              {order.cargoWeight && (
                <div>
                  <p className="text-xs text-muted-foreground">Peso</p>
                  <p className="text-sm font-medium">{order.cargoWeight} kg</p>
                </div>
              )}
              {order.cargoQuantity && (
                <div>
                  <p className="text-xs text-muted-foreground">Cantidad</p>
                  <p className="text-sm font-medium">{order.cargoQuantity} unidades</p>
                </div>
              )}
            </div>
            {order.specialNotes && (
              <div className="mt-3 pt-3 border-t border-slate-50">
                <p className="text-xs text-muted-foreground mb-1">Notas especiales</p>
                <p className="text-sm text-slate-600">{order.specialNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Price */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-emerald-800">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Precios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-emerald-700">Precio propuesto</span>
              <span className="font-bold text-emerald-700">{formatPrice(order.proposedPrice)}</span>
            </div>
            {order.counterPrice && (
              <div className="flex justify-between">
                <span className="text-sm text-amber-700">Contraoferta</span>
                <span className="font-bold text-amber-700">{formatPrice(order.counterPrice)}</span>
              </div>
            )}
            {order.acceptedPrice && (
              <div className="flex justify-between pt-2 border-t border-emerald-200">
                <span className="text-sm font-semibold text-emerald-800">Precio aceptado</span>
                <span className="text-lg font-bold text-emerald-800">{formatPrice(order.acceptedPrice)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Driver Info */}
      {order.driver && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User className="h-5 w-5 text-slate-600" />
                Transportista
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-emerald-700 font-bold">{order.driver.name?.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{order.driver.name}</p>
                  {order.driver.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {order.driver.phone}
                    </p>
                  )}
                </div>
              </div>
              {order.driver.driver && (
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Car className="h-3 w-3 mr-1" />
                    {order.driver.driver.vehicleType}
                  </Badge>
                  {order.driver.driver.vehiclePlate && (
                    <Badge variant="outline" className="text-xs">{order.driver.driver.vehiclePlate}</Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Actions */}
      {isCreator && (order.status === 'pending' || order.status === 'accepted') && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Cancelar pedido #{order.orderNumber}?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Esta acción no se puede deshacer.</p>
            <Textarea
              placeholder="Razón de cancelación (opcional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelDialog(false)}>No, volver</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleCancel}>
              Sí, cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

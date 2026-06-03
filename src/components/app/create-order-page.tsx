'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { motion } from 'framer-motion'
import {
  MapPin, DollarSign, Package, Weight, Hash, FileText,
  ChevronLeft, Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'

const cargoTypes = [
  { value: 'refrigeradora', label: 'Refrigeradora' },
  { value: 'lavadora', label: 'Lavadora' },
  { value: 'microondas', label: 'Microondas' },
  { value: 'television', label: 'Televisión' },
  { value: 'cocina', label: 'Cocina / Estufa' },
  { value: 'aire_acondicionado', label: 'Aire Acondicionado' },
  { value: 'secadora', label: 'Secadora' },
  { value: 'lavavajillas', label: 'Lavavajillas' },
  { value: 'varios', label: 'Varios' },
]

export default function CreateOrderPage() {
  const { setCurrentView, setOrders } = useAppStore()

  const [originAddress, setOriginAddress] = useState('')
  const [originLat, setOriginLat] = useState('')
  const [originLng, setOriginLng] = useState('')
  const [destAddress, setDestAddress] = useState('')
  const [destLat, setDestLat] = useState('')
  const [destLng, setDestLng] = useState('')
  const [cargoType, setCargoType] = useState('')
  const [cargoWeight, setCargoWeight] = useState('')
  const [cargoQuantity, setCargoQuantity] = useState('')
  const [specialNotes, setSpecialNotes] = useState('')
  const [proposedPrice, setProposedPrice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!originAddress || !destAddress || !proposedPrice) {
      toast.error('Origen, destino y precio propuesto son obligatorios')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await apiFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          originAddress,
          originLat: originLat ? parseFloat(originLat) : 0,
          originLng: originLng ? parseFloat(originLng) : 0,
          destAddress,
          destLat: destLat ? parseFloat(destLat) : 0,
          destLng: destLng ? parseFloat(destLng) : 0,
          cargoType: cargoType || null,
          cargoWeight: cargoWeight ? parseFloat(cargoWeight) : null,
          cargoQuantity: cargoQuantity ? parseInt(cargoQuantity) : null,
          specialNotes: specialNotes || null,
          proposedPrice: parseFloat(proposedPrice),
        }),
      })

      toast.success('¡Pedido creado exitosamente! Esperando transportistas...')

      // Reload orders
      const ordersData = await apiFetch('/api/orders')
      setOrders(ordersData.orders)

      setCurrentView('store-orders')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear el pedido')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCurrentView('store-dashboard')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Nuevo Pedido</h1>
          <p className="text-sm text-muted-foreground">Solicita transporte para tus electrodomésticos</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Origin */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-600" />
                Origen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="originAddress">Dirección de origen</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="originAddress"
                    placeholder="Av. Monseñor Rivero #123, Santa Cruz"
                    value={originAddress}
                    onChange={(e) => setOriginAddress(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="originLat">Latitud</Label>
                  <Input id="originLat" placeholder="-17.784" value={originLat} onChange={(e) => setOriginLat(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="originLng">Longitud</Label>
                  <Input id="originLng" placeholder="-63.182" value={originLng} onChange={(e) => setOriginLng(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Destination */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-amber-500" />
                Destino
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="destAddress">Dirección de destino</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="destAddress"
                    placeholder="Calle Sucre #456, El Alto"
                    value={destAddress}
                    onChange={(e) => setDestAddress(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="destLat">Latitud</Label>
                  <Input id="destLat" placeholder="-16.503" value={destLat} onChange={(e) => setDestLat(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destLng">Longitud</Label>
                  <Input id="destLng" placeholder="-68.174" value={destLng} onChange={(e) => setDestLng(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Cargo */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-teal-600" />
                Detalles del Carga
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Tipo de electrodoméstico</Label>
                <Select value={cargoType} onValueChange={setCargoType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {cargoTypes.map((ct) => (
                      <SelectItem key={ct.value} value={ct.value}>
                        {ct.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <div className="relative">
                    <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="weight" placeholder="80" value={cargoWeight} onChange={(e) => setCargoWeight(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Cantidad</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="quantity" placeholder="2" value={cargoQuantity} onChange={(e) => setCargoQuantity(e.target.value)} className="pl-10" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas especiales</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="notes"
                    placeholder="Fragil, requiere cuidado especial..."
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    className="pl-10"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Price */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-emerald-800">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Precio Propuesto
              </CardTitle>
              <CardDescription className="text-emerald-600">
                Elige tu precio. Los transportistas pueden aceptar o contraofertar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="price" className="text-emerald-700 font-semibold">
                  ¿Cuánto quieres pagar? (USD)
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-600" />
                  <Input
                    id="price"
                    type="number"
                    placeholder="50.00"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    className="pl-10 text-xl font-bold border-emerald-300 bg-white focus:border-emerald-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Submit */}
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button
            type="submit"
            className="w-full gradient-primary text-white font-semibold py-6 text-base shadow-lg hover:shadow-xl"
            disabled={isSubmitting}
          >
            <Send className="h-5 w-5 mr-2" />
            {isSubmitting ? 'Publicando Pedido...' : 'Publicar Pedido'}
          </Button>
        </motion.div>
      </form>
    </div>
  )
}

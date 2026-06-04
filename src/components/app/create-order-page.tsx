'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import {
  MapPin, DollarSign, Package, Weight, Hash, FileText,
  ChevronLeft, Send, Navigation, Search
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

const OrderMap = dynamic(() => import('./order-map'), { ssr: false })

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
  const [selectingOrigin, setSelectingOrigin] = useState(false)
  const [selectingDest, setSelectingDest] = useState(false)
  const [geocodingLoading, setGeocodingLoading] = useState(false)
  const [distanceInfo, setDistanceInfo] = useState<{ km: number; time: number } | null>(null)

  // Geocode address using Nominatim
  async function geocodeAddress(address: string) {
    if (!address || address.length < 5) return null
    setGeocodingLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=bo`
      )
      const data = await res.json()
      if (data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          displayName: data[0].display_name,
        }
      }
    } catch {
      // silently fail
    } finally {
      setGeocodingLoading(false)
    }
    return null
  }

  // Estimate distance between two points (Haversine formula)
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Update distance estimate when coordinates change
  useEffect(() => {
    if (originLat && originLng && destLat && destLng) {
      const lat1 = parseFloat(originLat)
      const lon1 = parseFloat(originLng)
      const lat2 = parseFloat(destLat)
      const lon2 = parseFloat(destLng)

      if (lat1 !== 0 && lon1 !== 0 && lat2 !== 0 && lon2 !== 0) {
        const km = calculateDistance(lat1, lon1, lat2, lon2)
        // Average speed ~30 km/h in city
        const timeMin = Math.round((km / 30) * 60)
        setDistanceInfo({ km, time: timeMin })
      }
    } else {
      setDistanceInfo(null)
    }
  }, [originLat, originLng, destLat, destLng])

  // Handle map click
  function handleMapClick(lat: number, lng: number) {
    if (selectingOrigin) {
      setOriginLat(lat.toString())
      setOriginLng(lng.toString())
      setSelectingOrigin(false)
      // Reverse geocode
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.display_name) {
            setOriginAddress(data.display_name.split(',').slice(0, 3).join(','))
          }
        })
        .catch(() => {})
    } else if (selectingDest) {
      setDestLat(lat.toString())
      setDestLng(lng.toString())
      setSelectingDest(false)
      // Reverse geocode
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.display_name) {
            setDestAddress(data.display_name.split(',').slice(0, 3).join(','))
          }
        })
        .catch(() => {})
    }
  }

  async function handleGeocodeOrigin() {
    const result = await geocodeAddress(originAddress)
    if (result) {
      setOriginLat(result.lat.toString())
      setOriginLng(result.lng.toString())
      toast.success('Origen localizado en el mapa')
    } else {
      toast.error('No se encontró la dirección')
    }
  }

  async function handleGeocodeDest() {
    const result = await geocodeAddress(destAddress)
    if (result) {
      setDestLat(result.lat.toString())
      setDestLng(result.lng.toString())
      toast.success('Destino localizado en el mapa')
    } else {
      toast.error('No se encontró la dirección')
    }
  }

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
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Nuevo Pedido</h1>
          <p className="text-sm text-muted-foreground">Solicita transporte para tus electrodomésticos</p>
        </div>
      </div>

      {/* Map for selecting addresses */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border border-slate-200/60 shadow-sm overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emerald-600" />
              Mapa de Ruta
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <OrderMap
              originLat={originLat ? parseFloat(originLat) : undefined}
              originLng={originLng ? parseFloat(originLng) : undefined}
              destLat={destLat ? parseFloat(destLat) : undefined}
              destLng={destLng ? parseFloat(destLng) : undefined}
              originAddress={originAddress}
              destAddress={destAddress}
              onMapClick={handleMapClick}
              selectingOrigin={selectingOrigin}
              selectingDest={selectingDest}
              height="280px"
            />
            <div className="flex gap-2 p-3 bg-slate-50">
              <Button
                size="sm"
                variant={selectingOrigin ? 'default' : 'outline'}
                className={`flex-1 text-xs ${selectingOrigin ? 'gradient-primary text-white' : ''}`}
                onClick={() => { setSelectingOrigin(!selectingOrigin); setSelectingDest(false) }}
              >
                <MapPin className="h-3 w-3 mr-1" />
                {selectingOrigin ? 'Haz clic en el mapa...' : 'Marcar Origen'}
              </Button>
              <Button
                size="sm"
                variant={selectingDest ? 'default' : 'outline'}
                className={`flex-1 text-xs ${selectingDest ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`}
                onClick={() => { setSelectingDest(!selectingDest); setSelectingOrigin(false) }}
              >
                <MapPin className="h-3 w-3 mr-1" />
                {selectingDest ? 'Haz clic en el mapa...' : 'Marcar Destino'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Distance Info */}
      {distanceInfo && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="glass-card border border-emerald-200/50 rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Navigation className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {distanceInfo.km.toFixed(1)} km de distancia
              </p>
              <p className="text-xs text-muted-foreground">
                Tiempo estimado de viaje: ~{distanceInfo.time} min
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Origin */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-card border border-slate-200/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-600" />
                Origen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="originAddress">Dirección de origen</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="originAddress"
                      placeholder="Av. Monseñor Rivero #123, Santa Cruz"
                      value={originAddress}
                      onChange={(e) => setOriginAddress(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button type="button" size="icon" variant="outline" onClick={handleGeocodeOrigin} disabled={geocodingLoading}>
                    <Search className="h-4 w-4" />
                  </Button>
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
          <Card className="glass-card border border-slate-200/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-amber-500" />
                Destino
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="destAddress">Dirección de destino</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="destAddress"
                      placeholder="Calle Sucre #456, El Alto"
                      value={destAddress}
                      onChange={(e) => setDestAddress(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button type="button" size="icon" variant="outline" onClick={handleGeocodeDest} disabled={geocodingLoading}>
                    <Search className="h-4 w-4" />
                  </Button>
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
          <Card className="glass-card border border-slate-200/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-teal-600" />
                Detalles de la Carga
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

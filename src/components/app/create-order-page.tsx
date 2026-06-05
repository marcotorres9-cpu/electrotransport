'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import {
  MapPin, DollarSign, Package, Weight, Hash, FileText,
  ChevronLeft, Send, Navigation, Clock, X, ChevronUp, ChevronDown,
  Truck, Sparkles, CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import AddressSearch from './address-search'

const OrderMap = dynamic(() => import('./order-map'), { ssr: false })

const cargoTypes = [
  { value: 'refrigeradora', label: 'Refrigeradora', emoji: '🧊' },
  { value: 'lavadora', label: 'Lavadora', emoji: '🫧' },
  { value: 'microondas', label: 'Microondas', emoji: '📡' },
  { value: 'television', label: 'Televisión', emoji: '📺' },
  { value: 'cocina', label: 'Cocina / Estufa', emoji: '🔥' },
  { value: 'aire_acondicionado', label: 'Aire Acondicionado', emoji: '❄️' },
  { value: 'secadora', label: 'Secadora', emoji: '🌀' },
  { value: 'lavavajillas', label: 'Lavavajillas', emoji: '🍽️' },
  { value: 'varios', label: 'Varios', emoji: '📦' },
]

type Step = 'addresses' | 'details' | 'price' | 'confirm'

export default function CreateOrderPage() {
  const { setCurrentView, setOrders, userLocation, setUserLocation } = useAppStore()

  // Address state
  const [originAddress, setOriginAddress] = useState('')
  const [originLat, setOriginLat] = useState<number | null>(null)
  const [originLng, setOriginLng] = useState<number | null>(null)
  const [destAddress, setDestAddress] = useState('')
  const [destLat, setDestLat] = useState<number | null>(null)
  const [destLng, setDestLng] = useState<number | null>(null)

  // Map interaction state
  const [selectingOnMap, setSelectingOnMap] = useState<'origin' | 'dest' | null>(null)
  const [showFullMap, setShowFullMap] = useState(false)

  // Details state
  const [cargoType, setCargoType] = useState('')
  const [cargoWeight, setCargoWeight] = useState('')
  const [cargoQuantity, setCargoQuantity] = useState('')
  const [specialNotes, setSpecialNotes] = useState('')
  const [proposedPrice, setProposedPrice] = useState('')

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [distanceInfo, setDistanceInfo] = useState<{ km: number; time: number } | null>(null)
  const [currentStep, setCurrentStep] = useState<Step>('addresses')
  const [gpsLocating, setGpsLocating] = useState(false)

  // Auto-detect user location with high accuracy
  useEffect(() => {
    if (navigator.geolocation) {
      setGpsLocating(true)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          setUserLocation({ lat: latitude, lng: longitude, city: '', country: '' })
          // Reverse geocode
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=es`)
            .then(r => r.json())
            .then(data => {
              const city = data.address?.city || data.address?.town || data.address?.state || ''
              const country = data.address?.country || ''
              setUserLocation({ lat: latitude, lng: longitude, city, country })
            })
            .catch(() => {})
          setGpsLocating(false)
        },
        () => {
          setGpsLocating(false)
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
      )
    }
  }, [])

  // Calculate distance
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  useEffect(() => {
    if (originLat && originLng && destLat && destLng) {
      const km = calculateDistance(originLat, originLng, destLat, destLng)
      const timeMin = Math.round((km / 25) * 60) // ~25 km/h in Quito
      setDistanceInfo({ km, time: timeMin })
    } else {
      setDistanceInfo(null)
    }
  }, [originLat, originLng, destLat, destLng])

  // Handle origin address selection
  function handleOriginChange(address: string, lat: number, lng: number) {
    setOriginAddress(address)
    setOriginLat(lat)
    setOriginLng(lng)
  }

  // Handle destination address selection
  function handleDestChange(address: string, lat: number, lng: number) {
    setDestAddress(address)
    setDestLat(lat)
    setDestLng(lng)
  }

  // Use my location as origin
  function useMyLocationAsOrigin() {
    if (userLocation?.lat && userLocation?.lng) {
      setOriginLat(userLocation.lat)
      setOriginLng(userLocation.lng)
      // Reverse geocode
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lng}&accept-language=es`)
        .then(r => r.json())
        .then(data => {
          if (data.display_name) {
            const addr = data.address || {}
            const short = [addr.road || addr.suburb || '', addr.city || addr.town || 'Quito'].filter(Boolean).join(', ')
            setOriginAddress(short)
          }
        })
        .catch(() => {
          setOriginAddress('Mi ubicación actual')
        })
      toast.success('Ubicación actual usada como origen')
    } else {
      // Request location
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          setUserLocation({ lat: latitude, lng: longitude, city: '', country: '' })
          setOriginLat(latitude)
          setOriginLng(longitude)
          setOriginAddress('Mi ubicación actual')
          toast.success('Ubicación actual usada como origen')
        },
        () => {
          toast.error('No se pudo obtener tu ubicación')
        },
        { enableHighAccuracy: true, timeout: 15000 }
      )
    }
  }

  // Handle map click for selecting origin/dest
  function handleMapClick(lat: number, lng: number) {
    if (!selectingOnMap) return

    if (selectingOnMap === 'origin') {
      setOriginLat(lat)
      setOriginLng(lng)
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`)
        .then(r => r.json())
        .then(data => {
          if (data.display_name) {
            const addr = data.address || {}
            const short = [addr.road || addr.suburb || '', addr.city || addr.town || 'Quito'].filter(Boolean).join(', ')
            setOriginAddress(short)
          }
        })
        .catch(() => {})
    } else {
      setDestLat(lat)
      setDestLng(lng)
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`)
        .then(r => r.json())
        .then(data => {
          if (data.display_name) {
            const addr = data.address || {}
            const short = [addr.road || addr.suburb || '', addr.city || addr.town || 'Quito'].filter(Boolean).join(', ')
            setDestAddress(short)
          }
        })
        .catch(() => {})
    }
    setSelectingOnMap(null)
    setShowFullMap(false)
  }

  // Handle map GPS click
  function handleMapGpsClick() {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setUserLocation({ lat: latitude, lng: longitude, city: '', country: '' })
      },
      () => {},
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  // Can proceed to details
  const canProceed = originLat !== null && originLng !== null && destLat !== null && destLng !== null

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
          originLat: originLat || 0,
          originLng: originLng || 0,
          destAddress,
          destLat: destLat || 0,
          destLng: destLng || 0,
          cargoType: cargoType || null,
          cargoWeight: cargoWeight ? parseFloat(cargoWeight) : null,
          cargoQuantity: cargoQuantity ? parseInt(cargoQuantity) : null,
          specialNotes: specialNotes || null,
          proposedPrice: parseFloat(proposedPrice),
        }),
      })

      toast.success('¡Pedido creado exitosamente! Esperando transportistas...')

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
    <div className="relative min-h-screen bg-[#F5F5F5]">
      {/* Full-screen map overlay */}
      <AnimatePresence>
        {showFullMap && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 bg-white"
          >
            <OrderMap
              userLocation={userLocation}
              originLat={originLat || undefined}
              originLng={originLng || undefined}
              destLat={destLat || undefined}
              destLng={destLng || undefined}
              originAddress={originAddress}
              destAddress={destAddress}
              onMapClick={handleMapClick}
              selectingOrigin={selectingOnMap === 'origin'}
              selectingDest={selectingOnMap === 'dest'}
              height="100%"
              fullScreen
              showGpsButton
              onGpsClick={handleMapGpsClick}
            />

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 z-[1001] bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3">
              <div className="flex items-center justify-between max-w-2xl mx-auto">
                <button
                  onClick={() => { setShowFullMap(false); setSelectingOnMap(null) }}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  <X className="h-5 w-5 text-gray-700" />
                </button>
                <p className="text-sm font-semibold text-gray-900">
                  {selectingOnMap === 'origin' ? 'Seleccionar origen en el mapa' : selectingOnMap === 'dest' ? 'Seleccionar destino en el mapa' : 'Mapa de ruta'}
                </p>
                <div className="w-10" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => setCurrentView('store-dashboard')}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Nuevo Pedido</h1>
            <p className="text-xs text-gray-500">Solicita transporte para tus electrodomésticos</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-2xl mx-auto">
        {/* Map section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative"
        >
          <OrderMap
            userLocation={userLocation}
            originLat={originLat || undefined}
            originLng={originLng || undefined}
            destLat={destLat || undefined}
            destLng={destLng || undefined}
            originAddress={originAddress}
            destAddress={destAddress}
            onMapClick={handleMapClick}
            selectingOrigin={selectingOnMap === 'origin'}
            selectingDest={selectingOnMap === 'dest'}
            height="220px"
            showGpsButton
            onGpsClick={handleMapGpsClick}
          />

          {/* Expand map button */}
          <button
            onClick={() => setShowFullMap(true)}
            className="absolute top-3 right-3 z-[1000] w-9 h-9 bg-white rounded-xl shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ChevronUp className="h-5 w-5 text-gray-600" />
          </button>

          {/* GPS locating indicator */}
          {gpsLocating && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
              <div className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-500 flex items-center gap-2 shadow-sm">
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-[#3B82F6] border-t-transparent" />
                Detectando ubicación...
              </div>
            </div>
          )}
        </motion.div>

        {/* Distance Info Bar */}
        <AnimatePresence>
          {distanceInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white border-b border-gray-100"
            >
              <div className="px-4 py-2.5 flex items-center gap-3 max-w-2xl mx-auto">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-[#1DB954]" />
                  <span className="text-sm font-semibold text-gray-900">{distanceInfo.km.toFixed(1)} km</span>
                </div>
                <div className="h-3 w-px bg-gray-200" />
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500">~{distanceInfo.time} min</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Address Search Section - Uber Style */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white -mt-4 rounded-t-2xl border-t border-gray-200 relative z-10"
        >
          {/* Connecting dots line */}
          <div className="absolute -top-4 left-8 w-0.5 h-4 bg-gray-200" />

          <div className="p-4 space-y-3">
            {/* Origin search */}
            <div className="flex items-start gap-2">
              <div className="flex flex-col items-center mt-4 gap-1">
                <div className="w-3 h-3 rounded-full bg-[#1DB954]" />
                <div className="w-0.5 h-8 bg-gray-200" />
                <div className="w-3 h-3 rounded-full bg-[#FFC145]" />
              </div>
              <div className="flex-1 space-y-3">
                <AddressSearch
                  label="Origen"
                  placeholder="¿Dónde recoger?"
                  value={originAddress}
                  onChange={handleOriginChange}
                  color="green"
                  showMyLocation
                  onUseMyLocation={useMyLocationAsOrigin}
                />
                <AddressSearch
                  label="Destino"
                  placeholder="¿A dónde llevar?"
                  value={destAddress}
                  onChange={handleDestChange}
                  color="amber"
                />
              </div>
            </div>

            {/* Select on map buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className={`flex-1 text-xs ${selectingOnMap === 'origin' ? 'bg-[#1DB954]/10 border-[#1DB954] text-[#1DB954]' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                onClick={() => {
                  setSelectingOnMap(selectingOnMap === 'origin' ? null : 'origin')
                  if (selectingOnMap !== 'origin') setShowFullMap(true)
                }}
              >
                <MapPin className="h-3 w-3 mr-1.5" />
                Origen en mapa
              </Button>
              <Button
                size="sm"
                variant="outline"
                className={`flex-1 text-xs ${selectingOnMap === 'dest' ? 'bg-[#FFC145]/10 border-[#FFC145] text-[#FFC145]' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                onClick={() => {
                  setSelectingOnMap(selectingOnMap === 'dest' ? null : 'dest')
                  if (selectingOnMap !== 'dest') setShowFullMap(true)
                }}
              >
                <MapPin className="h-3 w-3 mr-1.5" />
                Destino en mapa
              </Button>
            </div>

            {/* Proceed to details button */}
            {canProceed && currentStep === 'addresses' && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                <Button
                  onClick={() => setCurrentStep('details')}
                  className="w-full bg-[#1DB954] hover:bg-[#17a34a] text-black font-semibold py-5 rounded-xl"
                >
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Continuar con detalles
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Details Section */}
        <AnimatePresence>
          {currentStep !== 'addresses' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white border-t border-gray-100 p-4 space-y-4">
                {/* Cargo Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-[#1DB954]" />
                    <h3 className="text-sm font-semibold text-gray-900">Detalles de la Carga</h3>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-500 text-xs">Tipo de electrodoméstico</Label>
                    <Select value={cargoType} onValueChange={setCargoType}>
                      <SelectTrigger className="bg-[#F9FAFB] border-gray-200 text-gray-900">
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        {cargoTypes.map((ct) => (
                          <SelectItem key={ct.value} value={ct.value} className="text-gray-900">
                            {ct.emoji} {ct.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="weight" className="text-gray-500 text-xs">Peso (kg)</Label>
                      <div className="relative">
                        <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input id="weight" placeholder="80" value={cargoWeight} onChange={(e) => setCargoWeight(e.target.value)} className="pl-10 bg-[#F9FAFB] border-gray-200 text-gray-900" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="quantity" className="text-gray-500 text-xs">Cantidad</Label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input id="quantity" placeholder="2" value={cargoQuantity} onChange={(e) => setCargoQuantity(e.target.value)} className="pl-10 bg-[#F9FAFB] border-gray-200 text-gray-900" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="notes" className="text-gray-500 text-xs">Notas especiales</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Textarea
                        id="notes"
                        placeholder="Fragil, requiere cuidado especial, acceso restringido..."
                        value={specialNotes}
                        onChange={(e) => setSpecialNotes(e.target.value)}
                        className="pl-10 bg-[#F9FAFB] border-gray-200 text-gray-900"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                {/* Price Section */}
                <div className="bg-gradient-to-br from-[#1DB954]/5 to-[#1DB954]/10 border border-[#1DB954]/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-4 w-4 text-[#1DB954]" />
                    <h3 className="text-sm font-semibold text-[#1DB954]">Precio Propuesto</h3>
                    <Sparkles className="h-3.5 w-3.5 text-[#1DB954]/50" />
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Elige tu precio. Los transportistas pueden aceptar o contraofertar.</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-[#1DB954]">$</span>
                    <Input
                      type="number"
                      placeholder="50.00"
                      value={proposedPrice}
                      onChange={(e) => setProposedPrice(e.target.value)}
                      className="pl-8 text-2xl font-bold border-[#1DB954]/30 bg-white focus:border-[#1DB954] text-gray-900 rounded-xl h-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">USD</span>
                  </div>
                </div>

                {/* Route summary */}
                {(originAddress || destAddress) && (
                  <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                    <div className="flex items-start gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full bg-[#1DB954] mt-1.5 shrink-0" />
                      <span className="text-gray-600">{originAddress || 'Origen no definido'}</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full bg-[#FFC145] mt-1.5 shrink-0" />
                      <span className="text-gray-600">{destAddress || 'Destino no definido'}</span>
                    </div>
                    {distanceInfo && (
                      <div className="flex items-center gap-3 pt-1 text-xs text-gray-400">
                        <span>{distanceInfo.km.toFixed(1)} km</span>
                        <span>~{distanceInfo.time} min</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit */}
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button
                    type="button"
                    onClick={(e) => handleSubmit(e as any)}
                    className="w-full bg-[#1DB954] hover:bg-[#17a34a] text-black font-semibold py-6 text-base rounded-xl shadow-[0_0_24px_rgba(29,185,84,0.2)]"
                    disabled={isSubmitting || !originAddress || !destAddress || !proposedPrice}
                  >
                    <Send className="h-5 w-5 mr-2" />
                    {isSubmitting ? 'Publicando Pedido...' : 'Publicar Pedido'}
                  </Button>
                </motion.div>

                <button
                  onClick={() => setCurrentStep('addresses')}
                  className="w-full text-xs text-gray-400 hover:text-gray-600 py-2 text-center"
                >
                  ← Volver a direcciones
                </button>

                <p className="text-center text-[10px] text-gray-400 pb-2">v2.7.0</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom padding */}
        <div className="h-8" />
      </div>
    </div>
  )
}

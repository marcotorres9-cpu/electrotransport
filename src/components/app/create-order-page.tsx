'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import {
  MapPin, DollarSign, Package, Weight, Hash, FileText,
  ChevronLeft, Send, Navigation, Search, X, LocateFixed,
  Loader2, ArrowRight, CheckCircle2
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

const OrderMap = dynamic(() => import('./order-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[250px] bg-gray-100 rounded-xl flex items-center justify-center">
      <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
      <span className="ml-2 text-sm text-gray-400">Cargando mapa...</span>
    </div>
  ),
})

const cargoTypes = [
  { value: 'refrigeradora', label: 'Refrigeradora' },
  { value: 'lavadora', label: 'Lavadora' },
  { value: 'microondas', label: 'Microondas' },
  { value: 'television', label: 'Televisi\u00f3n' },
  { value: 'cocina', label: 'Cocina / Estufa' },
  { value: 'aire_acondicionado', label: 'Aire Acondicionado' },
  { value: 'secadora', label: 'Secadora' },
  { value: 'lavavajillas', label: 'Lavavajillas' },
  { value: 'varios', label: 'Varios' },
]

/* =========================================================
   Address Autocomplete - self-contained, no external deps
   ========================================================= */
function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  icon: Icon,
  color,
}: {
  value: string
  onChange: (v: string) => void
  onSelect: (addr: string, lat: string, lng: string) => void
  placeholder: string
  icon: React.ElementType
  color: string
}) {
  const [suggestions, setSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleInputChange(text: string) {
    onChange(text)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (text.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        // Search focused on Quito/Ecuador area
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text + ' Quito Ecuador')}&limit=5&viewbox=-78.7,-0.5,-78.2,0.0&bounded=1&addressdetails=1`
        )
        const data = await res.json()
        setSuggestions(data)
        setShowSuggestions(data.length > 0)
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }, 400)
  }

  function handleSelect(s: { display_name: string; lat: string; lon: string }) {
    const shortName = s.display_name.split(',').slice(0, 3).join(',')
    onChange(shortName)
    onSelect(shortName, s.lat, s.lon)
    setShowSuggestions(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          className={`pl-10 pr-8 bg-[#F9FAFB] border-gray-200 text-gray-900 h-10 text-sm`}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
          >
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start gap-3 border-b border-gray-100 last:border-0 transition-colors"
                onClick={() => handleSelect(s)}
              >
                <MapPin className={`h-4 w-4 mt-0.5 flex-shrink-0 ${color}`} />
                <span className="text-sm text-gray-700 line-clamp-2">{s.display_name.split(',').slice(0, 4).join(',')}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* =========================================================
   Map Selector Modal - full screen with back button
   ========================================================= */
function MapSelectorModal({
  title,
  initialLat,
  initialLng,
  onClose,
  onConfirm,
}: {
  title: string
  initialLat: number
  initialLng: number
  onClose: () => void
  onConfirm: (lat: number, lng: number, address: string) => void
}) {
  const [tempLat, setTempLat] = useState<number | null>(null)
  const [tempLng, setTempLng] = useState<number | null>(null)
  const [tempAddress, setTempAddress] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleMapClick(lat: number, lng: number) {
    setTempLat(lat)
    setTempLng(lng)
    setError(null)
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
      .then((r) => r.json())
      .then((data) => {
        if (data.display_name) {
          setTempAddress(data.display_name.split(',').slice(0, 4).join(','))
        }
      })
      .catch(() => {
        setTempAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
      })
  }

  function handleConfirm() {
    if (!tempLat || !tempLng) {
      setError('Primero toca un punto en el mapa para seleccionar la ubicaci\u00f3n')
      return
    }
    onConfirm(tempLat, tempLng, tempAddress)
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
      {/* Header with back button */}
      <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-200 shadow-sm">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
        >
          <X className="h-5 w-5 text-gray-700" />
        </button>
        <h2 className="text-base font-semibold text-gray-900 flex-1">{title}</h2>
        <Button
          size="sm"
          onClick={handleConfirm}
          disabled={!tempLat}
          className="bg-[#1DB954] hover:bg-[#17a34a] text-black font-semibold rounded-xl"
        >
          <CheckCircle2 className="h-4 w-4 mr-1" />
          Confirmar
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-4 mt-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <X className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Selected address preview */}
      {tempLat && (
        <div className="mx-4 mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-600 font-medium mb-1">Ubicaci\u00f3n seleccionada:</p>
          <p className="text-sm text-gray-800">{tempAddress || `${tempLat.toFixed(5)}, ${tempLng?.toFixed(5)}`}</p>
        </div>
      )}

      {/* Instruction */}
      <div className="mx-4 mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700 flex items-center">
        <Navigation className="h-4 w-4 mr-2 flex-shrink-0" />
        Toca un punto en el mapa para seleccionar la ubicaci\u00f3n
      </div>

      {/* Full screen map */}
      <div className="flex-1 mt-2">
        <OrderMap
          originLat={tempLat || initialLat}
          originLng={tempLng || initialLng}
          onMapClick={handleMapClick}
          height="100%"
          interactive={true}
        />
      </div>
    </div>
  )
}

/* =========================================================
   Main Create Order Page
   ========================================================= */
export default function CreateOrderPage() {
  const { setCurrentView, setOrders, userLocation, setUserLocation } = useAppStore()

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
  const [gpsLoading, setGpsLoading] = useState(false)
  const [showMapSelector, setShowMapSelector] = useState<'origin' | 'dest' | null>(null)
  const [distanceInfo, setDistanceInfo] = useState<{ km: number; time: number } | null>(null)

  // Check if coords are within Quito metro area
  function isNearQuito(lat: number, lng: number): boolean {
    return lat >= -0.35 && lat <= 0.05 && lng >= -78.65 && lng <= -78.35
  }

  // Auto-detect user location with AGGRESSIVE HIGH ACCURACY
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    setGpsLoading(true)

    // Strategy: Try multiple GPS approaches
    function tryGps() {
      let bestPos: GeolocationPosition | null = null
      let attempts = 0
      const maxAttempts = 3

      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords
          attempts++
          console.log(`GPS attempt ${attempts}: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} accuracy=${accuracy}m`)

          // Only accept if reasonable accuracy AND near Quito
          if (accuracy <= 100 && isNearQuito(latitude, longitude)) {
            console.log(`GPS fix accepted: ${accuracy}m accuracy`)
            setUserLocation({ lat: latitude, lng: longitude, city: '', country: '' })
            navigator.geolocation.clearWatch(watchId)
            setGpsLoading(false)
            bestPos = pos
            // Reverse geocode
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1&accept-language=es`)
              .then((r) => r.json())
              .then((data) => {
                const city = data.address?.city || data.address?.town || data.address?.state || ''
                const country = data.address?.country || ''
                setUserLocation({ lat: latitude, lng: longitude, city, country })
              })
              .catch(() => {})
            return
          }

          // If not near Quito but decent accuracy, still use it (user might be outside Quito)
          if (accuracy <= 50) {
            setUserLocation({ lat: latitude, lng: longitude, city: '', country: '' })
            navigator.geolocation.clearWatch(watchId)
            setGpsLoading(false)
            bestPos = pos
          }

          // Give up after max attempts
          if (attempts >= maxAttempts) {
            if (bestPos) {
              // Use whatever we got
              console.log(`Using best position after ${maxAttempts} attempts`)
            }
            navigator.geolocation.clearWatch(watchId)
            setGpsLoading(false)
          }
        },
        (err) => {
          console.warn('GPS error:', err.message, err.code)
          // Try one more time with lower accuracy
          if (!bestPos) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const { latitude, longitude } = pos.coords
                console.log(`Fallback GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`)
                setUserLocation({ lat: latitude, lng: longitude, city: '', country: '' })
              },
              () => { setGpsLoading(false) },
              { enableHighAccuracy: false, timeout: 15000 }
            )
          } else {
            setGpsLoading(false)
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0,
        }
      )

      return watchId
    }

    const watchId = tryGps()
    return () => { navigator.geolocation.clearWatch(watchId) }
  }, [])

  // Use my location as origin - AGGRESSIVE
  function handleUseMyLocation() {
    setGpsLoading(true)
    toast.loading('Obteniendo ubicaci\u00f3n GPS...', { id: 'gps-toast' })

    function doGps() {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords
          console.log(`Manual GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} acc=${accuracy}m nearQuito=${isNearQuito(latitude, longitude)}`)
          setOriginLat(latitude.toString())
          setOriginLng(longitude.toString())
          setUserLocation({ lat: latitude, lng: longitude, city: '', country: '' })
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=es`)
            .then((r) => r.json())
            .then((data) => {
              const addr = data.display_name?.split(',').slice(0, 4).join(',') || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
              setOriginAddress(addr)
              toast.success(`Ubicaci\u00f3n GPS detectada (${accuracy.toFixed(0)}m)`, { id: 'gps-toast' })
            })
            .catch(() => {
              setOriginAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`)
              toast.success(`Ubicaci\u00f3n GPS (${accuracy.toFixed(0)}m)`, { id: 'gps-toast' })
            })
            .finally(() => setGpsLoading(false))
        },
        (err) => {
          console.warn('Manual GPS error:', err.message)
          // Try without high accuracy
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords
              setOriginLat(latitude.toString())
              setOriginLng(longitude.toString())
              setUserLocation({ lat: latitude, lng: longitude, city: '', country: '' })
              setOriginAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`)
              toast.success('Ubicaci\u00f3n detectada (baja precisi\u00f3n)', { id: 'gps-toast' })
              setGpsLoading(false)
            },
            () => {
              setGpsLoading(false)
              toast.error('No se pudo obtener tu ubicaci\u00f3n GPS. Intenta con el mapa o escribe una direcci\u00f3n.', { id: 'gps-toast' })
            },
            { enableHighAccuracy: false, timeout: 15000 }
          )
        },
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
      )
    }
    doGps()
  }

  // Estimate distance
  useEffect(() => {
    if (originLat && originLng && destLat && destLng) {
      const lat1 = parseFloat(originLat)
      const lon1 = parseFloat(originLng)
      const lat2 = parseFloat(destLat)
      const lon2 = parseFloat(destLng)
      if (lat1 && lon1 && lat2 && lon2) {
        const R = 6371
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a = Math.sin(dLat / 2) ** 2 +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) ** 2
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const km = R * c
        const timeMin = Math.round((km / 30) * 60)
        setDistanceInfo({ km, time: timeMin })
      }
    } else {
      setDistanceInfo(null)
    }
  }, [originLat, originLng, destLat, destLng])

  // Map selector callbacks
  function handleMapSelectorConfirm(lat: number, lng: number, address: string) {
    if (showMapSelector === 'origin') {
      setOriginLat(lat.toString())
      setOriginLng(lng.toString())
      setOriginAddress(address)
    } else if (showMapSelector === 'dest') {
      setDestLat(lat.toString())
      setDestLng(lng.toString())
      setDestAddress(address)
    }
    setShowMapSelector(null)
    toast.success(showMapSelector === 'origin' ? 'Origen seleccionado en el mapa' : 'Destino seleccionado en el mapa')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!originAddress || !destAddress || !proposedPrice) {
      toast.error('Origen, destino y precio propuesto son obligatorios')
      return
    }
    setIsSubmitting(true)
    try {
      await apiFetch('/api/orders', {
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
      toast.success('\u00a1Pedido creado exitosamente! Esperando transportistas...')
      const ordersData = await apiFetch('/api/orders')
      setOrders(ordersData.orders)
      setCurrentView('store-orders')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear el pedido')
    } finally {
      setIsSubmitting(false)
    }
  }

  const defaultCenter = userLocation?.lat ? [userLocation.lat, userLocation.lng] : [-0.1807, -78.4678]

  return (
    <>
      <div className="space-y-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('store-dashboard')}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Nuevo Pedido</h1>
            <p className="text-xs text-gray-500">Solicita transporte para tus electrodom\u00e9sticos</p>
          </div>
        </div>

        {/* Origin Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-white border border-gray-200 shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-900">
                  <div className="w-3 h-3 rounded-full bg-[#1DB954]" />
                  Origen
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleUseMyLocation}
                  disabled={gpsLoading}
                  className="text-xs text-[#1DB954] hover:text-[#17a34a] hover:bg-green-50 h-7 px-2"
                >
                  {gpsLoading ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <LocateFixed className="h-3 w-3 mr-1" />
                  )}
                  Usar mi ubicaci\u00f3n
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <AddressAutocomplete
                value={originAddress}
                onChange={setOriginAddress}
                onSelect={(addr, lat, lng) => {
                  setOriginAddress(addr)
                  setOriginLat(lat)
                  setOriginLng(lng)
                  toast.success('Origen localizado')
                }}
                placeholder="Escribe direcci\u00f3n de origen..."
                icon={MapPin}
                color="text-[#1DB954]"
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMapSelector('origin')}
                  className="text-xs border-gray-200 text-gray-500 hover:bg-gray-50 h-8"
                >
                  <Navigation className="h-3 w-3 mr-1" />
                  Seleccionar en mapa
                </Button>
              </div>
              {/* Editable coordinates */}
              {originLat && originLng && (
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-gray-400">Lat</span>
                    <Input value={originLat} onChange={(e) => setOriginLat(e.target.value)} className="pl-8 text-[10px] h-7 bg-gray-50 border-gray-200 text-gray-600" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-gray-400">Lng</span>
                    <Input value={originLng} onChange={(e) => setOriginLng(e.target.value)} className="pl-9 text-[10px] h-7 bg-gray-50 border-gray-200 text-gray-600" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Connector */}
        <div className="flex items-center justify-center">
          <ArrowRight className="h-4 w-4 text-gray-300" />
        </div>

        {/* Destination Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="bg-white border border-gray-200 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-900">
                <div className="w-3 h-3 rounded-full bg-[#FFC145]" />
                Destino
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <AddressAutocomplete
                value={destAddress}
                onChange={setDestAddress}
                onSelect={(addr, lat, lng) => {
                  setDestAddress(addr)
                  setDestLat(lat)
                  setDestLng(lng)
                  toast.success('Destino localizado')
                }}
                placeholder="Escribe direcci\u00f3n de destino..."
                icon={MapPin}
                color="text-[#FFC145]"
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMapSelector('dest')}
                  className="text-xs border-gray-200 text-gray-500 hover:bg-gray-50 h-8"
                >
                  <Navigation className="h-3 w-3 mr-1" />
                  Seleccionar en mapa
                </Button>
              </div>
              {/* Editable coordinates */}
              {destLat && destLng && (
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-gray-400">Lat</span>
                    <Input value={destLat} onChange={(e) => setDestLat(e.target.value)} className="pl-8 text-[10px] h-7 bg-gray-50 border-gray-200 text-gray-600" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-gray-400">Lng</span>
                    <Input value={destLng} onChange={(e) => setDestLng(e.target.value)} className="pl-9 text-[10px] h-7 bg-gray-50 border-gray-200 text-gray-600" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Distance Info */}
        {distanceInfo && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-white border border-[#1DB954]/20 rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1DB954]/10 flex items-center justify-center">
                <Navigation className="h-5 w-5 text-[#1DB954]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {distanceInfo.km.toFixed(1)} km de distancia
                </p>
                <p className="text-xs text-gray-500">
                  Tiempo estimado de viaje: ~{distanceInfo.time} min
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Map preview */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <OrderMap
            userLocation={userLocation}
            originLat={originLat ? parseFloat(originLat) : undefined}
            originLng={originLng ? parseFloat(originLng) : undefined}
            destLat={destLat ? parseFloat(destLat) : undefined}
            destLng={destLng ? parseFloat(destLng) : undefined}
            originAddress={originAddress}
            destAddress={destAddress}
            height="220px"
            interactive={false}
          />
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cargo */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="bg-white border border-gray-200 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-900">
                  <Package className="h-4 w-4 text-[#1DB954]" />
                  Detalles de la Carga
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Tipo de electrodom\u00e9stico</Label>
                  <Select value={cargoType} onValueChange={setCargoType}>
                    <SelectTrigger className="bg-[#F9FAFB] border-gray-200 text-gray-900 h-9 text-sm">
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {cargoTypes.map((ct) => (
                        <SelectItem key={ct.value} value={ct.value} className="text-gray-900">
                          {ct.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Peso (kg)</Label>
                    <div className="relative">
                      <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input placeholder="80" value={cargoWeight} onChange={(e) => setCargoWeight(e.target.value)} className="pl-9 bg-[#F9FAFB] border-gray-200 text-gray-900 h-9 text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Cantidad</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input placeholder="2" value={cargoQuantity} onChange={(e) => setCargoQuantity(e.target.value)} className="pl-9 bg-[#F9FAFB] border-gray-200 text-gray-900 h-9 text-sm" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Notas especiales</Label>
                  <Textarea
                    placeholder="Fragil, requiere cuidado especial..."
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    className="bg-[#F9FAFB] border-gray-200 text-gray-900 text-sm"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Price */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-2 border-[#1DB954]/30 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-[#1DB954]">
                  <DollarSign className="h-4 w-4 text-[#1DB954]" />
                  Precio Propuesto
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Los transportistas pueden aceptar o contraofertar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#1DB954]" />
                  <Input
                    type="number"
                    placeholder="50.00"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    className="pl-10 text-lg font-bold border-[#1DB954]/40 bg-[#F9FAFB] focus:border-[#1DB954] text-gray-900 h-11"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Submit */}
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              type="submit"
              className="w-full bg-[#1DB954] hover:bg-[#17a34a] text-black font-semibold py-5 text-base"
              disabled={isSubmitting}
            >
              <Send className="h-5 w-5 mr-2" />
              {isSubmitting ? 'Publicando Pedido...' : 'Publicar Pedido'}
            </Button>
          </motion.div>
        </form>
      </div>

      {/* Map Selector Modal */}
      <AnimatePresence>
        {showMapSelector && (
          <MapSelectorModal
            title={showMapSelector === 'origin' ? 'Seleccionar Origen en el Mapa' : 'Seleccionar Destino en el Mapa'}
            initialLat={defaultCenter[0]}
            initialLng={defaultCenter[1]}
            onClose={() => setShowMapSelector(null)}
            onConfirm={handleMapSelectorConfirm}
          />
        )}
      </AnimatePresence>
    </>
  )
}

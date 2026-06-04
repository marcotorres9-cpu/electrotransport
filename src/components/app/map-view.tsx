'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface MapViewProps {
  className?: string
  height?: string
  showDriverLocations?: boolean
  orders?: Array<{
    id: string
    originLat: number
    originLng: number
    destLat: number
    destLng: number
    status: string
    orderNumber: string
  }>
}

// Quito, Ecuador center
const DEFAULT_CENTER: [number, number] = [-0.1807, -78.4678]
const DEFAULT_ZOOM = 12

export default function MapView({ className = '', height = '400px', showDriverLocations = true, orders = [] }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const polylinesRef = useRef<any[]>([])
  const [mapReady, setMapReady] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number]>(DEFAULT_CENTER)

  // Try to get user location
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude])
        },
        () => {
          // Fallback to Quito
          setUserLocation(DEFAULT_CENTER)
        },
        { timeout: 5000 }
      )
    }
  }, [])

  // Initialize map dynamically (client-side only)
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    let cancelled = false

    async function initMap() {
      try {
        const L = (await import('leaflet')).default
        await import('leaflet/dist/leaflet.css')

        if (cancelled || !mapRef.current) return

        // Fix default marker icons
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        })

        const map = L.map(mapRef.current!).setView(userLocation, DEFAULT_ZOOM)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map)

        mapInstanceRef.current = map
        setMapReady(true)
      } catch (err) {
        console.error('Failed to load Leaflet:', err)
      }
    }

    initMap()

    return () => {
      cancelled = true
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [userLocation])

  // Update markers when map is ready
  const updateMarkers = useCallback(async () => {
    if (!mapReady || !mapInstanceRef.current) return

    const L = (await import('leaflet')).default

    // Clear existing markers and polylines
    markersRef.current.forEach((m) => m.remove())
    polylinesRef.current.forEach((p) => p.remove())
    markersRef.current = []
    polylinesRef.current = []

    const map = mapInstanceRef.current

    // Add order markers and route lines
    orders.forEach((order) => {
      if (order.originLat !== 0 && order.originLng !== 0 && order.destLat !== 0 && order.destLng !== 0) {
        const isActive = order.status === 'accepted' || order.status === 'in_progress'

        // Origin marker (green)
        const originIcon = L.divIcon({
          html: `<div class="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white shadow-lg flex items-center justify-center text-white text-[8px] font-bold">O</div>`,
          className: 'custom-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })

        const originMarker = L.marker([order.originLat, order.originLng], { icon: originIcon })
          .addTo(map)
          .bindPopup(`<b>Origen - ${order.orderNumber}</b><br>${order.status === 'accepted' ? 'Aceptado' : order.status === 'in_progress' ? 'En Progreso' : ''}`)

        markersRef.current.push(originMarker)

        // Destination marker (amber)
        const destIcon = L.divIcon({
          html: `<div class="w-6 h-6 rounded-full bg-amber-500 border-2 border-white shadow-lg flex items-center justify-center text-white text-[8px] font-bold">D</div>`,
          className: 'custom-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })

        const destMarker = L.marker([order.destLat, order.destLng], { icon: destIcon })
          .addTo(map)
          .bindPopup(`<b>Destino - ${order.orderNumber}</b>`)

        markersRef.current.push(destMarker)

        // Route line for active orders
        if (isActive) {
          const polyline = L.polyline(
            [
              [order.originLat, order.originLng],
              [order.destLat, order.destLng],
            ],
            {
              color: '#059669',
              weight: 3,
              opacity: 0.7,
              dashArray: '10, 6',
            }
          ).addTo(map)

          polylinesRef.current.push(polyline)
        }
      }
    })

    // Fetch driver locations
    if (showDriverLocations) {
      try {
        const res = await fetch('/api/drivers/locations')
        const data = await res.json()

        if (data.drivers) {
          data.drivers.forEach((driver: { lat: number; lng: number; name: string; vehicleType: string }) => {
            const driverIcon = L.divIcon({
              html: `
                <div class="relative">
                  <div class="w-4 h-4 rounded-full bg-emerald-400 border-2 border-white shadow-lg animate-pulse"></div>
                  <div class="absolute inset-0 w-4 h-4 rounded-full bg-emerald-400 animate-ping opacity-40"></div>
                </div>
              `,
              className: 'custom-marker',
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            })

            const marker = L.marker([driver.lat, driver.lng], { icon: driverIcon })
              .addTo(map)
              .bindPopup(`<b>${driver.name}</b><br>${driver.vehicleType}`)

            markersRef.current.push(marker)
          })
        }
      } catch {
        // silently fail
      }
    }
  }, [mapReady, orders, showDriverLocations])

  useEffect(() => {
    updateMarkers()
  }, [updateMarkers])

  return (
    <Card className={`border-none shadow-sm overflow-hidden ${className}`}>
      <div
        ref={mapRef}
        style={{ height, width: '100%' }}
        className="z-0 rounded-xl"
      />
      {/* Loading overlay */}
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-xl z-10" style={{ height, width: '100%' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Cargando mapa...</p>
          </div>
        </div>
      )}
    </Card>
  )
}

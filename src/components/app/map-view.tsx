'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { getUserLocation, type LocationResult, QUITO_CENTER } from '@/lib/geolocation'

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

const DEFAULT_ZOOM = 13

// Google Maps tiles - most up-to-date street data
const GOOGLE_TILES = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'

export default function MapView({ className = '', height = '400px', showDriverLocations = true, orders = [] }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const polylinesRef = useRef<any[]>([])
  const [mapReady, setMapReady] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number]>(QUITO_CENTER)
  const [locating, setLocating] = useState(true)
  const [locMessage, setLocMessage] = useState<string | null>('Detectando ubicación...')
  const [locType, setLocType] = useState<'loading' | 'success' | 'warning' | 'error'>('loading')

  // Get user location with fallbacks
  const doGetLocation = useCallback(async (showSpinner = true) => {
    if (showSpinner) {
      setLocating(true)
      setLocMessage('Detectando ubicación...')
      setLocType('loading')
    }

    try {
      const result: LocationResult = await getUserLocation()
      setUserLocation([result.lat, result.lng])

      if (result.source === 'gps') {
        setLocMessage('GPS activo')
        setLocType('success')
      } else if (result.source === 'ip_api') {
        setLocMessage(result.message)
        setLocType('warning')
      } else {
        setLocMessage('Mostrando centro de Quito')
        setLocType('warning')
      }
    } catch {
      setUserLocation(QUITO_CENTER)
      setLocMessage('No se detectó ubicación')
      setLocType('warning')
    }
    setLocating(false)
  }, [])

  useEffect(() => {
    doGetLocation()
  }, [doGetLocation])

  // Initialize map dynamically (client-side only)
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    let cancelled = false

    async function initMap() {
      try {
        const L = (await import('leaflet')).default
        await import('leaflet/dist/leaflet.css')

        if (cancelled || !mapRef.current) return

        const map = L.map(mapRef.current!, {
          zoomControl: false,
        }).setView(userLocation, DEFAULT_ZOOM)

        // Google Maps street tiles
        L.tileLayer(GOOGLE_TILES, {
          maxZoom: 20,
        }).addTo(map)

        // Add zoom control to bottom-right
        L.control.zoom({ position: 'bottomright' }).addTo(map)

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

    // User location marker (blue dot)
    const userIcon = L.divIcon({
      html: `<div style="width:14px;height:14px;background:#3B82F6;border:3px solid #fff;border-radius:50%;box-shadow:0 0 10px rgba(59,130,246,0.5);"></div>`,
      className: 'custom-marker',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    })
    const userMarker = L.marker(userLocation, { icon: userIcon })
      .addTo(map)
      .bindPopup('<b>Mi ubicación</b>')
    markersRef.current.push(userMarker)

    // Add order markers and route lines
    orders.forEach((order) => {
      if (order.originLat !== 0 && order.originLng !== 0 && order.destLat !== 0 && order.destLng !== 0) {
        const isActive = order.status === 'accepted' || order.status === 'in_progress'

        // Origin marker (green)
        const originIcon = L.divIcon({
          html: `<div style="width:28px;height:28px;background:#1DB954;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;">O</div>`,
          className: 'custom-marker',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        })

        const originMarker = L.marker([order.originLat, order.originLng], { icon: originIcon })
          .addTo(map)
          .bindPopup(`<b>Origen - ${order.orderNumber}</b>`)
        markersRef.current.push(originMarker)

        // Destination marker (amber)
        const destIcon = L.divIcon({
          html: `<div style="width:28px;height:28px;background:#FFC145;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#000;font-size:10px;font-weight:700;">D</div>`,
          className: 'custom-marker',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        })

        const destMarker = L.marker([order.destLat, order.destLng], { icon: destIcon })
          .addTo(map)
          .bindPopup(`<b>Destino - ${order.orderNumber}</b>`)
        markersRef.current.push(destMarker)

        // Route line for active orders
        if (isActive) {
          const polyline = L.polyline(
            [[order.originLat, order.originLng], [order.destLat, order.destLng]],
            { color: '#1DB954', weight: 3, opacity: 0.8, dashArray: '10, 6' }
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
              html: `<div style="position:relative;"><div style="width:12px;height:12px;background:#1DB954;border:2px solid #fff;border-radius:50%;box-shadow:0 0 8px rgba(29,185,84,0.6);"></div><div style="position:absolute;inset:0;width:12px;height:12px;background:#1DB954;border-radius:50%;animation:ping 2s infinite;opacity:0.4;"></div></div>`,
              className: 'custom-marker',
              iconSize: [12, 12],
              iconAnchor: [6, 6],
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
  }, [mapReady, orders, showDriverLocations, userLocation])

  useEffect(() => {
    updateMarkers()
  }, [updateMarkers])

  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      <div
        ref={mapRef}
        style={{ height, width: '100%' }}
        className="z-0"
      />
      {/* Loading overlay */}
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-white rounded-xl z-10" style={{ height, width: '100%' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1DB954] mx-auto mb-2" />
            <p className="text-xs text-gray-500">Cargando mapa...</p>
          </div>
        </div>
      )}
      {/* Location status indicator */}
      {mapReady && locMessage && (
        <div className="absolute top-3 left-3 z-[1000]">
          <div className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium flex items-center gap-1.5 ${
            locType === 'loading' ? 'bg-gray-50 border border-gray-200 text-gray-500' :
            locType === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
            locType === 'warning' ? 'bg-amber-50 border border-amber-200 text-amber-700' :
            'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {locType === 'loading' && <div className="animate-spin rounded-full h-2.5 w-2.5 border-b border-[#1DB954]" />}
            {locType === 'success' && <div className="w-2 h-2 rounded-full bg-green-500" />}
            {locType === 'warning' && <div className="text-amber-500 text-xs">~</div>}
            {locMessage}
          </div>
        </div>
      )}
      {/* Retry button (always visible when not loading) */}
      {mapReady && !locating && (
        <button
          onClick={() => doGetLocation(false)}
          className="absolute top-3 right-3 z-[1000] bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-[10px] font-medium text-gray-500 hover:bg-gray-50 active:bg-gray-100 shadow-sm"
          title="Actualizar ubicación"
        >
          {locating ? (
            <div className="animate-spin rounded-full h-3 w-3 border-b border-[#1DB954]" />
          ) : (
            'Recargar'
          )}
        </button>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
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
const GOOGLE_TILES = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'

export default function MapView({ className = '', height = '400px', showDriverLocations = true, orders = [] }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const polylinesRef = useRef<L.Polyline[]>([])
  const userMarkerRef = useRef<L.Marker | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number]>(QUITO_CENTER)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsStatus, setGpsStatus] = useState<{ msg: string; type: 'loading' | 'success' | 'warning' | 'error' }>({ msg: '', type: 'loading' })

  // GPS button handler
  const handleGps = useCallback(async () => {
    setGpsLoading(true)
    setGpsStatus({ msg: 'Buscando GPS...', type: 'loading' })
    try {
      const result: LocationResult = await getUserLocation()
      setUserLocation([result.lat, result.lng])

      // flyTo on map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([result.lat, result.lng], 16, { duration: 1.2 })
      }

      // Update user marker
      if (userMarkerRef.current && mapInstanceRef.current) {
        userMarkerRef.current.setLatLng([result.lat, result.lng])
      }

      if (result.source === 'gps') {
        setGpsStatus({ msg: `GPS activo (${result.accuracy ? '~' + Math.round(result.accuracy) + 'm' : ''})`, type: 'success' })
      } else {
        setGpsStatus({ msg: result.message, type: 'warning' })
      }
    } catch {
      setGpsStatus({ msg: 'No se pudo detectar ubicación', type: 'error' })
    }
    setGpsLoading(false)
  }, [])

  // Initialize map centered on Quito
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return
    let cancelled = false

    try {
      const map = L.map(mapRef.current, {
        center: QUITO_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: false,
        attributionControl: false,
      })

      L.tileLayer(GOOGLE_TILES, { maxZoom: 20 }).addTo(map)
      L.control.zoom({ position: 'bottomright' }).addTo(map)

      // Blue dot for user at Quito center initially
      const userIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="position:relative;">
          <div style="width:16px;height:16px;background:#3B82F6;border:3px solid #fff;border-radius:50%;box-shadow:0 0 12px rgba(59,130,246,0.6);position:relative;z-index:2;"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:36px;height:36px;background:rgba(59,130,246,0.15);border-radius:50%;z-index:1;"></div>
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      })
      userMarkerRef.current = L.marker(QUITO_CENTER, { icon: userIcon, interactive: false }).addTo(map)

      mapInstanceRef.current = map
      setMapReady(true)
      setMapError(false)
    } catch (err) {
      console.error('Leaflet init error:', err)
      setMapError(true)
    }

    return () => {
      cancelled = true
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        userMarkerRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update markers (orders, drivers) when data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return
    const map = mapInstanceRef.current

    // Clear old markers/polylines (keep user marker)
    markersRef.current.forEach(m => m.remove())
    polylinesRef.current.forEach(p => p.remove())
    markersRef.current = []
    polylinesRef.current = []

    orders.forEach(order => {
      if (order.originLat !== 0 && order.originLng !== 0) {
        const isActive = order.status === 'accepted' || order.status === 'in_progress'

        const originIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="width:28px;height:28px;background:#1DB954;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;">O</div>`,
          iconSize: [28, 28], iconAnchor: [14, 14],
        })
        markersRef.current.push(
          L.marker([order.originLat, order.originLng], { icon: originIcon })
            .addTo(map).bindPopup(`<b>Origen</b><br>${order.orderNumber}`)
        )

        if (order.destLat !== 0 && order.destLng !== 0) {
          const destIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="width:28px;height:28px;background:#FFC145;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#000;font-size:10px;font-weight:700;">D</div>`,
            iconSize: [28, 28], iconAnchor: [14, 14],
          })
          markersRef.current.push(
            L.marker([order.destLat, order.destLng], { icon: destIcon })
              .addTo(map).bindPopup(`<b>Destino</b><br>${order.orderNumber}`)
          )

          if (isActive) {
            polylinesRef.current.push(
              L.polyline([[order.originLat, order.originLng], [order.destLat, order.destLng]], {
                color: '#1DB954', weight: 3, opacity: 0.8, dashArray: '10, 6'
              }).addTo(map)
            )
          }
        }
      }
    })

    // Driver locations
    if (showDriverLocations) {
      fetch('/api/drivers/locations').then(r => r.json()).then(data => {
        if (!data.drivers || !mapInstanceRef.current) return
        data.drivers.forEach((d: { lat: number; lng: number; name: string; vehicleType: string }) => {
          const icon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="width:14px;height:14px;background:#1DB954;border:2px solid #fff;border-radius:50%;box-shadow:0 0 10px rgba(29,185,84,0.6);"></div>`,
            iconSize: [14, 14], iconAnchor: [7, 7],
          })
          markersRef.current.push(
            L.marker([d.lat, d.lng], { icon: icon })
              .addTo(mapInstanceRef.current!).bindPopup(`<b>${d.name}</b><br>${d.vehicleType}`)
          )
        })
      }).catch(() => {})
    }
  }, [mapReady, orders, showDriverLocations])

  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      <div ref={mapRef} style={{ height, width: '100%' }} />

      {/* Loading overlay */}
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl z-10" style={{ height, width: '100%' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1DB954] mx-auto mb-2" />
            <p className="text-xs text-gray-500">Cargando mapa...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl z-10" style={{ height, width: '100%' }}>
          <p className="text-sm text-gray-500">Error al cargar el mapa. Verifica tu conexión.</p>
        </div>
      )}

      {/* GPS status toast */}
      {mapReady && gpsStatus.msg && (
        <div className="absolute top-3 left-3 z-[1000]">
          <div className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium flex items-center gap-1.5 shadow-sm ${
            gpsStatus.type === 'loading' ? 'bg-gray-50 border border-gray-200 text-gray-500' :
            gpsStatus.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
            gpsStatus.type === 'warning' ? 'bg-amber-50 border border-amber-200 text-amber-700' :
            'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {gpsStatus.type === 'loading' && <div className="animate-spin rounded-full h-2.5 w-2.5 border-b border-[#1DB954]" />}
            {gpsStatus.type === 'success' && <div className="w-2 h-2 rounded-full bg-green-500" />}
            {gpsStatus.type === 'warning' && <span className="text-amber-500">~</span>}
            {gpsStatus.type === 'error' && <span className="text-red-500">!</span>}
            {gpsStatus.msg}
          </div>
        </div>
      )}

      {/* BIG "Mi Ubicación" GPS button - always visible */}
      {mapReady && (
        <button
          onClick={handleGps}
          disabled={gpsLoading}
          className="absolute z-[1000] right-3 bottom-[70px] w-14 h-14 rounded-full bg-[#1DB954] border-4 border-white shadow-xl flex items-center justify-center hover:bg-[#17a34a] active:scale-95 transition-all"
          style={{ boxShadow: '0 4px 14px rgba(29,185,84,0.5)' }}
          title="Mi ubicación GPS"
        >
          {gpsLoading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent" />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            </svg>
          )}
        </button>
      )}
    </div>
  )
}

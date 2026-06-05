'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

interface OrderMapProps {
  originLat?: number
  originLng?: number
  destLat?: number
  destLng?: number
  originAddress?: string
  destAddress?: string
  orders?: Array<{
    id: string
    originLat: number
    originLng: number
    destLat: number
    destLng: number
    proposedPrice: number
    orderNumber: string
  }>
  drivers?: Array<{
    id: string
    lat: number
    lng: number
    vehicleType: string
    name: string
  }>
  height?: string
  interactive?: boolean
  onMapClick?: (lat: number, lng: number) => void
  selectingOrigin?: boolean
  selectingDest?: boolean
  userLocation?: { lat: number; lng: number } | null
  showGpsButton?: boolean
  onGpsLocate?: (lat: number, lng: number) => void
  fullScreen?: boolean
  selectingLabel?: string
}

export default function OrderMap({
  originLat, originLng, destLat, destLng,
  originAddress, destAddress, orders, drivers,
  height = '300px', interactive = true,
  onMapClick, selectingOrigin = false, selectingDest = false,
  userLocation, showGpsButton = true, onGpsLocate,
  fullScreen = false, selectingLabel,
}: OrderMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [locating, setLocating] = useState(false)
  const [mapError, setMapError] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    try {
      let centerLat = -0.1807
      let centerLng = -78.4678
      let zoom = 13

      if (userLocation?.lat && userLocation?.lng) {
        centerLat = userLocation.lat
        centerLng = userLocation.lng
        zoom = 15
      }

      const hasOrigin = originLat && originLng
      const hasDest = destLat && destLng
      if (hasOrigin && hasDest) {
        centerLat = (originLat + destLat) / 2
        centerLng = (originLng + destLng) / 2
        zoom = 13
      } else if (hasOrigin) {
        centerLat = originLat!
        centerLng = originLng!
        zoom = 15
      } else if (hasDest) {
        centerLat = destLat!
        centerLng = destLng!
        zoom = 15
      }

      const map = L.map(mapRef.current, {
        center: [centerLat, centerLng],
        zoom,
        zoomControl: false,
        scrollWheelZoom: interactive,
        dragging: interactive,
        tap: interactive,
        attributionControl: false,
      })

      L.tileLayer(LIGHT_TILES, { maxZoom: 19 }).addTo(map)
      L.control.zoom({ position: 'bottomright' }).addTo(map)
      mapInstanceRef.current = map
      setMapReady(true)
      setMapError(false)
    } catch (err) {
      console.error('Map init error:', err)
      setMapError(true)
    }

    return () => {
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove() } catch {}
        mapInstanceRef.current = null
      }
    }
  }, [fullScreen]) // Re-init when fullScreen changes

  // Update center when user location changes
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation?.lat) return
    try {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 16, { animate: true })
    } catch {}
  }, [userLocation])

  // Handle click
  useEffect(() => {
    if (!mapInstanceRef.current || !onMapClick) return
    try {
      const handler = (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng)
      }
      mapInstanceRef.current.on('click', handler)
      return () => {
        mapInstanceRef.current?.off('click', handler)
      }
    } catch {}
  }, [onMapClick])

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return

    try {
      const map = mapInstanceRef.current

      // Clear markers/polylines (keep tile layer)
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
          map.removeLayer(layer)
        }
      })

      const markers: L.LatLngExpression[] = []

      // Origin marker
      if (originLat && originLng) {
        const originIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="position:relative;width:32px;height:40px;">
            <div style="width:32px;height:32px;background:#1DB954;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
              <div style="width:10px;height:10px;background:#fff;border-radius:50%;"></div>
            </div>
            <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:10px solid #1DB954;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.2));"></div>
          </div>`,
          iconSize: [32, 42],
          iconAnchor: [16, 42],
        })
        L.marker([originLat, originLng], { icon: originIcon })
          .addTo(map)
          .bindPopup(`<strong>Origen</strong><br/>${originAddress || ''}`)
        markers.push([originLat, originLng])
      }

      // Destination marker
      if (destLat && destLng) {
        const destIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="position:relative;width:32px;height:40px;">
            <div style="width:32px;height:32px;background:#FFC145;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
              <div style="width:12px;height:12px;background:#fff;border-radius:3px;"></div>
            </div>
            <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:10px solid #FFC145;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.2));"></div>
          </div>`,
          iconSize: [32, 42],
          iconAnchor: [16, 42],
        })
        L.marker([destLat, destLng], { icon: destIcon })
          .addTo(map)
          .bindPopup(`<strong>Destino</strong><br/>${destAddress || ''}`)
        markers.push([destLat, destLng])
      }

      // User location blue dot
      if (userLocation?.lat && userLocation?.lng) {
        const userIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="position:relative;width:24px;height:24px;">
            <div style="width:14px;height:14px;background:#3B82F6;border:3px solid #fff;border-radius:50%;box-shadow:0 0 12px rgba(59,130,246,0.6);position:absolute;top:5px;left:5px;"></div>
            <div style="width:24px;height:24px;background:rgba(59,130,246,0.15);border-radius:50%;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
          </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
        L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .addTo(map)
      }

      // Route line
      if (originLat && originLng && destLat && destLng) {
        L.polyline(
          [[originLat, originLng], [destLat, destLng]],
          { color: '#1DB954', weight: 4, opacity: 0.6, dashArray: '10, 8' }
        ).addTo(map)

        const bounds = L.latLngBounds([
          [originLat, originLng],
          [destLat, destLng],
        ])
        map.fitBounds(bounds, { padding: [60, 60] })
      }

      // Order pins
      if (orders) {
        orders.forEach((order) => {
          if (order.originLat && order.originLng) {
            const orderIcon = L.divIcon({
              className: 'custom-marker',
              html: `<div style="width:36px;height:36px;background:linear-gradient(135deg,#FFC145,#d97706);border:2px solid #fff;border-radius:10px;box-shadow:0 3px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#fff;">$</div>`,
              iconSize: [36, 36],
              iconAnchor: [18, 18],
            })
            L.marker([order.originLat, order.originLng], { icon: orderIcon })
              .addTo(map)
              .bindPopup(`<strong>${order.orderNumber}</strong><br/>$${order.proposedPrice}`)
            markers.push([order.originLat, order.originLng])
          }
        })
      }

      // Driver markers
      if (drivers) {
        drivers.forEach((driver) => {
          if (driver.lat && driver.lng) {
            const driverIcon = L.divIcon({
              className: 'custom-marker',
              html: `<div style="width:20px;height:20px;background:#1DB954;border:2px solid #fff;border-radius:50%;box-shadow:0 0 10px rgba(29,185,84,0.6);"></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            })
            L.marker([driver.lat, driver.lng], { icon: driverIcon })
              .addTo(map)
              .bindPopup(`<strong>${driver.name}</strong><br/>${driver.vehicleType}`)
            markers.push([driver.lat, driver.lng])
          }
        })
      }

      if (markers.length > 1 && !originLat && !destLat) {
        const bounds = L.latLngBounds(markers)
        map.fitBounds(bounds, { padding: [30, 30] })
      }
    } catch {}
  }, [mapReady, originLat, originLng, destLat, destLng, orders, drivers, userLocation])

  // GPS locate
  async function handleGpsLocate() {
    if (!navigator.geolocation) return
    setLocating(true)

    // Force GPS on Android with high accuracy
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 17, { animate: true })
        }
        if (onGpsLocate) {
          onGpsLocate(latitude, longitude)
        }
        setLocating(false)
      },
      (err) => {
        console.warn('GPS error:', err.message)
        setLocating(false)
      },
      options
    )
  }

  // Invalidate map size after fullscreen transition
  useEffect(() => {
    if (fullScreen && mapInstanceRef.current) {
      const timer = setTimeout(() => {
        try { mapInstanceRef.current?.invalidateSize() } catch {}
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [fullScreen])

  return (
    <div
      className={`relative ${fullScreen ? 'fixed inset-0 z-40' : 'rounded-xl overflow-hidden border border-gray-200'}`}
      style={fullScreen ? { height: '100vh', width: '100vw' } : { height, width: '100%' }}
    >
      <div
        ref={mapRef}
        style={{ height: '100%', width: '100%' }}
        className={selectingOrigin || selectingDest ? 'cursor-crosshair' : ''}
      />

      {/* Map loading/error */}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <p className="text-sm text-gray-500">Error al cargar el mapa. Verifica tu conexión.</p>
        </div>
      )}

      {/* GPS Button */}
      {showGpsButton && interactive && !mapError && (
        <button
          onClick={handleGpsLocate}
          className={`absolute ${fullScreen ? 'bottom-8' : 'bottom-3'} left-3 z-[1000] w-11 h-11 bg-white rounded-xl shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors`}
          title="Mi ubicación GPS"
        >
          {locating ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#3B82F6] border-t-transparent" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              <path d="M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          )}
        </button>
      )}

      {/* Selecting indicator */}
      {(selectingOrigin || selectingDest) && !mapError && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1001]">
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-700 shadow-lg flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${selectingOrigin ? 'bg-[#1DB954]' : 'bg-[#FFC145]'}`} />
            {selectingLabel || `Toca el mapa para marcar ${selectingOrigin ? 'el origen' : 'el destino'}`}
          </div>
        </div>
      )}
    </div>
  )
}

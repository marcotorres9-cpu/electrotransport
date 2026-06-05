'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// CartoDB Voyager tiles - light theme
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
  onGpsClick?: () => void
  fullScreen?: boolean
}

export default function OrderMap({
  originLat,
  originLng,
  destLat,
  destLng,
  originAddress,
  destAddress,
  orders,
  drivers,
  height = '300px',
  interactive = true,
  onMapClick,
  selectingOrigin = false,
  selectingDest = false,
  userLocation,
  showGpsButton = true,
  onGpsClick,
  fullScreen = false,
}: OrderMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    if (!mapRef.current) return

    // Clean up previous map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    // Determine center - use user location as priority
    let centerLat = -0.1807
    let centerLng = -78.4678
    let zoom = 13

    // Priority 1: user detected location
    if (userLocation?.lat && userLocation?.lng) {
      centerLat = userLocation.lat
      centerLng = userLocation.lng
      zoom = 14
    }

    // Priority 2: both origin and dest
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

    // Light map tiles
    L.tileLayer(LIGHT_TILES, {
      maxZoom: 19,
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)
    mapInstanceRef.current = map
    setMapReady(true)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update center when user location changes
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation?.lat) return
    mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 15, { animate: true })
  }, [userLocation])

  // Handle click events
  useEffect(() => {
    if (!mapInstanceRef.current || !onMapClick) return

    const handler = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng)
    }

    mapInstanceRef.current.on('click', handler)
    return () => {
      mapInstanceRef.current?.off('click', handler)
    }
  }, [onMapClick])

  // Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return

    const map = mapInstanceRef.current

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer)
      }
    })

    const markers: L.LatLngExpression[] = []

    // Origin marker - Uber-style pin
    if (originLat && originLng) {
      const originIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="position:relative;">
          <div style="width:32px;height:32px;background:#1DB954;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 10px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6" r="3" fill="white"/><circle cx="8" cy="6" r="1.5" fill="#1DB954"/></svg>
          </div>
          <div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #1DB954;"></div>
        </div>`,
        iconSize: [32, 40],
        iconAnchor: [16, 40],
      })
      L.marker([originLat, originLng], { icon: originIcon })
        .addTo(map)
        .bindPopup(`<strong>Origen</strong><br/>${originAddress || ''}`)
      markers.push([originLat, originLng])
    }

    // Destination marker - Uber-style pin
    if (destLat && destLng) {
      const destIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="position:relative;">
          <div style="width:32px;height:32px;background:#FFC145;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 10px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="4" y="3" width="8" height="8" rx="2" fill="white"/><rect x="6" y="5" width="4" height="4" rx="1" fill="#FFC145"/></svg>
          </div>
          <div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #FFC145;"></div>
        </div>`,
        iconSize: [32, 40],
        iconAnchor: [16, 40],
      })
      L.marker([destLat, destLng], { icon: destIcon })
        .addTo(map)
        .bindPopup(`<strong>Destino</strong><br/>${destAddress || ''}`)
      markers.push([destLat, destLng])
    }

    // User location blue dot with pulse
    if (userLocation?.lat && userLocation?.lng) {
      const userIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="position:relative;">
          <div style="width:16px;height:16px;background:#3B82F6;border:3px solid #fff;border-radius:50%;box-shadow:0 0 12px rgba(59,130,246,0.6);"></div>
          <div style="position:absolute;inset:-8px;width:32px;height:32px;background:rgba(59,130,246,0.15);border-radius:50%;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<b>Mi ubicación</b>')
    }

    // Route line between origin and destination
    if (originLat && originLng && destLat && destLng) {
      const routeLine = L.polyline(
        [[originLat, originLng], [destLat, destLng]],
        { color: '#1DB954', weight: 4, opacity: 0.7, dashArray: '12, 8' }
      ).addTo(map)

      const bounds = L.latLngBounds([
        [originLat, originLng],
        [destLat, destLng],
      ])
      map.fitBounds(bounds, { padding: [80, 80] })
    }

    // Available order pins
    if (orders) {
      orders.forEach((order) => {
        if (order.originLat && order.originLng) {
          const orderIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="width:36px;height:36px;background:linear-gradient(135deg,#FFC145,#d97706);border:2px solid #fff;border-radius:10px;box-shadow:0 3px 10px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#fff;">$</div>`,
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
            html: `<div style="position:relative;">
              <div style="width:20px;height:20px;background:#1DB954;border:2px solid #fff;border-radius:50%;box-shadow:0 0 10px rgba(29,185,84,0.6);display:flex;align-items:center;justify-content:center;">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="white"><path d="M5 0L10 5L5 10L0 5Z"/></svg>
              </div>
              <div style="position:absolute;inset:-6px;width:32px;height:32px;background:rgba(29,185,84,0.15);border-radius:50%;animation:ping 2s infinite;"></div>
            </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          })
          L.marker([driver.lat, driver.lng], { icon: driverIcon })
            .addTo(map)
            .bindPopup(`<strong>${driver.name}</strong><br/>${driver.vehicleType}`)
          markers.push([driver.lat, driver.lng])
        }
      })
    }

    // Auto-fit to markers if multiple and no origin/dest
    if (markers.length > 1 && !originLat && !destLat) {
      const bounds = L.latLngBounds(markers)
      map.fitBounds(bounds, { padding: [30, 30] })
    }
  }, [mapReady, originLat, originLng, destLat, destLng, orders, drivers, userLocation])

  // GPS locate function
  async function handleGpsLocate() {
    if (!navigator.geolocation) {
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16, { animate: true })
        }
        if (onGpsClick) {
          onGpsClick()
        }
        setLocating(false)
      },
      () => {
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  return (
    <div className={`relative ${fullScreen ? 'fixed inset-0' : 'rounded-xl overflow-hidden border border-gray-200'}`}>
      <div
        ref={mapRef}
        style={fullScreen ? { height: '100%', width: '100%' } : { height, width: '100%' }}
        className={selectingOrigin || selectingDest ? 'cursor-crosshair' : ''}
      />

      {/* GPS Button */}
      {showGpsButton && interactive && (
        <button
          onClick={handleGpsLocate}
          className={`absolute ${fullScreen ? 'bottom-6' : 'bottom-3'} left-3 z-[1000] w-10 h-10 bg-white rounded-xl shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors`}
          title="Mi ubicación"
        >
          {locating ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#3B82F6] border-t-transparent" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              <path d="M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          )}
        </button>
      )}

      {/* Selecting indicator */}
      {(selectingOrigin || selectingDest) && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-700 shadow-lg flex items-center gap-2">
            <MapPin className={`h-4 w-4 ${selectingOrigin ? 'text-[#1DB954]' : 'text-[#FFC145]'}`} />
            Toca el mapa para marcar {selectingOrigin ? 'el origen' : 'el destino'}
          </div>
        </div>
      )}
    </div>
  )
}

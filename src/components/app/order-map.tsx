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
}: OrderMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const [mapReady, setMapReady] = useState(false)

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
    let zoom = 12

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
      zoom = 14
    } else if (hasDest) {
      centerLat = destLat!
      centerLng = destLng!
      zoom = 14
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
    mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 14, { animate: true })
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

    // Origin marker
    if (originLat && originLng) {
      const originIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="width:28px;height:28px;background:#1DB954;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;">O</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
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
        html: `<div style="width:28px;height:28px;background:#FFC145;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#000;font-size:11px;font-weight:700;">D</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
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
        html: `<div style="width:14px;height:14px;background:#3B82F6;border:3px solid #fff;border-radius:50%;box-shadow:0 0 10px rgba(59,130,246,0.5);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<b>Mi ubicación</b>')
    }

    // Route line between origin and destination
    if (originLat && originLng && destLat && destLng) {
      const routeLine = L.polyline(
        [[originLat, originLng], [destLat, destLng]],
        { color: '#1DB954', weight: 3, opacity: 0.8, dashArray: '10, 10' }
      ).addTo(map)

      const bounds = L.latLngBounds([
        [originLat, originLng],
        [destLat, destLng],
      ])
      map.fitBounds(bounds, { padding: [50, 50] })
    }

    // Available order pins
    if (orders) {
      orders.forEach((order) => {
        if (order.originLat && order.originLng) {
          const orderIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="width:32px;height:32px;background:linear-gradient(135deg,#FFC145,#d97706);border:2px solid #fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">$</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
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
            html: `<div style="position:relative;"><div style="width:16px;height:16px;background:#1DB954;border:2px solid #fff;border-radius:50%;box-shadow:0 0 8px rgba(29,185,84,0.6);"></div><div style="position:absolute;inset:-4px;width:24px;height:24px;background:rgba(29,185,84,0.2);border-radius:50%;animation:ping 2s infinite;"></div></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })
          L.marker([driver.lat, driver.lng], { icon: driverIcon })
            .addTo(map)
            .bindPopup(`<strong>${driver.name}</strong><br/>${driver.vehicleType}`)
          markers.push([driver.lat, driver.lng])
        }
      })
    }

    // Auto-fit to markers if multiple
    if (markers.length > 1 && !originLat && !destLat) {
      const bounds = L.latLngBounds(markers)
      map.fitBounds(bounds, { padding: [30, 30] })
    }
  }, [mapReady, originLat, originLng, destLat, destLng, orders, drivers, userLocation])

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-300">
      <div
        ref={mapRef}
        style={{ height, width: '100%' }}
        className={selectingOrigin || selectingDest ? 'cursor-crosshair' : ''}
      />
      {(selectingOrigin || selectingDest) && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="bg-[#F9FAFB] border border-gray-300 rounded-lg px-3 py-2 text-xs font-medium text-[#1DB954] shadow-lg">
            📍 Toca el mapa para marcar {selectingOrigin ? 'el origen' : 'el destino'}
          </div>
        </div>
      )}
    </div>
  )
}

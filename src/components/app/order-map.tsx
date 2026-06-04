'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

    // Determine center
    const hasOrigin = originLat && originLng
    const hasDest = destLat && destLng
    let centerLat = -0.1807  // Quito, Ecuador default
    let centerLng = -78.4678
    let zoom = 12

    // Use user's detected location if available
    if (userLocation?.lat && userLocation?.lng) {
      centerLat = userLocation.lat
      centerLng = userLocation.lng
      zoom = 13
    }

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
      zoomControl: true,
      scrollWheelZoom: interactive,
      dragging: interactive,
      tap: interactive,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)

    L.control.attribution({ prefix: false }).addTo(map)
    mapInstanceRef.current = map
    setMapReady(true)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, []) // Only create map once

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
        className: 'origin-marker',
        html: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })
      L.marker([originLat, originLng], { icon: originIcon })
        .addTo(map)
        .bindPopup(`<strong>Origen</strong><br/>${originAddress || ''}`)
      markers.push([originLat, originLng])
    }

    // Destination marker
    if (destLat && destLng) {
      const destIcon = L.divIcon({
        className: 'dest-marker',
        html: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })
      L.marker([destLat, destLng], { icon: destIcon })
        .addTo(map)
        .bindPopup(`<strong>Destino</strong><br/>${destAddress || ''}`)
      markers.push([destLat, destLng])
    }

    // Route line between origin and destination
    if (originLat && originLng && destLat && destLng) {
      const routeLine = L.polyline(
        [
          [originLat, originLng],
          [destLat, destLng],
        ],
        {
          color: '#059669',
          weight: 3,
          opacity: 0.7,
          dashArray: '10, 10',
        }
      ).addTo(map)
      routeLine.bindPopup('Ruta estimada')

      // Fit bounds to route
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
            className: '',
            html: `<div class="driver-marker" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>`,
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
            className: '',
            html: `<div class="driver-radar-marker"><div class="radar-ping"></div><div class="radar-core"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><rect x="1" y="3" width="15" height="13" rx="2" ry="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></div></div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
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
  }, [mapReady, originLat, originLng, destLat, destLng, orders, drivers])

  return (
    <div className="relative rounded-xl overflow-hidden shadow-md border border-slate-200">
      <div
        ref={mapRef}
        style={{ height, width: '100%' }}
        className={selectingOrigin || selectingDest ? 'cursor-crosshair' : ''}
      />
      {(selectingOrigin || selectingDest) && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="glass-card rounded-lg px-3 py-2 text-sm font-medium text-emerald-700 shadow-lg">
            📍 Haz clic en el mapa para marcar {selectingOrigin ? 'el origen' : 'el destino'}
          </div>
        </div>
      )}
    </div>
  )
}

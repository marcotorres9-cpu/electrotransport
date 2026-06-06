'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Google Maps tiles - most up-to-date street data for Quito/Ecuador
const GOOGLE_TILES = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
const SATELLITE_TILES = 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'

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
  userLocation, showGpsButton = false, onGpsLocate,
  fullScreen = false, selectingLabel,
}: OrderMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState(false)
  const [tileSource, setTileSource] = useState<'google' | 'satellite'>('google')

  // Quito center - always default here
  const QUITO_CENTER: [number, number] = [-0.1807, -78.4678]

  // Get tile URL
  function getTileUrl() {
    return tileSource === 'google' ? GOOGLE_TILES : SATELLITE_TILES
  }

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    try {
      let centerLat = QUITO_CENTER[0]
      let centerLng = QUITO_CENTER[1]
      let zoom = 13

      const hasOrigin = originLat && originLng
      const hasDest = destLat && destLng
      if (hasOrigin && hasDest) {
        centerLat = (originLat + destLat) / 2
        centerLng = (originLng + destLng) / 2
        zoom = 13
      } else if (hasOrigin) {
        centerLat = originLat!
        centerLng = originLng!
        zoom = 16
      } else if (hasDest) {
        centerLat = destLat!
        centerLng = destLng!
        zoom = 16
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

      const url = getTileUrl()
      tileLayerRef.current = L.tileLayer(url, {
        maxZoom: 20,
      }).addTo(map)

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
  }, [fullScreen, tileSource]) // Re-init when fullscreen or tile source changes

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
  }, [mapReady, originLat, originLng, destLat, destLng, orders, drivers])

  // Switch tile layer
  function handleSwitchTiles() {
    const next = tileSource === 'google' ? 'satellite' : 'google'
    setTileSource(next)
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

      {/* Tile layer switcher */}
      {!mapError && (
        <button
          onClick={handleSwitchTiles}
          className={`absolute ${fullScreen ? 'top-16' : 'top-3'} right-3 z-[1000] px-2.5 py-1.5 bg-white rounded-lg shadow-md border border-gray-200 text-[10px] font-semibold text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors`}
          title="Cambiar tipo de mapa"
        >
          {tileSource === 'google' ? '🗺️ Calles' : '🛰️ Satélite'}
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

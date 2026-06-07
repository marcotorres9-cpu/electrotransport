// Geolocation utility for browser and Capacitor WebView
// Strategies: GPS high accuracy -> GPS low accuracy -> IP fallback -> Quito center

const QUITO_CENTER: [number, number] = [-0.1807, -78.4678]

const QUITO_BOUNDS = {
  minLat: -0.35, maxLat: 0.05,
  minLng: -78.65, maxLng: -78.35,
}

function isInQuito(lat: number, lng: number): boolean {
  return lat >= QUITO_BOUNDS.minLat && lat <= QUITO_BOUNDS.maxLat &&
         lng >= QUITO_BOUNDS.minLng && lng <= QUITO_BOUNDS.maxLng
}

export interface LocationResult {
  lat: number
  lng: number
  source: 'gps' | 'ip_api' | 'default'
  accuracy?: number
  message: string
}

// Check if navigator.geolocation exists and has permission
function isGeolocationAvailable(): boolean {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return false
  return true
}

// Check geolocation permission state
async function checkGeoPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' })
    return result.state as 'granted' | 'denied' | 'prompt'
  } catch {
    return 'prompt'
  }
}

// Request geolocation with specific options
function requestPosition(options: PositionOptions): Promise<Position> {
  return new Promise((resolve, reject) => {
    if (!isGeolocationAvailable()) {
      reject(new Error('GPS_NO_AVAILABLE'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  })
}

// Strategy 1: GPS high accuracy (true GPS chip)
async function tryGpsHigh(): Promise<LocationResult | null> {
  try {
    const pos = await requestPosition({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    })
    const { latitude: lat, longitude: lng, accuracy } = pos.coords
    if (isInQuito(lat, lng)) {
      return {
        lat, lng, source: 'gps', accuracy,
        message: `GPS detectado (±${Math.round(accuracy)}m)`
      }
    }
    // Outside Quito - still return if GPS is valid
    return { lat, lng, source: 'gps', accuracy, message: `GPS activo (${lat.toFixed(4)}, ${lng.toFixed(4)})` }
  } catch (err: any) {
    const code = err?.code
    const msg = err?.message || ''
    console.warn('GPS high accuracy failed:', code, msg)
    // If permission denied, don't retry
    if (code === 1) {
      throw new Error('PERMISSION_DENIED')
    }
    return null
  }
}

// Strategy 2: GPS low accuracy (cell towers, WiFi)
async function tryGpsLow(): Promise<LocationResult | null> {
  try {
    const pos = await requestPosition({
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 60000,
    })
    const { latitude: lat, longitude: lng, accuracy } = pos.coords
    if (isInQuito(lat, lng)) {
      return {
        lat, lng, source: 'gps', accuracy,
        message: `Ubicación aproximada (±${Math.round(accuracy)}m)`
      }
    }
    return null
  } catch (err: any) {
    const code = err?.code
    if (code === 1) {
      throw new Error('PERMISSION_DENIED')
    }
    return null
  }
}

// Strategy 3: IP geolocation via server
async function tryIpGeo(): Promise<LocationResult> {
  try {
    const res = await fetch('/api/geolocation', { signal: AbortSignal.timeout(5000) })
    const data = await res.json()
    if (data.lat && data.lng) {
      const source = data.source === 'ip_quito' ? 'ip_api' : 'default'
      return {
        lat: data.lat, lng: data.lng, source,
        message: data.message || 'Ubicación estimada por IP'
      }
    }
  } catch {
    // silent
  }
  return {
    lat: QUITO_CENTER[0], lng: QUITO_CENTER[1],
    source: 'default', message: 'Centro de Quito'
  }
}

// Main function: get user location with all strategies
export async function getUserLocation(): Promise<LocationResult> {
  // Check permission state first
  const permState = await checkGeoPermission()

  if (permState === 'denied') {
    console.warn('GPS permission denied by user, falling back to IP')
    return await tryIpGeo()
  }

  // Try GPS
  try {
    // Strategy 1: High accuracy GPS
    const highResult = await tryGpsHigh()
    if (highResult) return highResult

    // Strategy 2: Low accuracy GPS
    const lowResult = await tryGpsLow()
    if (lowResult) return lowResult
  } catch (err: any) {
    if (err.message === 'PERMISSION_DENIED') {
      // User denied GPS, go straight to IP
      console.warn('User denied GPS permission')
      return await tryIpGeo()
    }
  }

  // Strategy 3: IP fallback
  return await tryIpGeo()
}

// Check if GPS is available at all
export function isGpsSupported(): boolean {
  return isGeolocationAvailable()
}

export { QUITO_CENTER, isInQuito, checkGeoPermission }

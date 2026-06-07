// Shared geolocation utility with multiple fallback strategies
// Works in both browser and Capacitor WebView

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

// Strategy 1: Try browser GPS with high accuracy
function tryGpsHighAccuracy(): Promise<LocationResult> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('GPS no disponible'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords
        if (isInQuito(lat, lng)) {
          resolve({
            lat, lng,
            source: 'gps',
            accuracy,
            message: 'Ubicación GPS detectada'
          })
        } else {
          reject(new Error('Fuera de Quito'))
        }
      },
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    )
  })
}

// Strategy 2: Try GPS with low accuracy (faster, uses cell towers)
function tryGpsLowAccuracy(): Promise<LocationResult> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('GPS no disponible'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords
        if (isInQuito(lat, lng)) {
          resolve({
            lat, lng,
            source: 'gps',
            accuracy,
            message: 'Ubicación aproximada detectada'
          })
        } else {
          reject(new Error('Fuera de Quito'))
        }
      },
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    )
  })
}

// Strategy 3: Server-side IP geolocation
async function tryIpGeolocation(): Promise<LocationResult> {
  try {
    const res = await fetch('/api/geolocation', { signal: AbortSignal.timeout(5000) })
    const data = await res.json()
    return {
      lat: data.lat,
      lng: data.lng,
      source: data.source === 'ip_quito' ? 'ip_api' : 'default',
      message: data.message
    }
  } catch {
    return {
      lat: QUITO_CENTER[0],
      lng: QUITO_CENTER[1],
      source: 'default',
      message: 'Centro de Quito'
    }
  }
}

// Main function: tries GPS first, then IP fallback
export async function getUserLocation(): Promise<LocationResult> {
  // Try 1: GPS high accuracy
  try {
    const result = await tryGpsHighAccuracy()
    return result
  } catch {
    // GPS high accuracy failed, try low accuracy
  }

  // Try 2: GPS low accuracy
  try {
    const result = await tryGpsLowAccuracy()
    return result
  } catch {
    // GPS failed completely, use IP
  }

  // Try 3: IP geolocation
  const result = await tryIpGeolocation()
  return result
}

export { QUITO_CENTER, isInQuito }

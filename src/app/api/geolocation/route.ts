import { NextResponse } from 'next/server'

// Quito center fallback
const QUITO_CENTER = { lat: -0.1807, lng: -78.4678 }

// Quito bounds
const QUITO_BOUNDS = {
  minLat: -0.35, maxLat: 0.05,
  minLng: -78.65, maxLng: -78.35,
}

function isInQuito(lat: number, lng: number): boolean {
  return lat >= QUITO_BOUNDS.minLat && lat <= QUITO_BOUNDS.maxLat &&
         lng >= QUITO_BOUNDS.minLng && lng <= QUITO_BOUNDS.maxLng
}

export async function GET(request: Request) {
  try {
    // Try to get client IP from various headers
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0]?.trim() || realIp || ''

    let lat = QUITO_CENTER.lat
    let lng = QUITO_CENTER.lng
    let source = 'default_quito'
    let city = 'Quito'

    if (ip) {
      try {
        // Use ip-api.com (free, no key needed)
        const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,lat,lon,city,regionName,country`, {
          signal: AbortSignal.timeout(5000)
        })
        const data = await res.json()

        if (data.status === 'success' && data.lat && data.lon) {
          if (isInQuito(data.lat, data.lon)) {
            lat = data.lat
            lng = data.lon
            source = 'ip_quito'
            city = data.city || 'Quito'
          } else {
            // IP is not in Quito area - use Quito center but note the real city
            source = 'default_quito'
            city = data.city || 'Quito'
          }
        }
      } catch {
        // IP lookup failed, use default
      }
    }

    return NextResponse.json({
      lat,
      lng,
      city,
      source,
      message: source === 'ip_quito'
        ? `Ubicación estimada: ${city}`
        : 'Centro de Quito (GPS no disponible)'
    })
  } catch {
    return NextResponse.json({
      lat: QUITO_CENTER.lat,
      lng: QUITO_CENTER.lng,
      city: 'Quito',
      source: 'default_quito',
      message: 'Centro de Quito'
    })
  }
}

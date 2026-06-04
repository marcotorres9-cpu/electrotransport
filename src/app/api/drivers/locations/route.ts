import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Default Quito center coordinates
const DEFAULT_LAT = -0.1807
const DEFAULT_LNG = -78.4678

export async function GET() {
  try {
    const drivers = await db.etDriver.findMany({
      where: { isOnline: true },
      include: {
        user: { select: { id: true, name: true } },
      },
    })

    const driverLocations = drivers.map((d) => ({
      id: d.id,
      userId: d.userId,
      name: d.user.name,
      vehicleType: d.vehicleType,
      vehiclePlate: d.vehiclePlate,
      lat: d.lat || DEFAULT_LAT + (Math.random() - 0.5) * 0.05,
      lng: d.lng || DEFAULT_LNG + (Math.random() - 0.5) * 0.05,
      isOnline: d.isOnline,
    }))

    return NextResponse.json({ drivers: driverLocations })
  } catch (error) {
    console.error('Get driver locations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

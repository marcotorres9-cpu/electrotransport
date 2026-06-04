import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Default Quito center coordinates
const DEFAULT_LAT = -0.1807
const DEFAULT_LNG = -78.4678

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    const role = request.headers.get('x-user-role')

    if (!userId || role !== 'driver') {
      return NextResponse.json({ error: 'Only drivers can toggle status' }, { status: 403 })
    }

    const { id } = await params
    const driver = await db.etDriver.findFirst({ where: { id } })

    if (!driver || driver.userId !== userId) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
    }

    // When going online, set location to Quito center if no location
    const updateData: Record<string, unknown> = {
      isOnline: !driver.isOnline,
    }

    if (!driver.isOnline) {
      updateData.lat = driver.lat || DEFAULT_LAT + (Math.random() - 0.5) * 0.04
      updateData.lng = driver.lng || DEFAULT_LNG + (Math.random() - 0.5) * 0.04
    }

    const updated = await db.etDriver.update({
      where: { id },
      data: updateData,
      include: { user: { select: { id: true, name: true } } },
    })

    return NextResponse.json({
      driver: {
        ...updated,
        isOnline: updated.isOnline,
      },
    })
  } catch (error) {
    console.error('Toggle driver status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Default Quito center coordinates
const DEFAULT_LAT = -0.1807
const DEFAULT_LNG = -78.4678

export async function GET() {
  try {
    const drivers = await db.etDriver.findMany({
      where: { isOnline: true },
      include: {
        user: { select: { id: true, name: true, phone: true, isActive: true } },
      },
      orderBy: { rating: 'desc' },
    })

    return NextResponse.json({ drivers })
  } catch (error) {
    console.error('Get drivers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

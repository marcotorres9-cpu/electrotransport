import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const drivers = await db.driver.findMany({
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

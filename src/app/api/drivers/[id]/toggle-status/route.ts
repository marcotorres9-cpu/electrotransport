import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
    const driver = await db.driver.findFirst({ where: { id } })

    if (!driver || driver.userId !== userId) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
    }

    const updated = await db.driver.update({
      where: { id },
      data: { isOnline: !driver.isOnline },
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

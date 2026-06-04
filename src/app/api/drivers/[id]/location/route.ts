import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { lat, lng } = body

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
    }

    const driver = await db.etDriver.update({
      where: { id },
      data: { lat, lng },
    })

    return NextResponse.json({ driver })
  } catch (error) {
    console.error('Update driver location error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const order = await db.order.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, phone: true } },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            driver: { select: { vehicleType: true, vehicleBrand: true, vehicleModel: true, vehiclePlate: true } },
          },
        },
        store: { select: { id: true, storeName: true, address: true } },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Get order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status, acceptedPrice, counterPrice, ratingByStore, ratingByDriver, reviewByStore, reviewByDriver } = body

    const existingOrder = await db.order.findUnique({ where: { id } })
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (acceptedPrice !== undefined) updateData.acceptedPrice = parseFloat(String(acceptedPrice))
    if (counterPrice !== undefined) updateData.counterPrice = parseFloat(String(counterPrice))
    if (ratingByStore !== undefined) updateData.ratingByStore = parseFloat(String(ratingByStore))
    if (ratingByDriver !== undefined) updateData.ratingByDriver = parseFloat(String(ratingByDriver))
    if (reviewByStore !== undefined) updateData.reviewByStore = reviewByStore
    if (reviewByDriver !== undefined) updateData.reviewByDriver = reviewByDriver

    if (status === 'delivered') updateData.completedAt = new Date()
    if (status === 'cancelled') updateData.cancelledAt = new Date()

    const order = await db.order.update({
      where: { id },
      data: updateData,
      include: {
        creator: { select: { id: true, name: true } },
        driver: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Update order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

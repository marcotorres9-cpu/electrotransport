import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id')
    const role = request.headers.get('x-user-role')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { rating, review } = body

    const order = await db.etOrder.findUnique({ where: { id } })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (role === 'driver' && order.acceptedBy !== userId) {
      return NextResponse.json({ error: 'Not your order' }, { status: 403 })
    }

    if (role === 'store' && order.createdBy !== userId) {
      return NextResponse.json({ error: 'Not your order' }, { status: 403 })
    }

    if (order.status !== 'accepted' && order.status !== 'in_progress') {
      return NextResponse.json({ error: 'Order must be accepted or in progress' }, { status: 400 })
    }

    const updatedOrder = await db.etOrder.update({
      where: { id },
      data: {
        status: 'delivered',
        completedAt: new Date(),
        ...(role === 'store' && rating ? { ratingByStore: parseFloat(String(rating)), reviewByStore: review || null } : {}),
        ...(role === 'driver' && rating ? { ratingByDriver: parseFloat(String(rating)), reviewByDriver: review || null } : {}),
      },
      include: {
        creator: { select: { id: true, name: true } },
        driver: { select: { id: true, name: true } },
      },
    })

    // Update driver stats
    if (order.acceptedBy) {
      await db.etDriver.update({
        where: { userId: order.acceptedBy },
        data: {
          totalTrips: { increment: 1 },
          earnings: { increment: order.acceptedPrice || order.proposedPrice },
        },
      })
    }

    // Notify store
    if (order.createdBy !== userId) {
      await db.etNotification.create({
        data: {
          userId: order.createdBy,
          title: 'Pedido entregado',
          message: `El pedido ${order.orderNumber} ha sido marcado como entregado.`,
          type: 'order',
          orderId: order.id,
        },
      })
    }

    // Notify driver
    if (order.acceptedBy && order.acceptedBy !== userId) {
      await db.etNotification.create({
        data: {
          userId: order.acceptedBy,
          title: 'Entrega completada',
          message: `La entrega del pedido ${order.orderNumber} ha sido confirmada.`,
          type: 'order',
          orderId: order.id,
        },
      })
    }

    return NextResponse.json({ order: updatedOrder })
  } catch (error) {
    console.error('Complete order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

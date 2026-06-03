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
    const { cancelReason } = body

    const order = await db.order.findUnique({ where: { id } })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Only creator or assigned driver can cancel
    if (order.createdBy !== userId && order.acceptedBy !== userId) {
      return NextResponse.json({ error: 'Not authorized to cancel this order' }, { status: 403 })
    }

    if (order.status === 'delivered' || order.status === 'cancelled') {
      return NextResponse.json({ error: 'Cannot cancel this order' }, { status: 400 })
    }

    const updatedOrder = await db.order.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelReason: cancelReason || null,
      },
      include: {
        creator: { select: { id: true, name: true } },
        driver: { select: { id: true, name: true } },
      },
    })

    // Notify relevant parties
    if (order.createdBy !== userId) {
      await db.notification.create({
        data: {
          userId: order.createdBy,
          title: 'Pedido cancelado',
          message: `El pedido ${order.orderNumber} ha sido cancelado.`,
          type: 'order',
          orderId: order.id,
        },
      })
    }
    if (order.acceptedBy && order.acceptedBy !== userId) {
      await db.notification.create({
        data: {
          userId: order.acceptedBy,
          title: 'Pedido cancelado',
          message: `El pedido ${order.orderNumber} ha sido cancelado.`,
          type: 'order',
          orderId: order.id,
        },
      })
    }

    return NextResponse.json({ order: updatedOrder })
  } catch (error) {
    console.error('Cancel order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

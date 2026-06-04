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

    const order = await db.etOrder.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true } },
        driver: { select: { id: true, name: true } },
        store: { select: { id: true, storeName: true } },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Only the order creator (store) can approve
    if (order.createdBy !== userId) {
      return NextResponse.json({ error: 'Only the order creator can approve offers' }, { status: 403 })
    }

    if (order.status !== 'offer_received') {
      return NextResponse.json({ error: 'Order is not in offer_received status' }, { status: 400 })
    }

    if (!order.acceptedBy) {
      return NextResponse.json({ error: 'No driver offer to approve' }, { status: 400 })
    }

    const updatedOrder = await db.etOrder.update({
      where: { id },
      data: {
        status: 'accepted',
        // acceptedPrice is already set from the offer
      },
      include: {
        creator: { select: { id: true, name: true } },
        driver: { select: { id: true, name: true } },
        store: { select: { id: true, storeName: true } },
      },
    })

    // Notification for driver: offer accepted
    await db.etNotification.create({
      data: {
        userId: order.acceptedBy,
        title: '¡Oferta aceptada!',
        message: `El local ha confirmado tu oferta de $${(order.acceptedPrice || 0).toFixed(2)} para el pedido ${order.orderNumber}. ¡Comienza el transporte!`,
        type: 'order',
        orderId: order.id,
      },
    })

    // Notification for store: confirmed
    await db.etNotification.create({
      data: {
        userId: order.createdBy,
        title: 'Oferta aceptada',
        message: `Has aceptado la oferta del transportista. El pedido ${order.orderNumber} está ahora en curso.`,
        type: 'order',
        orderId: order.id,
      },
    })

    return NextResponse.json({ order: updatedOrder })
  } catch (error) {
    console.error('Approve offer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

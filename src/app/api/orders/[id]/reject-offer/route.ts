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

    // Only the order creator (store) can reject
    if (order.createdBy !== userId) {
      return NextResponse.json({ error: 'Only the order creator can reject offers' }, { status: 403 })
    }

    if (order.status !== 'offer_received') {
      return NextResponse.json({ error: 'Order is not in offer_received status' }, { status: 400 })
    }

    if (!order.acceptedBy) {
      return NextResponse.json({ error: 'No driver offer to reject' }, { status: 400 })
    }

    const driverId = order.acceptedBy

    const updatedOrder = await db.etOrder.update({
      where: { id },
      data: {
        status: 'pending',
        acceptedBy: null,
        acceptedPrice: null,
        // keep counterPrice as history
      },
      include: {
        creator: { select: { id: true, name: true } },
        driver: { select: { id: true, name: true } },
        store: { select: { id: true, storeName: true } },
      },
    })

    // Notification for driver: offer declined
    await db.etNotification.create({
      data: {
        userId: driverId,
        title: 'Oferta declinada',
        message: `El local ha declinado tu oferta para el pedido ${order.orderNumber}. No te desanimes, hay más pedidos disponibles.`,
        type: 'info',
        orderId: order.id,
      },
    })

    // Notification for store
    await db.etNotification.create({
      data: {
        userId: order.createdBy,
        title: 'Oferta declinada',
        message: `Oferta declinada, buscando otro transportista para el pedido ${order.orderNumber}.`,
        type: 'info',
        orderId: order.id,
      },
    })

    return NextResponse.json({ order: updatedOrder })
  } catch (error) {
    console.error('Reject offer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

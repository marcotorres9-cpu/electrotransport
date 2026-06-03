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

    if (!userId || role !== 'driver') {
      return NextResponse.json({ error: 'Only drivers can accept orders' }, { status: 403 })
    }

    const body = await request.json()
    const { acceptedPrice } = body

    const order = await db.order.findUnique({ where: { id } })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ error: 'Order is not available' }, { status: 400 })
    }

    if (order.acceptedBy) {
      return NextResponse.json({ error: 'Order already accepted by another driver' }, { status: 400 })
    }

    const finalPrice = acceptedPrice !== undefined ? parseFloat(String(acceptedPrice)) : order.proposedPrice

    const updatedOrder = await db.order.update({
      where: { id },
      data: {
        status: 'accepted',
        acceptedBy: userId,
        acceptedPrice: finalPrice,
      },
      include: {
        creator: { select: { id: true, name: true } },
        driver: { select: { id: true, name: true } },
        store: { select: { id: true, storeName: true } },
      },
    })

    await db.notification.create({
      data: {
        userId: order.createdBy,
        title: 'Transportista asignado',
        message: `Tu pedido ${order.orderNumber} ha sido aceptado. Precio: $${finalPrice.toFixed(2)}`,
        type: 'order',
        orderId: order.id,
      },
    })

    await db.notification.create({
      data: {
        userId,
        title: 'Pedido aceptado',
        message: `Has aceptado el pedido ${order.orderNumber} por $${finalPrice.toFixed(2)}`,
        type: 'order',
        orderId: order.id,
      },
    })

    return NextResponse.json({ order: updatedOrder })
  } catch (error) {
    console.error('Accept order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

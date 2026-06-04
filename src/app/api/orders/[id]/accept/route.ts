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

    if (order.status !== 'pending') {
      return NextResponse.json({ error: 'Order is not available' }, { status: 400 })
    }

    if (order.acceptedBy) {
      return NextResponse.json({ error: 'Order already accepted by another driver' }, { status: 400 })
    }

    const finalPrice = acceptedPrice !== undefined ? parseFloat(String(acceptedPrice)) : order.proposedPrice
    const isCounterOffer = finalPrice !== order.proposedPrice

    // New flow: always set to offer_received so store must confirm
    const updatedOrder = await db.etOrder.update({
      where: { id },
      data: {
        status: 'offer_received',
        acceptedBy: userId,
        acceptedPrice: finalPrice,
        counterPrice: isCounterOffer ? finalPrice : null,
      },
      include: {
        creator: { select: { id: true, name: true } },
        driver: { select: { id: true, name: true } },
        store: { select: { id: true, storeName: true } },
      },
    })

    // Notification for store owner
    const driver = await db.etUser.findUnique({ where: { id: userId } })
    const driverName = driver?.name || 'Transportista'

    await db.etNotification.create({
      data: {
        userId: order.createdBy,
        title: '¡Oferta recibida!',
        message: `${driverName} ha ofrecido ${isCounterOffer ? 'una contraoferta de' : 'aceptar por'} $${finalPrice.toFixed(2)} para el pedido ${order.orderNumber}. Revisa y acepta o declina la oferta.`,
        type: 'offer',
        orderId: order.id,
      },
    })

    // Notification for driver
    await db.etNotification.create({
      data: {
        userId,
        title: 'Oferta enviada',
        message: `Oferta enviada, esperando confirmación del local para el pedido ${order.orderNumber}.`,
        type: 'offer',
        orderId: order.id,
      },
    })

    return NextResponse.json({ order: updatedOrder })
  } catch (error) {
    console.error('Accept order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

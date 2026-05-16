import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function generateOrderNumber(): string {
  const date = new Date()
  const y = date.getFullYear().toString().slice(-2)
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ET${y}${m}${d}${rand}`
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const role = request.headers.get('x-user-role')
    const status = request.nextUrl.searchParams.get('status')
    const type = request.nextUrl.searchParams.get('type') // 'available' for drivers

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (type === 'available' && role === 'driver') {
      // Drivers see pending orders they haven't accepted
      const orders = await db.order.findMany({
        where: {
          status: 'pending',
          acceptedBy: null,
        },
        include: {
          creator: { select: { id: true, name: true } },
          store: { select: { id: true, storeName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      return NextResponse.json({ orders })
    }

    if (role === 'driver') {
      const orders = await db.order.findMany({
        where: {
          acceptedBy: userId,
          ...(status && status !== 'all' ? { status } : {}),
        },
        include: {
          creator: { select: { id: true, name: true, phone: true } },
          store: { select: { id: true, storeName: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json({ orders })
    }

    // Store: see own orders
    const orders = await db.order.findMany({
      where: {
        createdBy: userId,
        ...(status && status !== 'all' ? { status } : {}),
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            driver: { select: { vehicleType: true, vehiclePlate: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Get orders error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const role = request.headers.get('x-user-role')

    if (!userId || role !== 'store') {
      return NextResponse.json({ error: 'Only stores can create orders' }, { status: 403 })
    }

    const body = await request.json()
    const {
      originAddress, originLat, originLng,
      destAddress, destLat, destLng,
      cargoType, cargoWeight, cargoQuantity,
      specialNotes, proposedPrice,
    } = body

    if (!originAddress || !destAddress || !proposedPrice) {
      return NextResponse.json({ error: 'Origin, destination and proposed price are required' }, { status: 400 })
    }

    const store = await db.store.findFirst({ where: { userId } })
    if (!store) {
      return NextResponse.json({ error: 'Store profile not found' }, { status: 404 })
    }

    const orderNumber = generateOrderNumber()

    const order = await db.order.create({
      data: {
        orderNumber,
        createdBy: userId,
        storeId: store.id,
        status: 'pending',
        originAddress,
        originLat: originLat || 0,
        originLng: originLng || 0,
        destAddress,
        destLat: destLat || 0,
        destLng: destLng || 0,
        cargoType: cargoType || null,
        cargoWeight: cargoWeight ? parseFloat(String(cargoWeight)) : null,
        cargoQuantity: cargoQuantity ? parseInt(String(cargoQuantity)) : null,
        specialNotes: specialNotes || null,
        proposedPrice: parseFloat(String(proposedPrice)),
      },
      include: {
        creator: { select: { id: true, name: true } },
      },
    })

    await db.store.update({
      where: { id: store.id },
      data: { totalOrders: { increment: 1 } },
    })

    // Create notification for the order
    await db.notification.create({
      data: {
        userId,
        title: 'Pedido creado',
        message: `Tu pedido ${orderNumber} ha sido creado exitosamente y está esperando transportistas.`,
        type: 'order',
        orderId: order.id,
      },
    })

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

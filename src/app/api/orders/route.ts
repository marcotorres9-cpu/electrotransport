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

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
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
      const orders = await db.etOrder.findMany({
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

      // Calculate distance and estimated time for each order
      const ordersWithDistance = orders.map((order) => {
        const distanceKm = calculateDistance(order.originLat, order.originLng, order.destLat, order.destLng)
        const estimatedTime = Math.round((distanceKm / 30) * 60) // ~30 km/h average
        return {
          ...order,
          distanceKm: Math.round(distanceKm * 10) / 10,
          estimatedTime,
        }
      })

      return NextResponse.json({ orders: ordersWithDistance })
    }

    if (role === 'driver') {
      const orders = await db.etOrder.findMany({
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

      const ordersWithDistance = orders.map((order) => {
        const distanceKm = calculateDistance(order.originLat, order.originLng, order.destLat, order.destLng)
        const estimatedTime = Math.round((distanceKm / 30) * 60)
        return {
          ...order,
          distanceKm: Math.round(distanceKm * 10) / 10,
          estimatedTime,
        }
      })

      return NextResponse.json({ orders: ordersWithDistance })
    }

    // Store: see own orders
    const orders = await db.etOrder.findMany({
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

    const ordersWithDistance = orders.map((order) => {
      const distanceKm = calculateDistance(order.originLat, order.originLng, order.destLat, order.destLng)
      const estimatedTime = Math.round((distanceKm / 30) * 60)
      return {
        ...order,
        distanceKm: Math.round(distanceKm * 10) / 10,
        estimatedTime,
      }
    })

    return NextResponse.json({ orders: ordersWithDistance })
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

    const store = await db.etStore.findFirst({ where: { userId } })
    if (!store) {
      return NextResponse.json({ error: 'Store profile not found' }, { status: 404 })
    }

    const orderNumber = generateOrderNumber()

    // Calculate distance
    const oLat = originLat || 0
    const oLng = originLng || 0
    const dLat = destLat || 0
    const dLng = destLng || 0
    const distanceKm = calculateDistance(oLat, oLng, dLat, dLng)
    const estimatedTime = Math.round((distanceKm / 30) * 60)

    const order = await db.etOrder.create({
      data: {
        orderNumber,
        createdBy: userId,
        storeId: store.id,
        status: 'pending',
        originAddress,
        originLat: oLat,
        originLng: oLng,
        destAddress,
        destLat: dLat,
        destLng: dLng,
        cargoType: cargoType || null,
        cargoWeight: cargoWeight ? parseFloat(String(cargoWeight)) : null,
        cargoQuantity: cargoQuantity ? parseInt(String(cargoQuantity)) : null,
        specialNotes: specialNotes || null,
        proposedPrice: parseFloat(String(proposedPrice)),
        distanceKm: Math.round(distanceKm * 10) / 10,
        estimatedTime,
      },
      include: {
        creator: { select: { id: true, name: true } },
      },
    })

    await db.etStore.update({
      where: { id: store.id },
      data: { totalOrders: { increment: 1 } },
    })

    // Create notification for the order
    await db.etNotification.create({
      data: {
        userId,
        title: 'Pedido creado',
        message: `Tu pedido ${orderNumber} ha sido creado exitosamente y está esperando transportistas.`,
        type: 'order',
        orderId: order.id,
      },
    })

    // Notify all online drivers
    const onlineDrivers = await db.etDriver.findMany({
      where: { isOnline: true },
      select: { userId: true },
    })

    for (const driver of onlineDrivers) {
      await db.etNotification.create({
        data: {
          userId: driver.userId,
          title: '¡Nuevo pedido disponible!',
          message: `Nuevo pedido de ${order.originAddress} a ${order.destAddress} por $${proposedPrice}.`,
          type: 'new_order',
          orderId: order.id,
        },
      })
    }

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

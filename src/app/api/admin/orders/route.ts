import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
    const role = request.headers.get('x-user-role')
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const status = request.nextUrl.searchParams.get('status')

    const orders = await db.etOrder.findMany({
      where: status && status !== 'all' ? { status } : {},
      include: {
        creator: { select: { id: true, name: true } },
        driver: { select: { id: true, name: true, phone: true } },
        store: { select: { id: true, storeName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const ordersWithDistance = orders.map((order) => {
      const distanceKm = calculateDistance(order.originLat, order.originLng, order.destLat, order.destLng)
      return {
        ...order,
        distanceKm: Math.round(distanceKm * 10) / 10,
      }
    })

    return NextResponse.json({ orders: ordersWithDistance })
  } catch (error) {
    console.error('Admin get orders error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

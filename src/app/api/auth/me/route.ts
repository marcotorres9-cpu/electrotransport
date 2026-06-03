import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.etUser.findUnique({
      where: { id: userId },
      include: {
        store: true,
        driver: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive,
        store: user.store
          ? {
              id: user.store.id,
              storeName: user.store.storeName,
              storeType: user.store.storeType,
              address: user.store.address,
              city: user.store.city,
              rutNumber: user.store.rutNumber,
              rating: user.store.rating,
              totalOrders: user.store.totalOrders,
            }
          : null,
        driver: user.driver
          ? {
              id: user.driver.id,
              vehicleType: user.driver.vehicleType,
              vehicleBrand: user.driver.vehicleBrand,
              vehicleModel: user.driver.vehicleModel,
              vehicleYear: user.driver.vehicleYear,
              vehiclePlate: user.driver.vehiclePlate,
              licenseNumber: user.driver.licenseNumber,
              isOnline: user.driver.isOnline,
              rating: user.driver.rating,
              totalTrips: user.driver.totalTrips,
              earnings: user.driver.earnings,
            }
          : null,
      },
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

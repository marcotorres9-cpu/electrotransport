import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'electro-salt-2024').digest('hex')
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const user = await db.etUser.findUnique({
      where: { email },
      include: {
        store: true,
        driver: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const hashedPassword = hashPassword(password)
    if (user.password !== hashedPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 })
    }

    const token = generateToken()

    await db.etUser.update({
      where: { id: user.id },
      data: { isActive: true },
    })

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive,
        token,
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
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

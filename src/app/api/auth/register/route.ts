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
    const { name, email, password, phone, role } = body

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Name, email, password and role are required' }, { status: 400 })
    }

    if (!['store', 'driver', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const existingUser = await db.etUser.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const hashedPassword = hashPassword(password)
    const token = generateToken()

    const user = await db.etUser.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role,
        isActive: true,
      },
    })

    // Admin role - just create the user, no profile needed
    if (role === 'admin') {
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
        },
      })
    }

    if (role === 'store') {
      const { storeName, storeType, address, city, rutNumber } = body
      if (!storeName) {
        await db.etUser.delete({ where: { id: user.id } })
        return NextResponse.json({ error: 'Store name is required' }, { status: 400 })
      }

      const store = await db.etStore.create({
        data: {
          userId: user.id,
          storeName,
          storeType: storeType || null,
          address: address || null,
          city: city || null,
          rutNumber: rutNumber || null,
        },
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
          store: {
            id: store.id,
            storeName: store.storeName,
            storeType: store.storeType,
            address: store.address,
            city: store.city,
            rutNumber: store.rutNumber,
            rating: store.rating,
            totalOrders: store.totalOrders,
          },
        },
      })
    }

    if (role === 'driver') {
      const { vehicleType, vehicleBrand, vehicleModel, vehicleYear, vehiclePlate, licenseNumber, driverLicense } = body
      if (!vehicleType) {
        await db.etUser.delete({ where: { id: user.id } })
        return NextResponse.json({ error: 'Vehicle type is required' }, { status: 400 })
      }

      if (!['camioneta', 'doble_cabina', 'camion'].includes(vehicleType)) {
        await db.etUser.delete({ where: { id: user.id } })
        return NextResponse.json({ error: 'Invalid vehicle type' }, { status: 400 })
      }

      const driver = await db.etDriver.create({
        data: {
          userId: user.id,
          vehicleType,
          vehicleBrand: vehicleBrand || null,
          vehicleModel: vehicleModel || null,
          vehicleYear: vehicleYear ? parseInt(String(vehicleYear)) : null,
          vehiclePlate: vehiclePlate || null,
          licenseNumber: licenseNumber || null,
          driverLicense: driverLicense || null,
        },
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
          driver: {
            id: driver.id,
            vehicleType: driver.vehicleType,
            vehicleBrand: driver.vehicleBrand,
            vehicleModel: driver.vehicleModel,
            vehicleYear: driver.vehicleYear,
            vehiclePlate: driver.vehiclePlate,
            licenseNumber: driver.licenseNumber,
            isOnline: driver.isOnline,
            rating: driver.rating,
            totalTrips: driver.totalTrips,
            earnings: driver.earnings,
          },
        },
      })
    }

    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

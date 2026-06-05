import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const role = request.headers.get('x-user-role')

    if (role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const users = await db.etUser.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        store: { select: { id: true, storeName: true, address: true, city: true, rating: true, totalOrders: true } },
        driver: { select: { id: true, vehicleType: true, vehiclePlate: true, isOnline: true, rating: true, totalTrips: true, earnings: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Get admin users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const role = request.headers.get('x-user-role')

    if (role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, isActive } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const user = await db.etUser.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updatedUser = await db.etUser.update({
      where: { id: userId },
      data: { isActive: isActive !== undefined ? isActive : !user.isActive },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        store: { select: { id: true, storeName: true } },
        driver: { select: { id: true, vehicleType: true, isOnline: true } },
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Toggle user status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const role = request.headers.get('x-user-role')
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Prevent deleting yourself
    const adminId = request.headers.get('x-user-id')
    if (userId === adminId) {
      return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta' }, { status: 400 })
    }

    const user = await db.etUser.findUnique({
      where: { id: userId },
      include: { store: true, driver: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete related records
    await db.etNotification.deleteMany({ where: { userId } })
    await db.etOrder.updateMany({ where: { createdBy: userId }, data: { createdBy: null } })
    await db.etOrder.updateMany({ where: { acceptedBy: userId }, data: { acceptedBy: null } })
    if (user.driver) {
      await db.etDriver.delete({ where: { id: user.driver.id } })
    }
    if (user.store) {
      await db.etStore.delete({ where: { id: user.store.id } })
    }
    await db.etUser.delete({ where: { id: userId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

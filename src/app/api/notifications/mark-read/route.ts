import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationIds, markAll } = body

    if (markAll) {
      await db.etNotification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true })
    }

    if (notificationIds && Array.isArray(notificationIds)) {
      await db.etNotification.updateMany({
        where: { id: { in: notificationIds }, userId },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Provide notificationIds or markAll' }, { status: 400 })
  } catch (error) {
    console.error('Mark notifications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

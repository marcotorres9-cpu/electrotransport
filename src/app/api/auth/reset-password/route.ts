import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'electro-salt-2024').digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const role = request.headers.get('x-user-role')
    const body = await request.json()
    const { email, newPassword, adminReset } = body

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Email y nueva contraseña son requeridos' }, { status: 400 })
    }

    if (newPassword.length < 4) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 4 caracteres' }, { status: 400 })
    }

    const user = await db.etUser.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    if (adminReset && role !== 'admin') {
      return NextResponse.json({ error: 'Solo admin puede forzar reset' }, { status: 403 })
    }

    if (!adminReset) {
      const { oldPassword } = body
      if (!oldPassword) {
        return NextResponse.json({ error: 'Contraseña actual requerida' }, { status: 400 })
      }
      if (user.password !== hashPassword(oldPassword)) {
        return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 401 })
      }
    }

    await db.etUser.update({
      where: { email },
      data: { password: hashPassword(newPassword) },
    })

    return NextResponse.json({ success: true, message: 'Contraseña actualizada' })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'electro-salt-2024').digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, newPassword } = body

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Email y nueva contraseña son requeridos' }, { status: 400 })
    }

    if (newPassword.length < 4) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 4 caracteres' }, { status: 400 })
    }

    const user = await db.etUser.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ error: 'No se encontró una cuenta con ese email' }, { status: 404 })
    }

    await db.etUser.update({
      where: { id: user.id },
      data: { password: hashPassword(newPassword) },
    })

    return NextResponse.json({ success: true, message: 'Contraseña actualizada correctamente' })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

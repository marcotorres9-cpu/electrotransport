'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { motion } from 'framer-motion'
import { Truck, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'

export default function LoginPage() {
  const { setCurrentView, setCurrentUser, setLoading } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Por favor ingresa email y contraseña')
      return
    }
    setIsSubmitting(true)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Error al iniciar sesión')
        return
      }

      setCurrentUser(data.user)

      if (data.user.role === 'store') {
        setCurrentView('store-dashboard')
      } else {
        setCurrentView('driver-dashboard')
      }
      toast.success(`¡Bienvenido, ${data.user.name}!`)
    } catch {
      toast.error('Error de conexión. Intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 to-emerald-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4"
          >
            <Truck className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-slate-800">ElectroTransport</h1>
          <p className="text-muted-foreground text-sm mt-1">Inicia sesión en tu cuenta</p>
        </div>

        <Card className="border-none shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Iniciar Sesión</CardTitle>
            <CardDescription>Ingresa tus credenciales para acceder</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full gradient-primary text-white font-semibold py-5"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                ¿No tienes cuenta?{' '}
                <button
                  onClick={() => setCurrentView('register')}
                  className="text-emerald-600 font-semibold hover:underline"
                >
                  Regístrate aquí
                </button>
              </p>
            </div>

            <div className="mt-3 text-center">
              <button
                onClick={() => setCurrentView('landing')}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ← Volver al inicio
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

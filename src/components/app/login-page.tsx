'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { motion, AnimatePresence } from 'framer-motion'
import { Truck, Mail, Lock, Eye, EyeOff, Shield, Store, ChevronLeft } from 'lucide-react'
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
  const [roleSelection, setRoleSelection] = useState<{ show: boolean; user: any }>({ show: false, user: null })

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

      // If user is admin, show role selection
      if (data.user.role === 'admin') {
        setRoleSelection({ show: true, user: data.user })
        return
      }

      // Direct navigation for non-admin roles
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

  function handleRoleSelect(selectedRole: 'admin' | 'store') {
    if (!roleSelection.user) return

    const user = { ...roleSelection.user }

    if (selectedRole === 'store') {
      // Enter as Local/Store
      user.role = 'store'
      setCurrentUser(user)
      setCurrentView('store-dashboard')
      toast.success(`¡Bienvenido, ${user.name}! (Modo Local)`)
    } else {
      // Enter as Admin
      setCurrentUser(user)
      setCurrentView('admin-dashboard')
      toast.success(`¡Bienvenido, ${user.name}! (Modo Admin)`)
    }

    setRoleSelection({ show: false, user: null })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#F5F5F5]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <AnimatePresence mode="wait">
          {!roleSelection.show ? (
            <motion.div
              key="login-form"
              initial={{ opacity: 0, x: 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#F9FAFB] border border-gray-200 mb-4 glow-primary"
                >
                  <Truck className="h-7 w-7 text-[#1DB954]" />
                </motion.div>
                <h1 className="text-2xl font-bold text-gray-900">ElectroTransport</h1>
                <p className="text-gray-500 text-sm mt-1">Inicia sesión en tu cuenta</p>
              </div>

              <Card className="bg-white border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-gray-900">Iniciar Sesión</CardTitle>
                  <CardDescription className="text-gray-500 text-xs">Ingresa tus credenciales</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-3.5">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-gray-500 text-xs">Correo electrónico</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="tu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 bg-[#F9FAFB] border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#1DB954]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-gray-500 text-xs">Contraseña</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10 bg-[#F9FAFB] border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#1DB954]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-[#1DB954] hover:bg-[#17a34a] text-black font-semibold py-5 rounded-xl transition-all shadow-[0_0_20px_rgba(29,185,84,0.15)]"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Ingresando...' : 'Ingresar'}
                    </Button>
                  </form>

                  <div className="mt-5 text-center">
                    <p className="text-xs text-gray-500">
                      ¿No tienes cuenta?{' '}
                      <button
                        onClick={() => setCurrentView('register')}
                        className="text-[#1DB954] font-semibold hover:underline"
                      >
                        Regístrate aquí
                      </button>
                    </p>
                  </div>

                  <div className="mt-2 text-center">
                    <button
                      onClick={() => setCurrentView('landing')}
                      className="text-xs text-gray-400 hover:text-gray-500 transition-colors"
                    >
                      ← Volver al inicio
                    </button>
                  </div>

                  <p className="text-center text-[10px] text-gray-400 mt-3">v2.6.0</p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="role-selection"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#845EF7]/10 border border-[#845EF7]/20 mb-4"
                >
                  <Shield className="h-7 w-7 text-[#845EF7]" />
                </motion.div>
                <h1 className="text-2xl font-bold text-gray-900">¿Cómo deseas ingresar?</h1>
                <p className="text-gray-500 text-sm mt-1">Tu cuenta tiene acceso a múltiples roles</p>
              </div>

              <div className="space-y-3">
                {/* Admin option */}
                <button
                  onClick={() => handleRoleSelect('admin')}
                  className="w-full bg-white border-2 border-gray-200 hover:border-[#845EF7] rounded-2xl p-5 text-left transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#845EF7]/10 flex items-center justify-center group-hover:bg-[#845EF7]/20 transition-colors">
                      <Shield className="h-6 w-6 text-[#845EF7]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-base">Administrador</p>
                      <p className="text-xs text-gray-500 mt-0.5">Gestionar usuarios, ver pedidos y controlar la plataforma</p>
                    </div>
                    <ChevronLeft className="h-5 w-5 text-gray-300 group-hover:text-[#845EF7] transition-colors rotate-180" />
                  </div>
                </button>

                {/* Local option */}
                <button
                  onClick={() => handleRoleSelect('store')}
                  className="w-full bg-white border-2 border-gray-200 hover:border-[#1DB954] rounded-2xl p-5 text-left transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#1DB954]/10 flex items-center justify-center group-hover:bg-[#1DB954]/20 transition-colors">
                      <Store className="h-6 w-6 text-[#1DB954]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-base">Local Comercial</p>
                      <p className="text-xs text-gray-500 mt-0.5">Crear pedidos de transporte y gestionar envíos</p>
                    </div>
                    <ChevronLeft className="h-5 w-5 text-gray-300 group-hover:text-[#1DB954] transition-colors rotate-180" />
                  </div>
                </button>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setRoleSelection({ show: false, user: null })}
                  className="text-xs text-gray-400 hover:text-gray-500 transition-colors"
                >
                  ← Volver
                </button>
              </div>

              <p className="text-center text-[10px] text-gray-400 mt-3">v2.6.0</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

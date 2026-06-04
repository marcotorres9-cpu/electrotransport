'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Truck, Store, UserPlus, Mail, Lock, Phone, Eye, EyeOff,
  Building2, MapPin, Hash, Car, FileText, BadgeCheck, ChevronLeft,
  Shield, LockKeyhole
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

const vehicleTypes = [
  { value: 'camioneta', label: 'Camioneta', icon: '🚐' },
  { value: 'doble_cabina', label: 'Doble Cabina', icon: '🛻' },
  { value: 'camion', label: 'Camión', icon: '🚛' },
]

export default function RegisterPage() {
  const { setCurrentView, setCurrentUser, setLoading } = useAppStore()
  const [role, setRole] = useState<'store' | 'driver' | 'admin'>('store')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)

  // Common fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')

  // Store fields
  const [storeName, setStoreName] = useState('')
  const [storeType, setStoreType] = useState('')
  const [address, setAddress] = useState('')
  const [rutNumber, setRutNumber] = useState('')

  // Driver fields
  const [vehicleType, setVehicleType] = useState('')
  const [vehicleBrand, setVehicleBrand] = useState('')
  const [vehicleModel, setVehicleModel] = useState('')
  const [vehicleYear, setVehicleYear] = useState('')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!agreeTerms) {
      toast.error('Debes aceptar los términos y condiciones')
      return
    }
    if (!name || !email || !password) {
      toast.error('Nombre, email y contraseña son obligatorios')
      return
    }
    if (role === 'store' && !storeName) {
      toast.error('El nombre del local es obligatorio')
      return
    }
    if (role === 'driver' && !vehicleType) {
      toast.error('Selecciona el tipo de vehículo')
      return
    }

    setIsSubmitting(true)
    setLoading(true)

    try {
      const body: Record<string, unknown> = { name, email, password, phone, role }

      if (role === 'store') {
        body.storeName = storeName
        body.storeType = storeType
        body.address = address
        body.rutNumber = rutNumber
      } else {
        body.vehicleType = vehicleType
        body.vehicleBrand = vehicleBrand
        body.vehicleModel = vehicleModel
        body.vehicleYear = vehicleYear ? parseInt(vehicleYear) : null
        body.vehiclePlate = vehiclePlate
        body.licenseNumber = licenseNumber
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Error al registrarse')
        return
      }

      setCurrentUser(data.user)
      if (data.user.role === 'admin') {
        setCurrentView('admin-dashboard')
      } else if (data.user.role === 'store') {
        setCurrentView('store-dashboard')
      } else {
        setCurrentView('driver-dashboard')
      }
      toast.success('¡Registro exitoso! Bienvenido a ElectroTransport')
    } catch {
      toast.error('Error de conexión. Intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Back button */}
        <button
          onClick={() => setCurrentView('landing')}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Volver al inicio
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4"
          >
            <Truck className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-slate-800">Crear Cuenta</h1>
          <p className="text-muted-foreground text-sm mt-1">Únete a ElectroTransport</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-none shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Tipo de Cuenta</CardTitle>
              <CardDescription>Selecciona tu rol en la plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Role Toggle */}
              <RadioGroup
                value={role}
                onValueChange={(v) => setRole(v as 'store' | 'driver' | 'admin')}
                className="grid grid-cols-3 gap-3 mb-6"
              >
                <label className={`cursor-pointer`}>
                  <div
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      role === 'store'
                        ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                        : 'border-muted hover:border-emerald-200'
                    }`}
                  >
                    <RadioGroupItem value="store" className="sr-only" />
                    <Store className={`h-7 w-7 ${role === 'store' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                    <div className="text-center">
                      <p className={`font-semibold text-sm ${role === 'store' ? 'text-emerald-800' : ''}`}>
                        Local
                      </p>
                      <p className="text-xs text-muted-foreground">Electrodomésticos</p>
                    </div>
                  </div>
                </label>
                <label className={`cursor-pointer`}>
                  <div
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      role === 'driver'
                        ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                        : 'border-muted hover:border-emerald-200'
                    }`}
                  >
                    <RadioGroupItem value="driver" className="sr-only" />
                    <Car className={`h-7 w-7 ${role === 'driver' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                    <div className="text-center">
                      <p className={`font-semibold text-sm ${role === 'driver' ? 'text-emerald-800' : ''}`}>
                        Transporte
                      </p>
                      <p className="text-xs text-muted-foreground">Servicio de carga</p>
                    </div>
                  </div>
                </label>
                <label className={`cursor-pointer`}>
                  <div
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      role === 'admin'
                        ? 'border-purple-500 bg-purple-50 shadow-sm'
                        : 'border-muted hover:border-purple-200'
                    }`}
                  >
                    <RadioGroupItem value="admin" className="sr-only" />
                    <Shield className={`h-7 w-7 ${role === 'admin' ? 'text-purple-600' : 'text-muted-foreground'}`} />
                    <div className="text-center">
                      <p className={`font-semibold text-sm ${role === 'admin' ? 'text-purple-800' : ''}`}>
                        Admin
                      </p>
                      <p className="text-xs text-muted-foreground">Gestión total</p>
                    </div>
                  </div>
                </label>
              </RadioGroup>

              <form onSubmit={handleRegister} className="space-y-4">
                {/* Common Fields */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="name" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} className="pl-10" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="phone" placeholder="+591 70000000" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {role === 'admin' ? (
                    <motion.div
                      key="admin-fields"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 pb-1">
                        <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Shield className="h-4 w-4 text-purple-600" />
                          Acceso de Administrador
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                        <p className="text-sm text-purple-800">
                          Como administrador tendrás control total sobre la plataforma: gestión de usuarios, activación/desactivación de cuentas, y monitoreo de pedidos.
                        </p>
                      </div>
                    </motion.div>
                  ) : role === 'store' ? (
                    <motion.div
                      key="store-fields"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="pt-2 pb-1">
                        <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-emerald-600" />
                          Datos del Local
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="storeName">Nombre del local</Label>
                        <div className="relative">
                          <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="storeName" placeholder="ElectroHogar SRL" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="pl-10" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="storeType">Tipo de electrodomésticos</Label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="storeType" placeholder="Línea blanca, electrónica..." value={storeType} onChange={(e) => setStoreType(e.target.value)} className="pl-10" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">Dirección</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Textarea id="address" placeholder="Dirección del local comercial" value={address} onChange={(e) => setAddress(e.target.value)} className="pl-10" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="rut">NIT / RUC</Label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="rut" placeholder="123456789" value={rutNumber} onChange={(e) => setRutNumber(e.target.value)} className="pl-10" />
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="driver-fields"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="pt-2 pb-1">
                        <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Car className="h-4 w-4 text-emerald-600" />
                          Datos del Vehículo
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Tipo de vehículo</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {vehicleTypes.map((vt) => (
                            <button
                              key={vt.value}
                              type="button"
                              onClick={() => setVehicleType(vt.value)}
                              className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-sm ${
                                vehicleType === vt.value
                                  ? 'border-emerald-500 bg-emerald-50'
                                  : 'border-muted hover:border-emerald-200'
                              }`}
                            >
                              <span className="text-xl">{vt.icon}</span>
                              <span className={vehicleType === vt.value ? 'text-emerald-700 font-medium' : 'text-muted-foreground'}>
                                {vt.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="brand">Marca</Label>
                          <Input id="brand" placeholder="Toyota" value={vehicleBrand} onChange={(e) => setVehicleBrand(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="model">Modelo</Label>
                          <Input id="model" placeholder="Hilux" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="year">Año</Label>
                          <Input id="year" placeholder="2022" value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="plate">Placa</Label>
                          <div className="relative">
                            <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="plate" placeholder="ABC-123" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} className="pl-10" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="license">Licencia de conducir</Label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="license" placeholder="Número de licencia" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} className="pl-10" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Terms */}
                <div className="flex items-start gap-2 pt-2">
                  <Checkbox
                    id="terms"
                    checked={agreeTerms}
                    onCheckedChange={(v) => setAgreeTerms(v === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                    Acepto los{' '}
                    <span className="text-emerald-600 font-medium">Términos de Servicio</span> y la{' '}
                    <span className="text-emerald-600 font-medium">Política de Privacidad</span> de ElectroTransport.
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-primary text-white font-semibold py-5 mt-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Registrando...' : 'Crear Cuenta'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  ¿Ya tienes cuenta?{' '}
                  <button
                    onClick={() => setCurrentView('login')}
                    className="text-emerald-600 font-semibold hover:underline"
                  >
                    Inicia sesión
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

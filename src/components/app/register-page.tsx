'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Truck, Store, UserPlus, Mail, Lock, Phone, Eye, EyeOff,
  Building2, MapPin, Hash, Car, FileText, BadgeCheck, ChevronLeft,
  Shield
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

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')

  const [storeName, setStoreName] = useState('')
  const [storeType, setStoreType] = useState('')
  const [address, setAddress] = useState('')
  const [rutNumber, setRutNumber] = useState('')

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
      } else if (role === 'driver') {
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
    <div className="min-h-screen bg-[#181818] py-6 px-4">
      <div className="max-w-md mx-auto">
        {/* Back button */}
        <button
          onClick={() => setCurrentView('landing')}
          className="inline-flex items-center text-sm text-[#aaaaaa] hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Volver
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#262626] border border-[#333333] mb-4"
          >
            <Truck className="h-7 w-7 text-[#1DB954]" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">Crear Cuenta</h1>
          <p className="text-[#888888] text-sm mt-1">Únete a ElectroTransport</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-[#1e1e1e] border-[#333333]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-white">Tipo de Cuenta</CardTitle>
              <CardDescription className="text-[#888888] text-xs">Selecciona tu rol</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Role Toggle - 3 columns with proper spacing */}
              <RadioGroup
                value={role}
                onValueChange={(v) => setRole(v as 'store' | 'driver' | 'admin')}
                className="grid grid-cols-3 gap-2.5 mb-6"
              >
                <label className="cursor-pointer">
                  <div
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                      role === 'store'
                        ? 'border-[#1DB954] bg-[#1DB954]/10'
                        : 'border-[#333333] hover:border-[#444444]'
                    }`}
                  >
                    <RadioGroupItem value="store" className="sr-only" />
                    <Store className={`h-5 w-5 ${role === 'store' ? 'text-[#1DB954]' : 'text-[#888888]'}`} />
                    <p className={`font-medium text-xs ${role === 'store' ? 'text-[#1DB954]' : 'text-[#999]'} text-center leading-tight`}>
                      Local
                    </p>
                  </div>
                </label>
                <label className="cursor-pointer">
                  <div
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                      role === 'driver'
                        ? 'border-[#1DB954] bg-[#1DB954]/10'
                        : 'border-[#333333] hover:border-[#444444]'
                    }`}
                  >
                    <RadioGroupItem value="driver" className="sr-only" />
                    <Car className={`h-5 w-5 ${role === 'driver' ? 'text-[#1DB954]' : 'text-[#888888]'}`} />
                    <p className={`font-medium text-xs ${role === 'driver' ? 'text-[#1DB954]' : 'text-[#999]'} text-center leading-tight`}>
                      Transporte
                    </p>
                  </div>
                </label>
                <label className="cursor-pointer">
                  <div
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                      role === 'admin'
                        ? 'border-[#845EF7] bg-[#845EF7]/10'
                        : 'border-[#333333] hover:border-[#444444]'
                    }`}
                  >
                    <RadioGroupItem value="admin" className="sr-only" />
                    <Shield className={`h-5 w-5 ${role === 'admin' ? 'text-[#845EF7]' : 'text-[#888888]'}`} />
                    <p className={`font-medium text-xs ${role === 'admin' ? 'text-[#845EF7]' : 'text-[#999]'} text-center leading-tight`}>
                      Admin
                    </p>
                  </div>
                </label>
              </RadioGroup>

              <form onSubmit={handleRegister} className="space-y-3.5">
                {/* Common Fields */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-[#999] text-xs">Nombre completo</Label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#777777]" />
                    <Input id="name" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} className="pl-10 bg-[#262626] border-[#2e2e2e] text-white placeholder:text-[#666666] focus:border-[#1DB954]" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[#999] text-xs">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#777777]" />
                    <Input id="email" type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-[#262626] border-[#2e2e2e] text-white placeholder:text-[#666666] focus:border-[#1DB954]" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-[#999] text-xs">Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#777777]" />
                    <Input id="phone" placeholder="+593 990000000" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10 bg-[#262626] border-[#2e2e2e] text-white placeholder:text-[#666666] focus:border-[#1DB954]" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-[#999] text-xs">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#777777]" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-[#262626] border-[#2e2e2e] text-white placeholder:text-[#666666] focus:border-[#1DB954]"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777777] hover:text-white transition-colors">
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
                      <div className="bg-[#845EF7]/10 rounded-xl p-4 border border-[#845EF7]/20 mt-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-[#845EF7]" />
                          <p className="text-sm font-semibold text-[#845EF7]">Acceso Administrador</p>
                        </div>
                        <p className="text-xs text-[#999] leading-relaxed">
                          Control total: gestión de usuarios, activación de cuentas y monitoreo de pedidos.
                        </p>
                      </div>
                    </motion.div>
                  ) : role === 'store' ? (
                    <motion.div
                      key="store-fields"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3.5 overflow-hidden"
                    >
                      <div className="pt-1">
                        <p className="text-xs font-semibold text-[#999] flex items-center gap-1.5 mb-3">
                          <Building2 className="h-3.5 w-3.5 text-[#1DB954]" />
                          Datos del Local
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="storeName" className="text-[#999] text-xs">Nombre del local</Label>
                        <div className="relative">
                          <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#777777]" />
                          <Input id="storeName" placeholder="ElectroHogar" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="pl-10 bg-[#262626] border-[#2e2e2e] text-white placeholder:text-[#666666] focus:border-[#1DB954]" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="storeType" className="text-[#999] text-xs">Tipo de electrodomésticos</Label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#777777]" />
                          <Input id="storeType" placeholder="Línea blanca, electrónica..." value={storeType} onChange={(e) => setStoreType(e.target.value)} className="pl-10 bg-[#262626] border-[#2e2e2e] text-white placeholder:text-[#666666] focus:border-[#1DB954]" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="address" className="text-[#999] text-xs">Dirección</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-[#777777]" />
                          <Textarea id="address" placeholder="Dirección del local" value={address} onChange={(e) => setAddress(e.target.value)} className="pl-10 bg-[#262626] border-[#2e2e2e] text-white placeholder:text-[#666666] focus:border-[#1DB954] min-h-[70px]" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="rut" className="text-[#999] text-xs">RUC</Label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#777777]" />
                          <Input id="rut" placeholder="1234567890001" value={rutNumber} onChange={(e) => setRutNumber(e.target.value)} className="pl-10 bg-[#262626] border-[#2e2e2e] text-white placeholder:text-[#666666] focus:border-[#1DB954]" />
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="driver-fields"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3.5 overflow-hidden"
                    >
                      <div className="pt-1">
                        <p className="text-xs font-semibold text-[#999] flex items-center gap-1.5 mb-3">
                          <Car className="h-3.5 w-3.5 text-[#1DB954]" />
                          Datos del Vehículo
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[#999] text-xs">Tipo de vehículo</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {vehicleTypes.map((vt) => (
                            <button
                              key={vt.value}
                              type="button"
                              onClick={() => setVehicleType(vt.value)}
                              className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 transition-all text-xs ${
                                vehicleType === vt.value
                                  ? 'border-[#1DB954] bg-[#1DB954]/10'
                                  : 'border-[#333333] hover:border-[#444444]'
                              }`}
                            >
                              <span className="text-lg">{vt.icon}</span>
                              <span className={vehicleType === vt.value ? 'text-[#1DB954] font-medium' : 'text-[#777]'}>
                                {vt.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1.5">
                          <Label htmlFor="brand" className="text-[#999] text-xs">Marca</Label>
                          <Input id="brand" placeholder="Toyota" value={vehicleBrand} onChange={(e) => setVehicleBrand(e.target.value)} className="bg-[#262626] border-[#2e2e2e] text-white placeholder:text-[#666666] focus:border-[#1DB954]" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="model" className="text-[#999] text-xs">Modelo</Label>
                          <Input id="model" placeholder="Hilux" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} className="bg-[#262626] border-[#2e2e2e] text-white placeholder:text-[#666666] focus:border-[#1DB954]" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1.5">
                          <Label htmlFor="year" className="text-[#999] text-xs">Año</Label>
                          <Input id="year" placeholder="2024" value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} className="bg-[#262626] border-[#2e2e2e] text-white placeholder:text-[#666666] focus:border-[#1DB954]" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="plate" className="text-[#999] text-xs">Placa</Label>
                          <div className="relative">
                            <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#777777]" />
                            <Input id="plate" placeholder="ABC-123" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} className="pl-10 bg-[#262626] border-[#2e2e2e] text-white placeholder:text-[#666666] focus:border-[#1DB954]" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="license" className="text-[#999] text-xs">Licencia</Label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#777777]" />
                          <Input id="license" placeholder="Número de licencia" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} className="pl-10 bg-[#262626] border-[#2e2e2e] text-white placeholder:text-[#666666] focus:border-[#1DB954]" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Terms */}
                <div className="flex items-start gap-2 pt-1">
                  <Checkbox
                    id="terms"
                    checked={agreeTerms}
                    onCheckedChange={(v) => setAgreeTerms(v === true)}
                    className="mt-0.5 border-[#333] data-[state=checked]:bg-[#1DB954] data-[state=checked]:border-[#1DB954]"
                  />
                  <label htmlFor="terms" className="text-xs text-[#888888] leading-relaxed cursor-pointer">
                    Acepto los{' '}
                    <span className="text-[#1DB954]">Términos de Servicio</span> y la{' '}
                    <span className="text-[#1DB954]">Política de Privacidad</span>
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#1DB954] hover:bg-[#17a34a] text-black font-semibold py-5 rounded-xl mt-2 transition-all shadow-[0_0_20px_rgba(29,185,84,0.15)]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Registrando...' : 'Crear Cuenta'}
                </Button>
              </form>

              <div className="mt-5 text-center">
                <p className="text-xs text-[#888888]">
                  ¿Ya tienes cuenta?{' '}
                  <button
                    onClick={() => setCurrentView('login')}
                    className="text-[#1DB954] font-semibold hover:underline"
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

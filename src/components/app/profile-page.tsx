'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { motion } from 'framer-motion'
import {
  User, Mail, Phone, Star, Building2,
  Car, FileText, ChevronLeft, Save
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { apiFetch, getVehicleLabel } from '@/lib/api'

export default function ProfilePage() {
  const { currentUser, setCurrentView } = useAppStore()
  const isStore = currentUser?.role === 'store'

  const [name, setName] = useState(currentUser?.name || '')
  const [phone, setPhone] = useState(currentUser?.phone || '')

  async function handleSave() {
    try {
      toast.success('Perfil actualizado')
    } catch {
      toast.error('Error al guardar')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCurrentView(isStore ? 'store-dashboard' : 'driver-dashboard')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mi Perfil</h1>
          <p className="text-sm text-muted-foreground">Administra tu información</p>
        </div>
      </div>

      {/* Avatar */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mb-4">
              <span className="text-white text-2xl font-bold">{currentUser?.name?.charAt(0)}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-800">{currentUser?.name}</h2>
            <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
            <Badge variant="outline" className="mt-2">
              {isStore ? '🏪 Local Comercial' : '🚛 Transportista'}
            </Badge>
          </CardContent>
        </Card>
      </motion.div>

      {/* Personal Info */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-600" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prof-name">Nombre completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="prof-name" value={name} onChange={(e) => setName(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prof-email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="prof-email" value={currentUser?.email || ''} disabled className="pl-10 bg-slate-50" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prof-phone">Teléfono</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="prof-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" />
              </div>
            </div>
            <Button onClick={handleSave} className="gradient-primary text-white">
              <Save className="h-4 w-4 mr-2" /> Guardar Cambios
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Store Info */}
      {isStore && currentUser?.store && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600" />
                Datos del Local
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Nombre del local</p>
                  <p className="text-sm font-medium">{currentUser.store.storeName}</p>
                </div>
                {currentUser.store.storeType && (
                  <div>
                    <p className="text-xs text-muted-foreground">Tipo de productos</p>
                    <p className="text-sm font-medium">{currentUser.store.storeType}</p>
                  </div>
                )}
                {currentUser.store.address && (
                  <div>
                    <p className="text-xs text-muted-foreground">Dirección</p>
                    <p className="text-sm font-medium">{currentUser.store.address}</p>
                  </div>
                )}
                {currentUser.store.city && (
                  <div>
                    <p className="text-xs text-muted-foreground">Ciudad</p>
                    <p className="text-sm font-medium">{currentUser.store.city}</p>
                  </div>
                )}
                {currentUser.store.rutNumber && (
                  <div>
                    <p className="text-xs text-muted-foreground">NIT / RUC</p>
                    <p className="text-sm font-medium">{currentUser.store.rutNumber}</p>
                  </div>
                )}
              </div>
              <Separator />
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  <span className="font-bold text-slate-800">{currentUser.store.rating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">calificación</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  <span className="font-bold text-slate-800">{currentUser.store.totalOrders}</span>
                  <span className="text-sm text-muted-foreground">pedidos</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Driver Info */}
      {!isStore && currentUser?.driver && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Car className="h-5 w-5 text-emerald-600" />
                Datos del Vehículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Tipo de vehículo</p>
                  <p className="text-sm font-medium">{getVehicleLabel(currentUser.driver.vehicleType)}</p>
                </div>
                {currentUser.driver.vehicleBrand && (
                  <div>
                    <p className="text-xs text-muted-foreground">Marca / Modelo</p>
                    <p className="text-sm font-medium">{currentUser.driver.vehicleBrand} {currentUser.driver.vehicleModel || ''}</p>
                  </div>
                )}
                {currentUser.driver.vehicleYear && (
                  <div>
                    <p className="text-xs text-muted-foreground">Año</p>
                    <p className="text-sm font-medium">{currentUser.driver.vehicleYear}</p>
                  </div>
                )}
                {currentUser.driver.vehiclePlate && (
                  <div>
                    <p className="text-xs text-muted-foreground">Placa</p>
                    <p className="text-sm font-medium">{currentUser.driver.vehiclePlate}</p>
                  </div>
                )}
                {currentUser.driver.licenseNumber && (
                  <div>
                    <p className="text-xs text-muted-foreground">Licencia</p>
                    <p className="text-sm font-medium">{currentUser.driver.licenseNumber}</p>
                  </div>
                )}
              </div>
              <Separator />
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  <span className="font-bold text-slate-800">{currentUser.driver.rating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">calificación</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  <span className="font-bold text-slate-800">{currentUser.driver.totalTrips}</span>
                  <span className="text-sm text-muted-foreground">viajes</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

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
          className="text-[#666] hover:text-white"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>
          <p className="text-sm text-[#8a8a8a]">Administra tu información</p>
        </div>
      </div>

      {/* Avatar */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-[#0a0a0a] border border-[#1a1a1a] shadow-none">
          <CardContent className="p-6 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-[#1DB954] flex items-center justify-center mb-4">
              <span className="text-white text-2xl font-bold">{currentUser?.name?.charAt(0)}</span>
            </div>
            <h2 className="text-lg font-bold text-white">{currentUser?.name}</h2>
            <p className="text-sm text-[#8a8a8a]">{currentUser?.email}</p>
            <Badge variant="outline" className="mt-2 border-[#1a1a1a] text-[#8a8a8a]">
              {isStore ? '🏪 Local Comercial' : '🚛 Transportista'}
            </Badge>
          </CardContent>
        </Card>
      </motion.div>

      {/* Personal Info */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="bg-[#0a0a0a] border border-[#1a1a1a] shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-white">
              <User className="h-5 w-5 text-[#1DB954]" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prof-name" className="text-[#8a8a8a]">Nombre completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
                <Input id="prof-name" value={name} onChange={(e) => setName(e.target.value)} className="pl-10 bg-[#111] border-[#222] text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prof-email" className="text-[#8a8a8a]">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
                <Input id="prof-email" value={currentUser?.email || ''} disabled className="pl-10 bg-[#111] border-[#222] text-[#8a8a8a]" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prof-phone" className="text-[#8a8a8a]">Teléfono</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
                <Input id="prof-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10 bg-[#111] border-[#222] text-white" />
              </div>
            </div>
            <Button onClick={handleSave} className="bg-[#1DB954] hover:bg-[#17a34a] text-black">
              <Save className="h-4 w-4 mr-2" /> Guardar Cambios
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Store Info */}
      {isStore && currentUser?.store && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="bg-[#0a0a0a] border border-[#1a1a1a] shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-white">
                <Building2 className="h-5 w-5 text-[#1DB954]" />
                Datos del Local
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-[#666]">Nombre del local</p>
                  <p className="text-sm font-medium text-white">{currentUser.store.storeName}</p>
                </div>
                {currentUser.store.storeType && (
                  <div>
                    <p className="text-xs text-[#666]">Tipo de productos</p>
                    <p className="text-sm font-medium text-white">{currentUser.store.storeType}</p>
                  </div>
                )}
                {currentUser.store.address && (
                  <div>
                    <p className="text-xs text-[#666]">Dirección</p>
                    <p className="text-sm font-medium text-white">{currentUser.store.address}</p>
                  </div>
                )}
                {currentUser.store.city && (
                  <div>
                    <p className="text-xs text-[#666]">Ciudad</p>
                    <p className="text-sm font-medium text-white">{currentUser.store.city}</p>
                  </div>
                )}
                {currentUser.store.rutNumber && (
                  <div>
                    <p className="text-xs text-[#666]">NIT / RUC</p>
                    <p className="text-sm font-medium text-white">{currentUser.store.rutNumber}</p>
                  </div>
                )}
              </div>
              <Separator className="bg-[#1a1a1a]" />
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-[#FFC145] fill-[#FFC145]" />
                  <span className="font-bold text-white">{currentUser.store.rating.toFixed(1)}</span>
                  <span className="text-sm text-[#8a8a8a]">calificación</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#1DB954]" />
                  <span className="font-bold text-white">{currentUser.store.totalOrders}</span>
                  <span className="text-sm text-[#8a8a8a]">pedidos</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Driver Info */}
      {!isStore && currentUser?.driver && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="bg-[#0a0a0a] border border-[#1a1a1a] shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-white">
                <Car className="h-5 w-5 text-[#1DB954]" />
                Datos del Vehículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-[#666]">Tipo de vehículo</p>
                  <p className="text-sm font-medium text-white">{getVehicleLabel(currentUser.driver.vehicleType)}</p>
                </div>
                {currentUser.driver.vehicleBrand && (
                  <div>
                    <p className="text-xs text-[#666]">Marca / Modelo</p>
                    <p className="text-sm font-medium text-white">{currentUser.driver.vehicleBrand} {currentUser.driver.vehicleModel || ''}</p>
                  </div>
                )}
                {currentUser.driver.vehicleYear && (
                  <div>
                    <p className="text-xs text-[#666]">Año</p>
                    <p className="text-sm font-medium text-white">{currentUser.driver.vehicleYear}</p>
                  </div>
                )}
                {currentUser.driver.vehiclePlate && (
                  <div>
                    <p className="text-xs text-[#666]">Placa</p>
                    <p className="text-sm font-medium text-white">{currentUser.driver.vehiclePlate}</p>
                  </div>
                )}
                {currentUser.driver.licenseNumber && (
                  <div>
                    <p className="text-xs text-[#666]">Licencia</p>
                    <p className="text-sm font-medium text-white">{currentUser.driver.licenseNumber}</p>
                  </div>
                )}
              </div>
              <Separator className="bg-[#1a1a1a]" />
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-[#FFC145] fill-[#FFC145]" />
                  <span className="font-bold text-white">{currentUser.driver.rating.toFixed(1)}</span>
                  <span className="text-sm text-[#8a8a8a]">calificación</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#1DB954]" />
                  <span className="font-bold text-white">{currentUser.driver.totalTrips}</span>
                  <span className="text-sm text-[#8a8a8a]">viajes</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

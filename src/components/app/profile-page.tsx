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
          className="text-gray-500 hover:text-gray-900"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-sm text-gray-500">Administra tu información</p>
        </div>
      </div>

      {/* Avatar */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-white border border-gray-200 shadow-none">
          <CardContent className="p-6 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-[#1DB954] flex items-center justify-center mb-4">
              <span className="text-white text-2xl font-bold">{currentUser?.name?.charAt(0)}</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900">{currentUser?.name}</h2>
            <p className="text-sm text-gray-500">{currentUser?.email}</p>
            <Badge variant="outline" className="mt-2 border-gray-200 text-gray-500">
              {isStore ? '🏪 Local Comercial' : '🚛 Transportista'}
            </Badge>
          </CardContent>
        </Card>
      </motion.div>

      {/* Personal Info */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="bg-white border border-gray-200 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-900">
              <User className="h-5 w-5 text-[#1DB954]" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prof-name" className="text-gray-500">Nombre completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input id="prof-name" value={name} onChange={(e) => setName(e.target.value)} className="pl-10 bg-[#F9FAFB] border-gray-200 text-gray-900" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prof-email" className="text-gray-500">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input id="prof-email" value={currentUser?.email || ''} disabled className="pl-10 bg-[#F9FAFB] border-gray-200 text-gray-500" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prof-phone" className="text-gray-500">Teléfono</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input id="prof-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10 bg-[#F9FAFB] border-gray-200 text-gray-900" />
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
          <Card className="bg-white border border-gray-200 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-900">
                <Building2 className="h-5 w-5 text-[#1DB954]" />
                Datos del Local
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Nombre del local</p>
                  <p className="text-sm font-medium text-gray-900">{currentUser.store.storeName}</p>
                </div>
                {currentUser.store.storeType && (
                  <div>
                    <p className="text-xs text-gray-500">Tipo de productos</p>
                    <p className="text-sm font-medium text-gray-900">{currentUser.store.storeType}</p>
                  </div>
                )}
                {currentUser.store.address && (
                  <div>
                    <p className="text-xs text-gray-500">Dirección</p>
                    <p className="text-sm font-medium text-gray-900">{currentUser.store.address}</p>
                  </div>
                )}
                {currentUser.store.city && (
                  <div>
                    <p className="text-xs text-gray-500">Ciudad</p>
                    <p className="text-sm font-medium text-gray-900">{currentUser.store.city}</p>
                  </div>
                )}
                {currentUser.store.rutNumber && (
                  <div>
                    <p className="text-xs text-gray-500">NIT / RUC</p>
                    <p className="text-sm font-medium text-gray-900">{currentUser.store.rutNumber}</p>
                  </div>
                )}
              </div>
              <Separator className="bg-gray-200" />
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-[#FFC145] fill-[#FFC145]" />
                  <span className="font-bold text-gray-900">{currentUser.store.rating.toFixed(1)}</span>
                  <span className="text-sm text-gray-500">calificación</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#1DB954]" />
                  <span className="font-bold text-gray-900">{currentUser.store.totalOrders}</span>
                  <span className="text-sm text-gray-500">pedidos</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Driver Info */}
      {!isStore && currentUser?.driver && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="bg-white border border-gray-200 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-900">
                <Car className="h-5 w-5 text-[#1DB954]" />
                Datos del Vehículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Tipo de vehículo</p>
                  <p className="text-sm font-medium text-gray-900">{getVehicleLabel(currentUser.driver.vehicleType)}</p>
                </div>
                {currentUser.driver.vehicleBrand && (
                  <div>
                    <p className="text-xs text-gray-500">Marca / Modelo</p>
                    <p className="text-sm font-medium text-gray-900">{currentUser.driver.vehicleBrand} {currentUser.driver.vehicleModel || ''}</p>
                  </div>
                )}
                {currentUser.driver.vehicleYear && (
                  <div>
                    <p className="text-xs text-gray-500">Año</p>
                    <p className="text-sm font-medium text-gray-900">{currentUser.driver.vehicleYear}</p>
                  </div>
                )}
                {currentUser.driver.vehiclePlate && (
                  <div>
                    <p className="text-xs text-gray-500">Placa</p>
                    <p className="text-sm font-medium text-gray-900">{currentUser.driver.vehiclePlate}</p>
                  </div>
                )}
                {currentUser.driver.licenseNumber && (
                  <div>
                    <p className="text-xs text-gray-500">Licencia</p>
                    <p className="text-sm font-medium text-gray-900">{currentUser.driver.licenseNumber}</p>
                  </div>
                )}
              </div>
              <Separator className="bg-gray-200" />
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-[#FFC145] fill-[#FFC145]" />
                  <span className="font-bold text-gray-900">{currentUser.driver.rating.toFixed(1)}</span>
                  <span className="text-sm text-gray-500">calificación</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#1DB954]" />
                  <span className="font-bold text-gray-900">{currentUser.driver.totalTrips}</span>
                  <span className="text-sm text-gray-500">viajes</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

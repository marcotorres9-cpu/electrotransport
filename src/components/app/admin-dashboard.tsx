'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Users, Store, Truck, Package, Menu, X, Search,
  ToggleLeft, ToggleRight, Trash2, AlertTriangle, PackageSearch,
  ChevronRight, Clock, CheckCircle2, MapPin, KeyRound
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { apiFetch, formatDate, getStatusLabel, getStatusColor, formatPrice, getVehicleLabel } from '@/lib/api'

interface AdminUser {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  isActive: boolean
  createdAt: string
  store: { id: string; storeName: string; address: string | null; city: string | null; rating: number; totalOrders: number } | null
  driver: { id: string; vehicleType: string; vehiclePlate: string | null; isOnline: boolean; rating: number; totalTrips: number; earnings: number } | null
}

interface AdminOrder {
  id: string
  orderNumber: string
  status: string
  originAddress: string
  destAddress: string
  proposedPrice: number
  acceptedPrice: number | null
  cargoType: string | null
  distanceKm: number
  createdAt: string
  creator: { id: string; name: string } | null
  store: { id: string; storeName: string } | null
  driver: { id: string; name: string; phone: string | null } | null
}

type AdminTab = 'users' | 'orders'

export default function AdminDashboard() {
  const { currentUser, logout, setCurrentView } = useAppStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [activeTab, setActiveTab] = useState<AdminTab>('users')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [passwordReset, setPasswordReset] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [stats, setStats] = useState({ totalUsers: 0, activeStores: 0, activeDrivers: 0, activeAdmins: 0, totalOrders: 0, pendingOrders: 0 })

  const loadUsers = useCallback(async () => {
    try {
      const usersData = await apiFetch('/api/admin/users')
      const userList = usersData.users || []
      setUsers(userList)
      setStats(prev => ({
        ...prev,
        totalUsers: userList.length,
        activeStores: userList.filter((u: AdminUser) => u.role === 'store' && u.isActive).length,
        activeDrivers: userList.filter((u: AdminUser) => u.role === 'driver' && u.isActive).length,
        activeAdmins: userList.filter((u: AdminUser) => u.role === 'admin' && u.isActive).length,
      }))
    } catch (err) {
      toast.error('Error al cargar usuarios')
    }
  }, [currentUser?.id, currentUser?.role])

  const loadOrders = useCallback(async () => {
    try {
      const data = await apiFetch('/api/admin/orders')
      const orderList = data.orders || []
      setOrders(orderList)
      setStats(prev => ({
        ...prev,
        totalOrders: orderList.length,
        pendingOrders: orderList.filter((o: AdminOrder) => o.status === 'pending' || o.status === 'offer_received').length,
      }))
    } catch (err) {
      toast.error('Error al cargar pedidos')
    }
  }, [currentUser?.id, currentUser?.role])

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadUsers()
      loadOrders()
    }
  }, [loadUsers, loadOrders, currentUser?.role])

  async function toggleUserStatus(userId: string, currentActive: boolean) {
    try {
      await apiFetch('/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify({ userId, isActive: !currentActive }),
      })
      toast.success(!currentActive ? 'Usuario activado' : 'Usuario desactivado')
      loadUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cambiar estado')
    }
  }

  async function deleteUser(userId: string) {
    try {
      await apiFetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' })
      toast.success('Usuario eliminado correctamente')
      setDeleteConfirm(null)
      loadUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar usuario')
    }
  }

  async function resetPassword(userId: string) {
    if (!newPassword || newPassword.length < 4) {
      toast.error('La contraseña debe tener al menos 4 caracteres')
      return
    }
    try {
      await apiFetch('/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify({ userId, newPassword }),
      })
      toast.success('Contraseña actualizada')
      setPasswordReset(null)
      setNewPassword('')
    } catch (err) {
      toast.error('Error al cambiar contraseña')
    }
  }

  function handleNavClick(viewId: string) {
    setCurrentView(viewId as any)
    setSidebarOpen(false)
  }

  function handleLogout() {
    logout()
    toast.success('Sesión cerrada')
  }

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    const matchesSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    return matchesRole && matchesSearch
  })

  const filteredOrders = orders.filter((o) => {
    if (!search) return true
    return o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.originAddress.toLowerCase().includes(search.toLowerCase()) ||
      o.destAddress.toLowerCase().includes(search.toLowerCase()) ||
      (o.creator?.name || '').toLowerCase().includes(search.toLowerCase())
  })

  const adminNavItems = [
    { id: 'admin-dashboard', label: 'Panel de Admin', icon: Shield },
  ]

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Password reset modal */}
      <AnimatePresence>
        {passwordReset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
            onClick={() => { setPasswordReset(null); setNewPassword('') }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#845EF7]/15 flex items-center justify-center">
                  <KeyRound className="h-6 w-6 text-[#845EF7]" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Cambiar Contraseña</h3>
                  <p className="text-xs text-gray-500">Establece una nueva contraseña</p>
                </div>
              </div>
              <Input
                type="text"
                placeholder="Nueva contraseña (mínimo 4 caracteres)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mb-4"
                onKeyDown={(e) => { if (e.key === 'Enter') resetPassword(passwordReset) }}
              />
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 border-gray-200" onClick={() => { setPasswordReset(null); setNewPassword('') }}>Cancelar</Button>
                <Button className="flex-1 bg-[#845EF7] hover:bg-[#7050d4] text-white font-semibold" onClick={() => resetPassword(passwordReset)}>Guardar</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#FF6B6B]/15 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-[#FF6B6B]" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">¿Eliminar usuario?</h3>
                  <p className="text-xs text-gray-500">Esta acción no se puede deshacer</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Se eliminarán todos los datos del usuario incluyendo su perfil, pedidos y notificaciones.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-gray-200 text-gray-700"
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-[#FF6B6B] hover:bg-[#e55a5a] text-white font-semibold"
                  onClick={() => deleteUser(deleteConfirm)}
                >
                  Eliminar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Admin Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 lg:transform-none ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#845EF7] to-[#6d4bd4] flex items-center justify-center">
                <Shield className="h-5 w-5 text-gray-900" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm">ElectroTransport</h2>
                <p className="text-xs text-gray-500">Panel de Administración</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </div>
          <Separator className="bg-gray-200" />
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#845EF7]/15 flex items-center justify-center">
                <span className="text-[#845EF7] font-semibold text-sm">{currentUser?.name?.charAt(0) || 'A'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{currentUser?.name}</p>
                <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
              </div>
            </div>
          </div>
          <Separator className="bg-gray-200" />
          <nav className="flex-1 p-3 space-y-1">
            {adminNavItems.map((item) => {
              const isActive = useAppStore.getState().currentView === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                    isActive ? 'bg-[#845EF7]/10 text-[#845EF7]' : 'text-gray-500 hover:bg-[#F9FAFB]'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              )
            })}
          </nav>
          <div className="p-4">
            <div className="bg-[#F9FAFB] border border-gray-200 rounded-xl p-3 flex items-center gap-3">
              <Shield className="h-5 w-5 text-[#845EF7]" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Administrador</p>
                <p className="text-xs text-gray-500">Acceso total</p>
              </div>
            </div>
          </div>
          <Separator className="bg-gray-200" />
          <div className="p-3">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-colors">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500">
            <Menu className="h-6 w-6" />
          </button>
          <Shield className="h-5 w-5 text-[#845EF7]" />
          <h1 className="font-semibold text-gray-900 flex-1">Admin</h1>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
            <p className="text-sm text-gray-500">Gestiona usuarios y monitorea la plataforma</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Usuarios', value: stats.totalUsers, icon: Users, color: 'bg-[#F9FAFB] text-gray-500' },
              { label: 'Locales Activos', value: stats.activeStores, icon: Store, color: 'bg-[#1DB954]/10 text-[#1DB954]' },
              { label: 'Transportistas Activos', value: stats.activeDrivers, icon: Truck, color: 'bg-[#00C9A7]/10 text-[#00C9A7]' },
              { label: 'Pedidos Pendientes', value: stats.pendingOrders, icon: Package, color: 'bg-[#FFC145]/10 text-[#FFC145]' },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="bg-white border border-gray-200 shadow-none">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                      <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-2">
            <button
              onClick={() => { setActiveTab('users'); setSearch(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'users' ? 'bg-[#845EF7] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Users className="h-4 w-4" />
              Usuarios
            </button>
            <button
              onClick={() => { setActiveTab('orders'); setSearch(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'orders' ? 'bg-[#845EF7] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Package className="h-4 w-4" />
              Pedidos
              {stats.pendingOrders > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFC145] text-black">
                  {stats.pendingOrders}
                </span>
              )}
            </button>
          </div>

          {/* Users Tab */}
          {activeTab === 'users' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="bg-white border border-gray-200 shadow-none">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                    <Users className="h-5 w-5" />
                    Gestión de Usuarios
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                  {/* Search & Filter */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Buscar por nombre o email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 bg-[#F9FAFB] border-gray-200 text-gray-900"
                      />
                    </div>
                    <div className="flex gap-2">
                      {[
                        { value: 'all', label: 'Todos' },
                        { value: 'store', label: 'Locales' },
                        { value: 'driver', label: 'Transportistas' },
                        { value: 'admin', label: 'Admins' },
                      ].map((f) => (
                        <button
                          key={f.value}
                          onClick={() => setRoleFilter(f.value)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                            roleFilter === f.value
                              ? 'bg-[#845EF7] text-white'
                              : 'bg-[#F9FAFB] text-gray-500 hover:bg-gray-200 border border-gray-200'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Users Table */}
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#F9FAFB] text-left">
                          <th className="px-4 py-3 font-medium text-gray-500">Nombre</th>
                          <th className="px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Email</th>
                          <th className="px-4 py-3 font-medium text-gray-500">Rol</th>
                          <th className="px-4 py-3 font-medium text-gray-500">Estado</th>
                          <th className="px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Registro</th>
                          <th className="px-4 py-3 font-medium text-gray-500 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-[#F9FAFB]/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                  user.role === 'store' ? 'bg-[#1DB954]/15' : user.role === 'admin' ? 'bg-[#845EF7]/15' : 'bg-[#00C9A7]/15'
                                }`}>
                                  <span className={`font-semibold text-xs ${
                                    user.role === 'store' ? 'text-[#1DB954]' : user.role === 'admin' ? 'text-[#845EF7]' : 'text-[#00C9A7]'
                                  }`}>
                                    {user.name.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                                  <p className="text-xs text-gray-500 sm:hidden">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{user.email}</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className={`text-xs ${
                                user.role === 'store' ? 'border-[#1DB954]/30 text-[#1DB954]'
                                : user.role === 'admin' ? 'border-[#845EF7]/30 text-[#845EF7]'
                                : 'border-[#00C9A7]/30 text-[#00C9A7]'
                              }`}>
                                {user.role === 'admin' ? <Shield className="h-3 w-3 mr-1" /> : user.role === 'store' ? <Store className="h-3 w-3 mr-1" /> : <Truck className="h-3 w-3 mr-1" />}
                                {user.role === 'admin' ? 'Admin' : user.role === 'store' ? 'Local' : 'Transportista'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={`text-xs ${user.isActive ? 'bg-[#1DB954]/15 text-[#1DB954]' : 'bg-[#FF6B6B]/15 text-[#FF6B6B]'}`}>
                                {user.isActive ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">
                              {formatDate(user.createdAt)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleUserStatus(user.id, user.isActive)}
                                  className={`text-xs ${
                                    user.isActive
                                      ? 'text-[#FF6B6B] hover:bg-[#FF6B6B]/10'
                                      : 'text-[#1DB954] hover:bg-[#1DB954]/10'
                                  }`}
                                >
                                  {user.isActive ? (
                                    <><ToggleRight className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Desactivar</span></>
                                  ) : (
                                    <><ToggleLeft className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Activar</span></>
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setPasswordReset(user.id)}
                                  className="text-xs text-gray-400 hover:bg-gray-100"
                                  title="Cambiar contraseña"
                                >
                                  <KeyRound className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteConfirm(user.id)}
                                  className="text-xs text-[#FF6B6B] hover:bg-[#FF6B6B]/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {filteredUsers.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No se encontraron usuarios</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="bg-white border border-gray-200 shadow-none">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                    <Package className="h-5 w-5" />
                    Todos los Pedidos
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-200 text-gray-600"
                    onClick={loadOrders}
                  >
                    <PackageSearch className="h-4 w-4 mr-1" />
                    Actualizar
                  </Button>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Buscar por número, dirección o local..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 bg-[#F9FAFB] border-gray-200 text-gray-900"
                    />
                  </div>

                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No se encontraron pedidos</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredOrders.map((order, i) => (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            {/* Order info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="font-mono text-xs font-bold text-gray-900">{order.orderNumber}</span>
                                <Badge className={`text-[10px] px-1.5 py-0 ${getStatusColor(order.status)}`}>
                                  {getStatusLabel(order.status)}
                                </Badge>
                              </div>
                              <div className="flex items-start gap-2 text-xs text-gray-500 mb-1">
                                <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                                <span className="truncate">{order.originAddress} → {order.destAddress}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1.5">
                                <span className="flex items-center gap-1">
                                  <span className="font-semibold text-gray-900">{formatPrice(order.acceptedPrice || order.proposedPrice)}</span>
                                </span>
                                {order.cargoType && <span>Tipo: {order.cargoType}</span>}
                                {order.distanceKm > 0 && <span>{order.distanceKm} km</span>}
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(order.createdAt)}
                                </span>
                              </div>
                            </div>

                            {/* People involved */}
                            <div className="flex flex-col gap-1.5 text-xs sm:text-right shrink-0">
                              {order.creator && (
                                <div className="flex items-center gap-1.5 sm:justify-end">
                                  <Store className="h-3 w-3 text-[#1DB954]" />
                                  <span className="text-gray-600">{order.creator.name}</span>
                                </div>
                              )}
                              {order.driver && (
                                <div className="flex items-center gap-1.5 sm:justify-end">
                                  <Truck className="h-3 w-3 text-[#00C9A7]" />
                                  <span className="text-gray-600">{order.driver.name}</span>
                                </div>
                              )}
                              {order.store && (
                                <span className="text-gray-400">{order.store.storeName}</span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Version */}
          <p className="text-center text-[10px] text-gray-400">v3.0.0</p>
        </div>
      </main>
    </div>
  )
}

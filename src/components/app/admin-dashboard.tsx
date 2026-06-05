'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { motion } from 'framer-motion'
import {
  Shield, Users, Store, Truck, Package, Menu, X, Search,
  ToggleLeft, ToggleRight, ChevronDown
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { apiFetch, formatDate } from '@/lib/api'

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

export default function AdminDashboard() {
  const { currentUser, logout, setCurrentView } = useAppStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [stats, setStats] = useState({ totalUsers: 0, activeStores: 0, activeDrivers: 0, activeAdmins: 0, pendingOrders: 0 })

  const loadData = useCallback(async () => {
    try {
      console.log('[AdminDashboard] Loading users... currentUser:', currentUser?.name, 'role:', currentUser?.role)
      const usersData = await apiFetch('/api/admin/users')
      console.log('[AdminDashboard] API response:', usersData)
      const userList = usersData.users || []
      console.log('[AdminDashboard] Users found:', userList.length)
      setUsers(userList)
      setStats({
        totalUsers: userList.length,
        activeStores: userList.filter((u: AdminUser) => u.role === 'store' && u.isActive).length,
        activeDrivers: userList.filter((u: AdminUser) => u.role === 'driver' && u.isActive).length,
        pendingOrders: 0,
        activeAdmins: userList.filter((u: AdminUser) => u.role === 'admin' && u.isActive).length,
      })
    } catch (err) {
      console.error('[AdminDashboard] Error loading users:', err)
      toast.error('Error al cargar usuarios')
    }
  }, [currentUser?.id, currentUser?.role])

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadData()
    }
  }, [loadData, currentUser?.role])

  async function toggleUserStatus(userId: string, currentActive: boolean) {
    try {
      await apiFetch('/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify({ userId, isActive: !currentActive }),
      })
      toast.success(!currentActive ? 'Usuario activado' : 'Usuario desactivado')
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cambiar estado')
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

  const adminNavItems = [
    { id: 'admin-dashboard', label: 'Panel de Admin' },
  ]

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
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
                  <Shield className="h-4 w-4" />
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

          {/* User Management */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
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
                            ? 'bg-[#845EF7] text-gray-900'
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
                      {filteredUsers.map((user, i) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="hover:bg-[#F9FAFB]/50"
                        >
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
                              user.role === 'store'
                                ? 'border-[#1DB954]/30 text-[#1DB954]'
                                : user.role === 'admin'
                                  ? 'border-[#845EF7]/30 text-[#845EF7]'
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
                          <td className="px-4 py-3 text-right">
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
                                <>
                                  <ToggleRight className="h-4 w-4 mr-1" />
                                  Desactivar
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="h-4 w-4 mr-1" />
                                  Activar
                                </>
                              )}
                            </Button>
                          </td>
                        </motion.tr>
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
        </div>
      </main>
    </div>
  )
}

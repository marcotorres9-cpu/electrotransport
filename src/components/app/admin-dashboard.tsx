'use client'

import { useState, useCallback, useRef } from 'react'
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
  const [stats, setStats] = useState({ totalUsers: 0, activeStores: 0, activeDrivers: 0, pendingOrders: 0 })

  const loadData = useCallback(async () => {
    try {
      const [usersData] = await Promise.all([
        apiFetch('/api/admin/users'),
      ])
      const userList = usersData.users || []
      setUsers(userList)
      setStats({
        totalUsers: userList.length,
        activeStores: userList.filter((u: AdminUser) => u.role === 'store' && u.isActive).length,
        activeDrivers: userList.filter((u: AdminUser) => u.role === 'driver' && u.isActive).length,
        pendingOrders: 0,
      })
    } catch {
      // silently fail
    }
  }, [])

  const initialized = useRef(false)
  if (initialized.current == null) {
    initialized.current = true
    loadData()
  }

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
    <div className="min-h-screen bg-[#181818]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Admin Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-[#1e1e1e] border-r border-[#333333] z-50 transform transition-transform duration-300 lg:transform-none ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#845EF7] to-[#6d4bd4] flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-white text-sm">ElectroTransport</h2>
                <p className="text-xs text-[#888888]">Panel de Administración</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-[#888888]">
              <X className="h-5 w-5" />
            </button>
          </div>
          <Separator className="bg-[#333333]" />
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#845EF7]/15 flex items-center justify-center">
                <span className="text-[#845EF7] font-semibold text-sm">{currentUser?.name?.charAt(0) || 'A'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-white truncate">{currentUser?.name}</p>
                <p className="text-xs text-[#888888] truncate">{currentUser?.email}</p>
              </div>
            </div>
          </div>
          <Separator className="bg-[#333333]" />
          <nav className="flex-1 p-3 space-y-1">
            {adminNavItems.map((item) => {
              const isActive = useAppStore.getState().currentView === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                    isActive ? 'bg-[#845EF7]/10 text-[#845EF7]' : 'text-[#8a8a8a] hover:bg-[#262626]'
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  {item.label}
                </button>
              )
            })}
          </nav>
          <div className="p-4">
            <div className="bg-[#262626] border border-[#333333] rounded-xl p-3 flex items-center gap-3">
              <Shield className="h-5 w-5 text-[#845EF7]" />
              <div>
                <p className="text-sm font-semibold text-white">Administrador</p>
                <p className="text-xs text-[#888888]">Acceso total</p>
              </div>
            </div>
          </div>
          <Separator className="bg-[#333333]" />
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
        <header className="lg:hidden sticky top-0 z-30 bg-[#1e1e1e] border-b border-[#333333] px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-[#8a8a8a]">
            <Menu className="h-6 w-6" />
          </button>
          <Shield className="h-5 w-5 text-[#845EF7]" />
          <h1 className="font-semibold text-white flex-1">Admin</h1>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>
            <p className="text-sm text-[#8a8a8a]">Gestiona usuarios y monitorea la plataforma</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Usuarios', value: stats.totalUsers, icon: Users, color: 'bg-[#262626] text-[#8a8a8a]' },
              { label: 'Locales Activos', value: stats.activeStores, icon: Store, color: 'bg-[#1DB954]/10 text-[#1DB954]' },
              { label: 'Transportistas Activos', value: stats.activeDrivers, icon: Truck, color: 'bg-[#00C9A7]/10 text-[#00C9A7]' },
              { label: 'Pedidos Pendientes', value: stats.pendingOrders, icon: Package, color: 'bg-[#FFC145]/10 text-[#FFC145]' },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="bg-[#1e1e1e] border border-[#333333] shadow-none">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-[#888888]">{stat.label}</p>
                      <p className="text-lg font-bold text-white">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* User Management */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-[#1e1e1e] border border-[#333333] shadow-none">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-white">
                  <Users className="h-5 w-5" />
                  Gestión de Usuarios
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                {/* Search & Filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888888]" />
                    <Input
                      placeholder="Buscar por nombre o email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 bg-[#262626] border-[#2e2e2e] text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    {[
                      { value: 'all', label: 'Todos' },
                      { value: 'store', label: 'Locales' },
                      { value: 'driver', label: 'Transportistas' },
                    ].map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setRoleFilter(f.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                          roleFilter === f.value
                            ? 'bg-[#845EF7] text-white'
                            : 'bg-[#262626] text-[#8a8a8a] hover:bg-[#333333] border border-[#333333]'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto rounded-xl border border-[#333333]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#262626] text-left">
                        <th className="px-4 py-3 font-medium text-[#888888]">Nombre</th>
                        <th className="px-4 py-3 font-medium text-[#888888] hidden sm:table-cell">Email</th>
                        <th className="px-4 py-3 font-medium text-[#888888]">Rol</th>
                        <th className="px-4 py-3 font-medium text-[#888888]">Estado</th>
                        <th className="px-4 py-3 font-medium text-[#888888] hidden md:table-cell">Registro</th>
                        <th className="px-4 py-3 font-medium text-[#888888] text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#333333]">
                      {filteredUsers.map((user, i) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="hover:bg-[#262626]/50"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                user.role === 'store' ? 'bg-[#1DB954]/15' : 'bg-[#00C9A7]/15'
                              }`}>
                                <span className={`font-semibold text-xs ${
                                  user.role === 'store' ? 'text-[#1DB954]' : 'text-[#00C9A7]'
                                }`}>
                                  {user.name.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-white text-sm">{user.name}</p>
                                <p className="text-xs text-[#888888] sm:hidden">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[#8a8a8a] hidden sm:table-cell">{user.email}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={`text-xs ${
                              user.role === 'store'
                                ? 'border-[#1DB954]/30 text-[#1DB954]'
                                : 'border-[#00C9A7]/30 text-[#00C9A7]'
                            }`}>
                              {user.role === 'store' ? <Store className="h-3 w-3 mr-1" /> : <Truck className="h-3 w-3 mr-1" />}
                              {user.role === 'store' ? 'Local' : 'Transportista'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={`text-xs ${user.isActive ? 'bg-[#1DB954]/15 text-[#1DB954]' : 'bg-[#FF6B6B]/15 text-[#FF6B6B]'}`}>
                              {user.isActive ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-[#888888] text-xs hidden md:table-cell">
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
                    <Users className="h-12 w-12 text-[#333] mx-auto mb-3" />
                    <p className="text-[#888888]">No se encontraron usuarios</p>
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

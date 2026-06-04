'use client'

import { useEffect, useState } from 'react'
import { useAppStore, type ViewName } from '@/store/use-app-store'
import Image from 'next/image'
import {
  LayoutDashboard, PackagePlus, ClipboardList, User, Bell,
  Truck, LogOut, Menu, X, Star
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'

const navItems: { id: ViewName; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'store-dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'store-create-order', label: 'Nuevo Pedido', icon: PackagePlus },
  { id: 'store-orders', label: 'Mis Pedidos', icon: ClipboardList },
  { id: 'store-notifications', label: 'Notificaciones', icon: Bell },
  { id: 'store-profile', label: 'Mi Perfil', icon: User },
]

interface StoreLayoutProps {
  children: React.ReactNode
}

export default function StoreLayout({ children }: StoreLayoutProps) {
  const {
    currentUser, currentView, setCurrentView, logout,
    unreadCount, setNotifications, setUnreadCount
  } = useAppStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function loadNotifications() {
    try {
      const data = await apiFetch('/api/notifications')
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  function handleNavClick(viewId: ViewName) {
    setCurrentView(viewId)
    setSidebarOpen(false)
    if (viewId === 'store-notifications') {
      loadNotifications()
    }
  }

  function handleLogout() {
    logout()
    toast.success('Sesión cerrada')
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-[#1DB954] flex items-center justify-center">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm">ElectroTransport</h2>
                <p className="text-xs text-gray-500">Panel de Local</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-gray-500 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <Separator className="bg-gray-200" />

          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1DB954]/15 flex items-center justify-center">
                <span className="text-[#1DB954] font-semibold text-sm">
                  {currentUser?.name?.charAt(0) || 'L'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{currentUser?.store?.storeName || currentUser?.name}</p>
                <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-200" />

          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = currentView === item.id
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#1DB954]/10 text-[#1DB954]'
                      : 'text-gray-500 hover:bg-[#F9FAFB]'
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-colors ${isActive ? 'text-[#1DB954]' : 'text-gray-500'}`} />
                  {item.label}
                  {item.id === 'store-notifications' && unreadCount > 0 && (
                    <Badge className="ml-auto bg-[#FFC145] text-black text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {unreadCount}
                    </Badge>
                  )}
                </button>
              )
            })}
          </nav>

          {currentUser?.store && (
            <div className="p-4">
              <div className="bg-[#F9FAFB] border border-gray-200 rounded-xl p-3 flex items-center gap-3">
                <Star className="h-5 w-5 text-[#FFC145] fill-[#FFC145]" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{currentUser.store.rating.toFixed(1)}</p>
                  <p className="text-xs text-gray-500">Calificación</p>
                </div>
              </div>
            </div>
          )}

          <Separator className="bg-gray-200" />

          <div className="p-3">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-900 transition-colors">
            <Menu className="h-6 w-6" />
          </button>
          <Truck className="h-5 w-5 text-[#1DB954]" />
          <h1 className="font-semibold text-gray-900">ElectroTransport</h1>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

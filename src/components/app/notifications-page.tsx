'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { motion } from 'framer-motion'
import {
  Bell, Package, DollarSign, Info, CheckCircle2, Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiFetch, formatDate } from '@/lib/api'

const typeIcons: Record<string, typeof Bell> = {
  order: Package,
  payment: DollarSign,
  system: Info,
  info: Info,
  offer: DollarSign,
}

const typeColors: Record<string, string> = {
  order: 'bg-emerald-100 text-emerald-600',
  payment: 'bg-amber-100 text-amber-600',
  system: 'bg-slate-100 text-slate-600',
  info: 'bg-sky-100 text-sky-600',
  offer: 'bg-orange-100 text-orange-600',
}

export default function NotificationsPage() {
  const { notifications, setNotifications, setUnreadCount, setCurrentView, setSelectedOrderId, currentUser } = useAppStore()

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

  async function markAllRead() {
    try {
      await apiFetch('/api/notifications/mark-read', {
        method: 'PATCH',
        body: JSON.stringify({ markAll: true }),
      })
      loadNotifications()
    } catch {
      // silently fail
    }
  }

  function handleViewOrder(orderId: string) {
    setSelectedOrderId(orderId)
    if (currentUser?.role === 'store') {
      setCurrentView('store-order-detail')
    } else {
      setCurrentView('driver-my-orders')
    }
    loadNotifications()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notificaciones</h1>
          <p className="text-sm text-muted-foreground">
            {notifications.filter((n) => !n.isRead).length} sin leer
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
          onClick={markAllRead}
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Marcar todas como leídas
        </Button>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="h-16 w-16 text-slate-200 mx-auto mb-4" />
          <p className="text-muted-foreground">No hay notificaciones</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif, i) => {
            const Icon = typeIcons[notif.type] || Info
            const colorClass = typeColors[notif.type] || typeColors.info
            const isOffer = notif.type === 'offer'
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className={`border-none shadow-sm ${
                  !notif.isRead
                    ? isOffer
                      ? 'border-l-4 border-l-orange-500 bg-orange-50/50'
                      : 'border-l-4 border-l-emerald-500 bg-emerald-50/30'
                    : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg ${colorClass} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`text-sm font-medium ${!notif.isRead ? 'text-slate-800' : 'text-muted-foreground'}`}>
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <div className={`w-2 h-2 rounded-full shrink-0 ${isOffer ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                          )}
                          {isOffer && (
                            <Badge className="bg-orange-100 text-orange-700 text-[10px] px-1.5 py-0">
                              OFERTA
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{notif.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-muted-foreground">{formatDate(notif.createdAt)}</p>
                          {/* Action button for unread offer notifications with orderId */}
                          {!notif.isRead && isOffer && notif.orderId && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs border-orange-200 text-orange-700 hover:bg-orange-50"
                              onClick={() => handleViewOrder(notif.orderId!)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Ver Pedido
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

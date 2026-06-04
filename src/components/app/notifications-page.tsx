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
  order: 'bg-[#1DB954]/15 text-[#1DB954]',
  payment: 'bg-[#FFC145]/15 text-[#FFC145]',
  system: 'bg-[#262626] text-[#8a8a8a]',
  info: 'bg-[#00C9A7]/15 text-[#00C9A7]',
  offer: 'bg-[#FFC145]/15 text-[#FFC145]',
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
          <h1 className="text-2xl font-bold text-white">Notificaciones</h1>
          <p className="text-sm text-[#8a8a8a]">
            {notifications.filter((n) => !n.isRead).length} sin leer
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-[#1DB954] border-[#1DB954]/30 hover:bg-[#1DB954]/10"
          onClick={markAllRead}
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Marcar todas como leídas
        </Button>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="h-16 w-16 text-[#333] mx-auto mb-4" />
          <p className="text-[#888888]">No hay notificaciones</p>
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
                <Card className={`bg-[#1e1e1e] border border-[#333333] shadow-none ${
                  !notif.isRead
                    ? isOffer
                      ? 'border-l-4 border-l-[#FFC145] bg-[#FFC145]/5'
                      : 'border-l-4 border-l-[#1DB954] bg-[#1DB954]/5'
                    : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg ${colorClass} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`text-sm font-medium ${!notif.isRead ? 'text-white' : 'text-[#8a8a8a]'}`}>
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <div className={`w-2 h-2 rounded-full shrink-0 ${isOffer ? 'bg-[#FFC145]' : 'bg-[#1DB954]'}`} />
                          )}
                          {isOffer && (
                            <Badge className="bg-[#FFC145]/15 text-[#FFC145] text-[10px] px-1.5 py-0">
                              OFERTA
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-[#8a8a8a]">{notif.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-[#888888]">{formatDate(notif.createdAt)}</p>
                          {/* Action button for unread offer notifications with orderId */}
                          {!notif.isRead && isOffer && notif.orderId && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs border-[#FFC145]/30 text-[#FFC145] hover:bg-[#FFC145]/10"
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

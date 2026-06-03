import { useAppStore } from '@/store/use-app-store'

export function getHeaders() {
  const { currentUser } = useAppStore.getState()
  return {
    'Content-Type': 'application/json',
    'x-user-id': currentUser?.id || '',
    'x-user-role': currentUser?.role || '',
  }
}

export async function apiFetch(url: string, options: RequestInit = {}) {
  const headers = getHeaders()
  try {
    const res = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers },
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || 'Request failed')
    }
    return data
  } catch (error) {
    throw error
  }
}

export function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'accepted': return 'bg-sky-100 text-sky-800 border-sky-200'
    case 'in_progress': return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function getStatusLabel(status: string) {
  switch (status) {
    case 'pending': return 'Pendiente'
    case 'accepted': return 'Aceptado'
    case 'in_progress': return 'En Progreso'
    case 'delivered': return 'Entregado'
    case 'cancelled': return 'Cancelado'
    default: return status
  }
}

export function getVehicleLabel(type: string) {
  switch (type) {
    case 'camioneta': return 'Camioneta'
    case 'doble_cabina': return 'Doble Cabina'
    case 'camion': return 'Camión'
    default: return type
  }
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

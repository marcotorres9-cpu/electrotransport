import { create } from 'zustand'

export type ViewName =
  | 'landing'
  | 'login'
  | 'register'
  | 'store-dashboard'
  | 'store-create-order'
  | 'store-orders'
  | 'store-order-detail'
  | 'store-profile'
  | 'store-notifications'
  | 'driver-dashboard'
  | 'driver-available-orders'
  | 'driver-my-orders'
  | 'driver-profile'
  | 'driver-notifications'

export interface UserWithProfile {
  id: string
  name: string
  email: string
  phone: string | null
  role: 'store' | 'driver'
  avatar: string | null
  isActive: boolean
  token: string
  store?: {
    id: string
    storeName: string
    storeType: string | null
    address: string | null
    city: string | null
    rutNumber: string | null
    rating: number
    totalOrders: number
  } | null
  driver?: {
    id: string
    vehicleType: string
    vehicleBrand: string | null
    vehicleModel: string | null
    vehicleYear: number | null
    vehiclePlate: string | null
    licenseNumber: string | null
    isOnline: boolean
    rating: number
    totalTrips: number
    earnings: number
  } | null
}

export interface OrderItem {
  id: string
  orderNumber: string
  createdBy: string
  acceptedBy: string | null
  storeId: string | null
  status: string
  originAddress: string
  originLat: number
  originLng: number
  destAddress: string
  destLat: number
  destLng: number
  cargoType: string | null
  cargoWeight: number | null
  cargoQuantity: number | null
  specialNotes: string | null
  proposedPrice: number
  acceptedPrice: number | null
  counterPrice: number | null
  distanceKm: number | null
  estimatedTime: number | null
  createdAt: string
  completedAt: string | null
  cancelledAt: string | null
  creator?: { id: string; name: string } | null
  driver?: { id: string; name: string; driver?: { vehicleType: string; vehiclePlate: string | null } | null } | null
  store?: { id: string; storeName: string } | null
}

export interface NotificationItem {
  id: string
  userId: string
  title: string
  message: string
  type: string
  isRead: boolean
  orderId: string | null
  createdAt: string
}

export interface DriverLocation {
  id: string
  userId: string
  vehicleType: string
  vehiclePlate: string | null
  lat: number
  lng: number
  isOnline: boolean
  rating: number
  name: string
}

interface AppState {
  // Auth
  currentUser: UserWithProfile | null
  currentView: ViewName
  isLoading: boolean

  // Order management
  orders: OrderItem[]
  selectedOrderId: string | null
  orderFilter: string

  // Notifications
  notifications: NotificationItem[]
  unreadCount: number

  // Driver state
  driverOrders: OrderItem[]
  availableOrders: OrderItem[]
  isDriverOnline: boolean
  lastPolledOrderIds: string[]

  // Incoming order notification (call-style)
  incomingOrder: OrderItem | null
  showIncomingNotification: boolean

  // Driver locations for map
  onlineDrivers: DriverLocation[]

  // Actions
  setCurrentUser: (user: UserWithProfile | null) => void
  setCurrentView: (view: ViewName) => void
  setLoading: (loading: boolean) => void
  setOrders: (orders: OrderItem[]) => void
  setSelectedOrderId: (id: string | null) => void
  setOrderFilter: (filter: string) => void
  setNotifications: (notifications: NotificationItem[]) => void
  setUnreadCount: (count: number) => void
  setDriverOrders: (orders: OrderItem[]) => void
  setAvailableOrders: (orders: OrderItem[]) => void
  setDriverOnline: (online: boolean) => void
  setLastPolledOrderIds: (ids: string[]) => void
  setIncomingOrder: (order: OrderItem | null) => void
  setShowIncomingNotification: (show: boolean) => void
  setOnlineDrivers: (drivers: DriverLocation[]) => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  currentUser: null,
  currentView: 'landing',
  isLoading: false,
  orders: [],
  selectedOrderId: null,
  orderFilter: 'all',
  notifications: [],
  unreadCount: 0,
  driverOrders: [],
  availableOrders: [],
  isDriverOnline: false,
  lastPolledOrderIds: [],
  incomingOrder: null,
  showIncomingNotification: false,
  onlineDrivers: [],

  // Actions
  setCurrentUser: (user) => set({ currentUser: user }),
  setCurrentView: (view) => set({ currentView: view }),
  setLoading: (loading) => set({ isLoading: loading }),
  setOrders: (orders) => set({ orders }),
  setSelectedOrderId: (id) => set({ selectedOrderId: id }),
  setOrderFilter: (filter) => set({ orderFilter: filter }),
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    }),
  setUnreadCount: (count) => set({ unreadCount: count }),
  setDriverOrders: (orders) => set({ driverOrders: orders }),
  setAvailableOrders: (orders) => set({ availableOrders: orders }),
  setDriverOnline: (online) => set({ isDriverOnline: online }),
  setLastPolledOrderIds: (ids) => set({ lastPolledOrderIds: ids }),
  setIncomingOrder: (order) => set({ incomingOrder: order }),
  setShowIncomingNotification: (show) => set({ showIncomingNotification: show }),
  setOnlineDrivers: (drivers) => set({ onlineDrivers: drivers }),
  logout: () =>
    set({
      currentUser: null,
      currentView: 'landing',
      orders: [],
      selectedOrderId: null,
      notifications: [],
      unreadCount: 0,
      driverOrders: [],
      availableOrders: [],
      isDriverOnline: false,
      lastPolledOrderIds: [],
      incomingOrder: null,
      showIncomingNotification: false,
      onlineDrivers: [],
    }),
}))

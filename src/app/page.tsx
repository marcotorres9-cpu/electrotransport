'use client'

import { useAppStore } from '@/store/use-app-store'
import { motion, AnimatePresence } from 'framer-motion'
import LandingPage from '@/components/app/landing-page'
import LoginPage from '@/components/app/login-page'
import RegisterPage from '@/components/app/register-page'
import StoreLayout from '@/components/app/store-layout'
import StoreDashboard from '@/components/app/store-dashboard'
import CreateOrderPage from '@/components/app/create-order-page'
import StoreOrdersPage from '@/components/app/store-orders-page'
import OrderDetailPage from '@/components/app/order-detail-page'
import DriverDashboard from '@/components/app/driver-dashboard'
import DriverAvailableOrders from '@/components/app/driver-available-orders'
import DriverMyOrders from '@/components/app/driver-my-orders'
import NotificationsPage from '@/components/app/notifications-page'
import ProfilePage from '@/components/app/profile-page'
import IncomingOrderNotification from '@/components/app/incoming-order-notification'

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

export default function Home() {
  const { currentView } = useAppStore()

  return (
    <>
      <AnimatePresence mode="wait">
        {/* Public pages */}
        {currentView === 'landing' && (
          <PageTransition key="landing">
            <LandingPage />
          </PageTransition>
        )}

        {currentView === 'login' && (
          <PageTransition key="login">
            <LoginPage />
          </PageTransition>
        )}

        {currentView === 'register' && (
          <PageTransition key="register">
            <RegisterPage />
          </PageTransition>
        )}

        {/* Store pages */}
        {(currentView === 'store-dashboard' ||
          currentView === 'store-create-order' ||
          currentView === 'store-orders' ||
          currentView === 'store-order-detail' ||
          currentView === 'store-notifications' ||
          currentView === 'store-profile') && (
          <PageTransition key={currentView}>
            <StoreLayout>
              {currentView === 'store-dashboard' && <StoreDashboard />}
              {currentView === 'store-create-order' && <CreateOrderPage />}
              {currentView === 'store-orders' && <StoreOrdersPage />}
              {currentView === 'store-order-detail' && <OrderDetailPage />}
              {currentView === 'store-notifications' && <NotificationsPage />}
              {currentView === 'store-profile' && <ProfilePage />}
            </StoreLayout>
          </PageTransition>
        )}

        {/* Driver pages */}
        {currentView === 'driver-dashboard' && (
          <PageTransition key="driver-dashboard">
            <DriverDashboard />
          </PageTransition>
        )}

        {currentView === 'driver-available-orders' && (
          <PageTransition key="driver-available-orders">
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30">
              <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
                <DriverAvailableOrders />
              </div>
            </div>
          </PageTransition>
        )}

        {currentView === 'driver-my-orders' && (
          <PageTransition key="driver-my-orders">
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30">
              <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
                <DriverMyOrders />
              </div>
            </div>
          </PageTransition>
        )}

        {currentView === 'driver-notifications' && (
          <PageTransition key="driver-notifications">
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30">
              <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
                <NotificationsPage />
              </div>
            </div>
          </PageTransition>
        )}

        {currentView === 'driver-profile' && (
          <PageTransition key="driver-profile">
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30">
              <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
                <ProfilePage />
              </div>
            </div>
          </PageTransition>
        )}
      </AnimatePresence>

      {/* Global Incoming Order Notification (always rendered for drivers) */}
      <IncomingOrderNotification />
    </>
  )
}

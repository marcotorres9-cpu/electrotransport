'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone, PhoneOff, MapPin, Package, DollarSign, Truck, Timer, Navigation
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import { apiFetch, formatPrice } from '@/lib/api'
import type { OrderItem } from '@/store/use-app-store'

// Web Audio API ringtone generator
class RingtoneEngine {
  private audioCtx: AudioContext | null = null
  private isPlaying = false
  private oscillator: OscillatorNode | null = null
  private gainNode: GainNode | null = null
  private intervalId: number | null = null

  start() {
    if (this.isPlaying) return
    try {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.isPlaying = true
      this.playRingPattern()
    } catch {
      // Audio not supported
    }
  }

  private playRingPattern() {
    if (!this.audioCtx || !this.isPlaying) return

    // Pattern: two-tone ring (like a phone ring)
    const beepSequence = [
      { freq: 523.25, duration: 0.15 }, // C5
      { freq: 0, duration: 0.05 },        // pause
      { freq: 659.25, duration: 0.15 }, // E5
      { freq: 0, duration: 0.05 },        // pause
      { freq: 783.99, duration: 0.15 }, // G5
      { freq: 0, duration: 0.4 },         // long pause
    ]

    let time = this.audioCtx.currentTime
    beepSequence.forEach((note) => {
      if (note.freq > 0) {
        const osc = this.audioCtx!.createOscillator()
        const gain = this.audioCtx!.createGain()
        osc.connect(gain)
        gain.connect(this.audioCtx!.destination)
        osc.type = 'sine'
        osc.frequency.value = note.freq
        gain.gain.setValueAtTime(0.3, time)
        gain.gain.exponentialRampToValueAtTime(0.01, time + note.duration)
        osc.start(time)
        osc.stop(time + note.duration)
      }
      time += note.duration
    })

    // Repeat pattern every 1 second
    this.intervalId = window.setInterval(() => {
      if (!this.isPlaying || !this.audioCtx) return
      let t = this.audioCtx.currentTime
      beepSequence.forEach((note) => {
        if (note.freq > 0) {
          const osc = this.audioCtx!.createOscillator()
          const gain = this.audioCtx!.createGain()
          osc.connect(gain)
          gain.connect(this.audioCtx!.destination)
          osc.type = 'sine'
          osc.frequency.value = note.freq
          gain.gain.setValueAtTime(0.3, t)
          gain.gain.exponentialRampToValueAtTime(0.01, t + note.duration)
          osc.start(t)
          osc.stop(t + note.duration)
        }
        t += note.duration
      })
    }, 1000)
  }

  stop() {
    this.isPlaying = false
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {})
      this.audioCtx = null
    }
  }
}

export default function IncomingOrderNotification() {
  const {
    incomingOrder,
    showIncomingNotification,
    setShowIncomingNotification,
    setIncomingOrder,
    setAvailableOrders,
    setDriverOrders,
    driverOrders,
  } = useAppStore()

  const [counterPrice, setCounterPrice] = useState(0)
  const [countdown, setCountdown] = useState(30)
  const [accepting, setAccepting] = useState(false)
  const ringtoneRef = useRef<RingtoneEngine | null>(null)

  // Initialize counter price to proposed price
  useEffect(() => {
    if (incomingOrder) {
      const minPrice = incomingOrder.proposedPrice * 0.8
      const maxPrice = incomingOrder.proposedPrice * 1.5
      setCounterPrice(incomingOrder.proposedPrice)
    }
  }, [incomingOrder])

  // Countdown timer
  useEffect(() => {
    if (!showIncomingNotification) return
    setCountdown(30)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          dismissNotification()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [showIncomingNotification])

  // Ringtone
  useEffect(() => {
    if (showIncomingNotification) {
      ringtoneRef.current = new RingtoneEngine()
      ringtoneRef.current.start()
      // Vibration
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200, 100, 400])
      }
    } else {
      if (ringtoneRef.current) {
        ringtoneRef.current.stop()
        ringtoneRef.current = null
      }
      if ('vibrate' in navigator) {
        navigator.vibrate(0)
      }
    }
    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.stop()
        ringtoneRef.current = null
      }
    }
  }, [showIncomingNotification])

  const dismissNotification = useCallback(() => {
    setShowIncomingNotification(false)
    setIncomingOrder(null)
  }, [setShowIncomingNotification, setIncomingOrder])

  async function handleAccept() {
    if (!incomingOrder || accepting) return
    setAccepting(true)
    try {
      await apiFetch(`/api/orders/${incomingOrder.id}/accept`, {
        method: 'POST',
        body: JSON.stringify({ acceptedPrice: counterPrice }),
      })
      toast.success(counterPrice !== incomingOrder.proposedPrice
        ? `¡Contraoferta enviada! Tu precio: ${formatPrice(counterPrice)}`
        : '¡Pedido aceptado!'
      )
      dismissNotification()
      // Refresh orders
      const [availData, ordersData] = await Promise.all([
        apiFetch('/api/orders?type=available'),
        apiFetch('/api/orders'),
      ])
      setAvailableOrders(availData.orders)
      setDriverOrders(ordersData.orders)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al aceptar')
    } finally {
      setAccepting(false)
    }
  }

  async function handleCounterOffer() {
    if (!incomingOrder || accepting) return
    setAccepting(true)
    try {
      await apiFetch(`/api/orders/${incomingOrder.id}/accept`, {
        method: 'POST',
        body: JSON.stringify({ acceptedPrice: counterPrice }),
      })
      toast.success(`Contraoferta enviada: ${formatPrice(counterPrice)}`)
      dismissNotification()
      // Refresh orders
      const [availData, ordersData] = await Promise.all([
        apiFetch('/api/orders?type=available'),
        apiFetch('/api/orders'),
      ])
      setAvailableOrders(availData.orders)
      setDriverOrders(ordersData.orders)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al contraofertar')
    } finally {
      setAccepting(false)
    }
  }

  if (!showIncomingNotification || !incomingOrder) return null

  const minPrice = Math.floor(incomingOrder.proposedPrice * 0.8)
  const maxPrice = Math.ceil(incomingOrder.proposedPrice * 1.5)
  const sliderValue = ((counterPrice - minPrice) / (maxPrice - minPrice)) * 100

  return (
    <AnimatePresence>
      {showIncomingNotification && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
        >
          {/* Dark backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* Notification card */}
          <motion.div
            initial={{ scale: 0.8, y: 100, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative z-10 w-[90vw] max-w-md mx-auto"
          >
            <div className="bg-gradient-to-b from-[#F9FAFB] to-white rounded-3xl border border-gray-200 overflow-hidden">
              {/* Pulsing ring indicator */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-32 h-32 rounded-full bg-[#1DB954]/20 animate-ring-pulse flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-[#1DB954]/30 animate-ring-pulse flex items-center justify-center" style={{ animationDelay: '0.3s' }}>
                    <div className="w-16 h-16 rounded-full bg-[#1DB954]/40 flex items-center justify-center animate-call-shake">
                      <Phone className="h-8 w-8 text-[#1DB954]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Header */}
              <div className="pt-20 pb-4 px-6 text-center">
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <h2 className="text-xl font-bold text-gray-900 mb-1">¡NUEVO PEDIDO!</h2>
                </motion.div>
                <p className="text-[#1DB954] text-sm font-medium">Pedido #{incomingOrder.orderNumber}</p>

                {/* Countdown */}
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <Timer className="h-4 w-4 text-[#FFC145]" />
                  <div className="flex gap-1">
                    {[0, 1].map((d) => (
                      <span key={d} className={`text-lg font-mono font-bold ${
                        countdown <= 10 ? 'text-[#FF6B6B]' : 'text-gray-900'
                      }`}>
                        {String(Math.floor(countdown / 10)).charAt(d)}
                      </span>
                    ))}
                    <span className="text-gray-300">:</span>
                    {[0, 1].map((d) => (
                      <span key={d} className={`text-lg font-mono font-bold ${
                        countdown <= 10 ? 'text-[#FF6B6B]' : 'text-gray-900'
                      }`}>
                        {String(countdown % 10).charAt(d)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order details */}
              <div className="px-6 pb-4">
                <div className="bg-gray-50 backdrop-blur-sm rounded-2xl p-4 space-y-3 border border-gray-200">
                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">Precio propuesto</span>
                    <span className="text-2xl font-bold text-[#1DB954]">{formatPrice(incomingOrder.proposedPrice)}</span>
                  </div>

                  {/* Distance */}
                  {incomingOrder.distanceKm && (
                    <div className="flex items-center gap-2">
                      <Navigation className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-gray-400 text-xs">
                        {incomingOrder.distanceKm.toFixed(1)} km
                        {incomingOrder.estimatedTime && ` · ~${incomingOrder.estimatedTime} min`}
                      </span>
                    </div>
                  )}

                  {/* Route */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#1DB954] mt-1.5 shrink-0" />
                      <span className="text-gray-700 text-sm">{incomingOrder.originAddress}</span>
                    </div>
                    <div className="ml-1 border-l border-dashed border-gray-200 h-2" />
                    <div className="flex items-start gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#FFC145] mt-1.5 shrink-0" />
                      <span className="text-gray-700 text-sm">{incomingOrder.destAddress}</span>
                    </div>
                  </div>

                  {/* Cargo */}
                  <div className="flex flex-wrap gap-2">
                    {incomingOrder.cargoType && (
                      <span className="inline-flex items-center gap-1 bg-gray-100 text-[#1DB954] text-xs px-2.5 py-1 rounded-full">
                        <Package className="h-3 w-3" />
                        {incomingOrder.cargoType}
                      </span>
                    )}
                    {incomingOrder.cargoWeight && (
                      <span className="text-gray-400 text-xs px-2.5 py-1 bg-gray-100 rounded-full">
                        {incomingOrder.cargoWeight} kg
                      </span>
                    )}
                    {incomingOrder.cargoQuantity && (
                      <span className="text-gray-400 text-xs px-2.5 py-1 bg-gray-100 rounded-full">
                        {incomingOrder.cargoQuantity} uds
                      </span>
                    )}
                  </div>

                  {/* Store */}
                  {incomingOrder.store && (
                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                      <Truck className="h-3 w-3" />
                      <span>{incomingOrder.store.storeName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Counter-offer input + slider */}
              <div className="px-6 pb-3">
                <div className="bg-gray-50 backdrop-blur-sm rounded-xl p-3 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 text-xs">Tu contraoferta</span>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#1DB954]" />
                      <input
                        type="number"
                        min={minPrice}
                        max={maxPrice}
                        step="0.50"
                        value={counterPrice.toFixed(2)}
                        onChange={(e) => {
                          let val = parseFloat(e.target.value)
                          if (isNaN(val)) val = minPrice
                          val = Math.max(minPrice, Math.min(maxPrice, val))
                          setCounterPrice(val)
                        }}
                        className="w-28 bg-white border border-gray-200 rounded-lg pl-7 pr-2 py-1.5 text-[#1DB954] font-bold text-sm text-right focus:outline-none focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954]/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                  <Slider
                    value={[sliderValue]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(v) => {
                      const pct = v[0] / 100
                      const newPrice = Math.round((minPrice + pct * (maxPrice - minPrice)) * 100) / 100
                      setCounterPrice(newPrice)
                    }}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-300 text-xs">{formatPrice(minPrice)}</span>
                    <span className="text-gray-300 text-xs">{formatPrice(maxPrice)}</span>
                  </div>

                  {/* Comparison */}
                  {counterPrice !== incomingOrder.proposedPrice && (
                    <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-xs">Local propuso:</span>
                        <span className="text-gray-500 text-xs">{formatPrice(incomingOrder.proposedPrice)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#1DB954]/80 text-xs">Tu oferta:</span>
                        <span className={`text-xs font-semibold ${counterPrice < incomingOrder.proposedPrice ? 'text-[#FFC145]' : 'text-[#1DB954]'}`}>
                          {formatPrice(counterPrice)}
                          {counterPrice < incomingOrder.proposedPrice && ` (-${formatPrice(incomingOrder.proposedPrice - counterPrice)})`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="px-6 pb-6 flex gap-3">
                <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
                  <Button
                    onClick={dismissNotification}
                    className="w-full bg-[#FF6B6B] hover:bg-[#e55c5c] text-white font-semibold py-6 rounded-2xl text-base"
                    disabled={accepting}
                  >
                    <PhoneOff className="h-5 w-5 mr-2" />
                    Rechazar
                  </Button>
                </motion.div>

                <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
                  <Button
                    onClick={handleCounterOffer}
                    className="w-full bg-[#FFC145] hover:bg-[#e0ad3a] text-black font-semibold py-6 rounded-2xl text-base"
                    disabled={accepting || counterPrice === incomingOrder.proposedPrice}
                  >
                    <DollarSign className="h-5 w-5 mr-2" />
                    {accepting ? '...' : 'CONTRAOFERTAR'}
                  </Button>
                </motion.div>

                <motion.div whileTap={{ scale: 0.95 }} className="flex-1">
                  <Button
                    onClick={handleAccept}
                    className="w-full bg-[#1DB954] hover:bg-[#17a34a] text-black font-semibold py-6 rounded-2xl text-base animate-glow-pulse"
                    disabled={accepting}
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    {accepting ? '...' : 'ACEPTAR'}
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

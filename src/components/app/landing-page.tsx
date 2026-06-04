'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { motion } from 'framer-motion'
import {
  Truck, Shield, Zap, TrendingUp, ArrowRight, Package,
  Users, Trophy, Star, MapPin, Share2, Globe, Mail
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'

export default function LandingPage() {
  const { setCurrentView } = useAppStore()

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  const features = [
    {
      icon: <Shield className="h-8 w-8 text-emerald-600" />,
      title: 'Transporte Seguro',
      desc: 'Tus electrodomésticos protegidos en cada viaje. Conductores verificados y calificados.',
    },
    {
      icon: <Zap className="h-8 w-8 text-amber-500" />,
      title: 'Precio Justo',
      desc: 'Tú propones el precio. Los transportistas compiten por darte la mejor oferta.',
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-teal-600" />,
      title: 'En Tiempo Real',
      desc: 'Sigue el estado de tus pedidos al instante. Notificaciones en tiempo real.',
    },
  ]

  const howItWorks = [
    {
      step: 1,
      icon: <Package className="h-8 w-8 text-white" />,
      title: 'Publica tu Pedido',
      desc: 'Ingresa el origen, destino, tipo de carga y el precio que quieres pagar.',
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      step: 2,
      icon: <Users className="h-8 w-8 text-white" />,
      title: 'Conductores Compiten',
      desc: 'Transportistas cercanos reciben tu pedido y pueden aceptar o contraofertar.',
      color: 'from-amber-500 to-amber-600',
    },
    {
      step: 3,
      icon: <Trophy className="h-8 w-8 text-white" />,
      title: 'Mejor Precio Gana',
      desc: 'Elige la mejor oferta. Tu pedido se asigna y el transporte comienza.',
      color: 'from-teal-500 to-teal-600',
    },
  ]

  const vehicleTypes = [
    { name: 'Camioneta', desc: 'Ideal para cargas medianas', icon: '🚗' },
    { name: 'Doble Cabina', desc: 'Mayor capacidad de carga', icon: '🛻' },
    { name: 'Camión', desc: 'Para electrodomésticos grandes', icon: '🚛' },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative gradient-hero text-white overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-20 left-10 w-72 h-72 bg-emerald-300/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -25, 0], y: [0, 15, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-10 right-20 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ x: [0, 15, 0], y: [0, -30, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/2 left-1/3 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl"
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* App Icon */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/15 backdrop-blur-sm mb-8 shadow-xl border border-white/20"
            >
              <Image
                src="/icon-192.png"
                alt="ElectroTransport"
                width={64}
                height={64}
                className="rounded-xl"
              />
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              Electro<span className="text-emerald-300">Transport</span>
            </h1>
            <p className="text-lg sm:text-xl text-emerald-100 mb-3 max-w-2xl mx-auto">
              Transporte de electrodomésticos a tu medida
            </p>
            <p className="text-sm text-emerald-200/70 mb-10 max-w-lg mx-auto">
              Conectamos locales comerciales con transportistas confiables. Propón tu precio y elige al mejor conductor.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  className="bg-white text-emerald-800 hover:bg-emerald-50 font-semibold text-base px-8 py-6 shadow-xl shadow-black/10 hover:shadow-2xl transition-shadow"
                  onClick={() => setCurrentView('register')}
                >
                  Comenzar Ahora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 font-semibold text-base px-8 py-6 backdrop-blur-sm"
                  onClick={() => setCurrentView('login')}
                >
                  Iniciar Sesión
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 50L48 45C96 40 192 30 288 28C384 26 480 32 576 40C672 48 768 58 864 55C960 52 1056 36 1152 30C1248 24 1344 28 1392 30L1440 32V100H0V50Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm font-medium px-4 py-2 rounded-full mb-4">
              <Star className="h-4 w-4" /> Fácil y rápido
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3">
              ¿Cómo funciona?
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Tres simples pasos para transportar tus electrodomésticos
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden sm:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-emerald-300 via-amber-300 to-teal-300" />

            {howItWorks.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.6 }}
              >
                <Card className="border-none shadow-lg hover:shadow-xl transition-all text-center p-6 h-full group">
                  <CardContent className="p-4 pt-2 flex flex-col items-center">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                      {step.icon}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm mb-3">
                      {step.step}
                    </div>
                    <h3 className="font-semibold text-lg text-slate-800 mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 gradient-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3">
              ¿Por qué ElectroTransport?
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              La forma más eficiente de transportar tus electrodomésticos
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <Card className="glass-card border border-white/50 shadow-md hover:shadow-xl transition-all text-center p-6 h-full group">
                  <CardContent className="p-4 pt-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 mb-4 group-hover:scale-110 transition-transform shadow-sm">
                      {f.icon}
                    </div>
                    <h3 className="font-semibold text-lg text-slate-800 mb-2">{f.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vehicle Types Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <h2 className="text-3xl font-bold text-slate-800 mb-3">
              Tipos de Vehículos
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Diversas opciones para adaptarse a tu necesidad de transporte
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6">
            {vehicleTypes.map((v, i) => (
              <motion.div
                key={v.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <Card className="border border-slate-200 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all p-6 h-full group cursor-default">
                  <CardContent className="p-0 flex flex-col items-center">
                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{v.icon}</div>
                    <h3 className="font-semibold text-slate-800 mb-1">{v.name}</h3>
                    <p className="text-sm text-muted-foreground">{v.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Driver CTA Section */}
      <section className="py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-teal-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-emerald-200 text-sm font-medium px-4 py-2 rounded-full mb-6 border border-white/20">
              <Truck className="h-4 w-4" /> Conviértete en transportista
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              ¿Eres transportista?
            </h2>
            <p className="text-emerald-100/80 mb-8 max-w-lg mx-auto text-lg">
              Únete a nuestra red de conductores y comienza a ganar dinero transportando electrodomésticos. Recibe pedidos en tiempo real.
            </p>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="lg"
                className="bg-white text-emerald-800 hover:bg-emerald-50 font-semibold text-base px-8 py-6 shadow-xl hover:shadow-2xl transition-shadow"
                onClick={() => setCurrentView('register')}
              >
                Registrarse como Transportista
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/icon-192.png"
                  alt="ElectroTransport"
                  width={40}
                  height={40}
                  className="rounded-xl"
                />
                <div>
                  <h3 className="font-bold text-lg">ElectroTransport</h3>
                  <p className="text-sm text-slate-400">Transporte inteligente</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                La plataforma líder en transporte de electrodomésticos. Conectamos comercios con transportistas de confianza.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-emerald-400 mb-4">Plataforma</h4>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => setCurrentView('register')} className="text-slate-400 hover:text-white text-sm transition-colors">
                    Registrarse
                  </button>
                </li>
                <li>
                  <button onClick={() => setCurrentView('login')} className="text-slate-400 hover:text-white text-sm transition-colors">
                    Iniciar Sesión
                  </button>
                </li>
                <li>
                  <span className="text-slate-400 text-sm">Términos de Servicio</span>
                </li>
                <li>
                  <span className="text-slate-400 text-sm">Política de Privacidad</span>
                </li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-emerald-400 mb-4">Síguenos</h4>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 rounded-xl bg-white/10 hover:bg-emerald-600 flex items-center justify-center transition-colors">
                  <Share2 className="h-5 w-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-white/10 hover:bg-emerald-600 flex items-center justify-center transition-colors">
                  <Globe className="h-5 w-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-white/10 hover:bg-emerald-600 flex items-center justify-center transition-colors">
                  <Mail className="h-5 w-5" />
                </a>
              </div>
              <div className="mt-4 flex items-center gap-2 text-slate-400 text-sm">
                <MapPin className="h-4 w-4" />
                <span>Santa Cruz de la Sierra, Bolivia</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} ElectroTransport. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Hecho con</span>
              <span className="text-emerald-500">❤️</span>
              <span className="text-xs text-slate-500">en Bolivia</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

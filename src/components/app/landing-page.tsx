'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { motion } from 'framer-motion'
import {
  Truck, Zap, TrendingUp, ArrowRight, Package,
  Users, Trophy, MapPin, Share2, Globe, Mail, Shield
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
      icon: <Shield className="h-7 w-7" />,
      title: 'Transporte Seguro',
      desc: 'Tus electrodomésticos protegidos en cada viaje. Conductores verificados y calificados para tu tranquilidad.',
    },
    {
      icon: <Zap className="h-7 w-7" />,
      title: 'Precio Justo',
      desc: 'Tú propones el precio. Los transportistas compiten por darte la mejor oferta del mercado.',
    },
    {
      icon: <TrendingUp className="h-7 w-7" />,
      title: 'En Tiempo Real',
      desc: 'Sigue el estado de tus pedidos al instante con notificaciones y seguimiento en vivo.',
    },
  ]

  const howItWorks = [
    {
      step: 1,
      icon: <Package className="h-6 w-6" />,
      title: 'Publica tu Pedido',
      desc: 'Ingresa origen, destino, tipo de carga y el precio que quieres pagar.',
    },
    {
      step: 2,
      icon: <Users className="h-6 w-6" />,
      title: 'Recibe Ofertas',
      desc: 'Transportistas cercanos reciben tu pedido y hacen sus mejores ofertas.',
    },
    {
      step: 3,
      icon: <Trophy className="h-6 w-6" />,
      title: 'Elige al Mejor',
      desc: 'Compara y elige la mejor oferta. El transporte comienza de inmediato.',
    },
  ]

  const vehicleTypes = [
    { name: 'Camioneta', desc: 'Cargas medianas', icon: '🚗' },
    { name: 'Doble Cabina', desc: 'Mayor capacidad', icon: '🛻' },
    { name: 'Camión', desc: 'Grandes volúmenes', icon: '🚛' },
  ]

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center pb-8">
        {/* Subtle ambient background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#1DB954] rounded-full blur-[200px] opacity-[0.03]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#00C9A7] rounded-full blur-[180px] opacity-[0.03]" />
        </div>
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        <div className="relative max-w-5xl mx-auto px-5 py-12 sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            {/* App Icon */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#F9FAFB] border border-gray-200 mb-8 glow-primary"
            >
              <Image
                src="/icon-192.png"
                alt="ElectroTransport"
                width={48}
                height={48}
                className="rounded-lg"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.8 }}
            >
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-5 text-gray-900">
                Electro<span className="text-[#1DB954]">Transport</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-500 mb-4 max-w-xl mx-auto font-light leading-relaxed">
                Transporte de electrodomésticos a tu medida
              </p>
              <p className="text-sm text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                Conectamos locales comerciales con transportistas confiables. Propón tu precio y elige al mejor conductor.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  className="bg-[#1DB954] hover:bg-[#17a34a] text-black font-semibold text-base px-8 sm:px-10 py-4 sm:py-6 rounded-xl shadow-[0_0_30px_rgba(29,185,84,0.2)] hover:shadow-[0_0_40px_rgba(29,185,84,0.3)] transition-all duration-300"
                  onClick={() => setCurrentView('register')}
                >
                  Comenzar Ahora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-gray-200 text-gray-600 hover:bg-[#F3F4F6] hover:text-gray-900 font-medium text-base px-8 sm:px-10 py-4 sm:py-6 rounded-xl transition-all duration-300"
                  onClick={() => setCurrentView('login')}
                >
                  Iniciar Sesión
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 sm:py-28 bg-[#F5F5F5]">
        <div className="max-w-5xl mx-auto px-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-[#1DB954] text-sm font-semibold tracking-wider uppercase mb-3">Cómo funciona</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Tres simples pasos
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Transportar tus electrodomésticos nunca fue tan fácil
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6 relative">
            {/* Connecting line */}
            <div className="hidden sm:block absolute top-12 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-[#1DB954]/30 to-transparent" />

            {howItWorks.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
              >
                <Card className="bg-white border-gray-200 hover:border-[#1DB954]/20 transition-all duration-300 p-6 h-full group">
                  <CardContent className="p-0 pt-0 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-[#1DB954]/10 text-[#1DB954] flex items-center justify-center mb-5 group-hover:bg-[#1DB954]/20 transition-colors">
                      {step.icon}
                    </div>
                    <div className="w-6 h-6 rounded-full bg-[#1DB954] text-black flex items-center justify-center font-bold text-xs mb-4">
                      {step.step}
                    </div>
                    <h3 className="font-semibold text-base text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed text-center">{step.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28 bg-[#EEEEEE]">
        <div className="max-w-5xl mx-auto px-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-[#1DB954] text-sm font-semibold tracking-wider uppercase mb-3">Ventajas</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              ¿Por qué ElectroTransport?
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
              >
                <Card className="glass-card p-6 h-full group hover:border-[#1DB954]/15 transition-all duration-300">
                  <CardContent className="p-0">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#1DB954]/10 text-[#1DB954] mb-4 group-hover:bg-[#1DB954]/20 transition-colors">
                      {f.icon}
                    </div>
                    <h3 className="font-semibold text-base text-gray-900 mb-2">{f.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vehicle Types */}
      <section className="py-20 sm:py-24 bg-[#F5F5F5]">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <p className="text-[#1DB954] text-sm font-semibold tracking-wider uppercase mb-3">Flota</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Tipos de Vehículos
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Diversas opciones para cada necesidad de transporte
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-5">
            {vehicleTypes.map((v, i) => (
              <motion.div
                key={v.name}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
              >
                <Card className="bg-white border-gray-200 hover:border-[#1DB954]/20 transition-all duration-300 p-5 h-full group cursor-default">
                  <CardContent className="p-0 flex flex-col items-center">
                    <div className="text-4xl mb-3">{v.icon}</div>
                    <h3 className="font-semibold text-gray-900 mb-1 text-sm">{v.name}</h3>
                    <p className="text-xs text-gray-500">{v.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Driver CTA */}
      <section className="py-20 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F5F5F5] via-[#E8F5E9] to-[#F5F5F5]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#1DB954] rounded-full blur-[250px] opacity-[0.04]" />

        <div className="relative max-w-3xl mx-auto px-5 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-[#1DB954] text-sm font-semibold tracking-wider uppercase mb-4">Conductores</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              ¿Eres transportista?
            </h2>
            <p className="text-gray-500 mb-10 max-w-lg mx-auto leading-relaxed">
              Únete a nuestra red de conductores y comienza a ganar dinero transportando electrodomésticos. Recibe pedidos en tiempo real.
            </p>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="lg"
                className="bg-[#1DB954] hover:bg-[#17a34a] text-black font-semibold text-base px-8 sm:px-10 py-4 sm:py-6 rounded-xl shadow-[0_0_30px_rgba(29,185,84,0.2)] hover:shadow-[0_0_40px_rgba(29,185,84,0.3)] transition-all duration-300"
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
      <footer className="bg-[#FAFAFA] border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-5 py-12">
          <div className="grid sm:grid-cols-3 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image src="/icon-192.png" alt="ElectroTransport" width={32} height={32} className="rounded-lg" />
                <div>
                  <h3 className="font-bold text-gray-900 text-base">ElectroTransport</h3>
                  <p className="text-xs text-gray-500">Transporte inteligente</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                La plataforma líder en transporte de electrodomésticos.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-xs uppercase tracking-widest text-[#1DB954] mb-4">Plataforma</h4>
              <ul className="space-y-2.5">
                <li><button onClick={() => setCurrentView('register')} className="text-gray-500 hover:text-gray-900 text-sm transition-colors">Registrarse</button></li>
                <li><button onClick={() => setCurrentView('login')} className="text-gray-500 hover:text-gray-900 text-sm transition-colors">Iniciar Sesión</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-xs uppercase tracking-widest text-[#1DB954] mb-4">Contacto</h4>
              <div className="flex gap-3 mb-4">
                <a href="#" className="w-9 h-9 rounded-lg bg-[#F9FAFB] hover:bg-[#1DB954] hover:text-black flex items-center justify-center transition-all text-gray-500">
                  <Share2 className="h-4 w-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-lg bg-[#F9FAFB] hover:bg-[#1DB954] hover:text-black flex items-center justify-center transition-all text-gray-500">
                  <Globe className="h-4 w-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-lg bg-[#F9FAFB] hover:bg-[#1DB954] hover:text-black flex items-center justify-center transition-all text-gray-500">
                  <Mail className="h-4 w-4" />
                </a>
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <MapPin className="h-3.5 w-3.5" />
                <span>Quito, Ecuador</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-gray-400 text-xs">
              © {new Date().getFullYear()} ElectroTransport. Todos los derechos reservados.
            </p>
            <p className="text-[10px] text-gray-400">v3.0.0</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

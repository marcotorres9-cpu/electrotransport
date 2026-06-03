import { useEffect } from 'react'
import { useAppStore } from '@/store/use-app-store'
import { motion } from 'framer-motion'
import { Truck, Shield, Zap, TrendingUp, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

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
      desc: 'Tus electrodomésticos protegidos en cada viaje.',
    },
    {
      icon: <Zap className="h-8 w-8 text-amber-500" />,
      title: 'Precio Justo',
      desc: 'Tú propones el precio, los transportistas compiten.',
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-teal-600" />,
      title: 'En Tiempo Real',
      desc: 'Sigue el estado de tus pedidos al instante.',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative gradient-hero text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-teal-300 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm mb-8"
            >
              <Truck className="h-10 w-10 text-emerald-300" />
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
                  className="bg-white text-emerald-800 hover:bg-emerald-50 font-semibold text-base px-8 py-6 shadow-lg"
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
                  className="border-white/30 text-white hover:bg-white/10 font-semibold text-base px-8 py-6"
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

      {/* Features Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-slate-800 mb-3">
              ¿Por qué ElectroTransport?
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              La forma más eficiente de transportar tus electrodomésticos
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <Card className="border-none shadow-md hover:shadow-lg transition-shadow text-center p-6 h-full">
                  <CardContent className="p-4 pt-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-emerald-50 mb-4">
                      {f.icon}
                    </div>
                    <h3 className="font-semibold text-lg text-slate-800 mb-2">{f.title}</h3>
                    <p className="text-muted-foreground text-sm">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 gradient-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4">
            ¿Eres transportista?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Únete a nuestra red de conductores y comienza a ganar dinero transportando electrodomésticos.
          </p>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              size="lg"
              className="gradient-primary text-white font-semibold text-base px-8 py-6 shadow-lg hover:shadow-xl transition-shadow"
              onClick={() => setCurrentView('register')}
            >
              Registrarse como Transportista
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Truck className="h-5 w-5 text-emerald-400" />
            <span className="font-semibold text-lg">ElectroTransport</span>
          </div>
          <p className="text-slate-400 text-sm">
            © 2024 ElectroTransport. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}

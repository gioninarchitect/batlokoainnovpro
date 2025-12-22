import { Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button, Badge } from '@ui'

// Lazy load 3D scene for performance
const IndustrialScene = lazy(() => import('@3d/IndustrialScene'))

// Loading fallback for 3D scene
function SceneLoader() {
  return (
    <div className="absolute inset-0 bg-navy flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-safety border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={<SceneLoader />}>
          <IndustrialScene />
        </Suspense>
      </div>

      {/* Gradient Overlay - reduced to show 3D more prominently */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-navy/80 via-navy/50 to-transparent" />

      {/* Content */}
      <div className="relative z-20 container-custom py-32 md:py-40">
        <div className="max-w-2xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="gold" className="mb-6">
              100% Black-Women-Owned | Level 1 BBB-EE
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-heading text-display text-white mb-6 text-balance"
          >
            Engineering Excellence for{' '}
            <span className="text-safety">South Africa's</span>{' '}
            Industries
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-body-lg text-gray-300 mb-8 max-w-lg"
          >
            Your trusted partner for mining, construction & engineering supplies.
            Quality products delivered right to your doorstep.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-4"
          >
            <Button to="/services" size="lg">
              Explore Products
              <ArrowRight size={20} />
            </Button>
            <Button to="/contact" variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-navy">
              Get Quote
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <div className="flex flex-col items-center gap-2 text-white/60">
          <span className="text-sm font-medium">Scroll to explore</span>
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-white rounded-full"
            />
          </div>
        </div>
      </motion.div>
    </section>
  )
}

export default Hero

import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Badge } from '@ui'

const stats = [
  { label: 'Established', value: 2022, suffix: '', isYear: true },
  { label: 'Mining Engineers', value: 3, suffix: '+', isYear: false },
  { label: 'BBB-EE Level', value: 1, suffix: '', isYear: false },
  { label: 'Black-Women-Owned', value: 100, suffix: '%', isYear: false }
]

function AnimatedCounter({ value, suffix, isYear, isInView }) {
  const [count, setCount] = useState(isYear ? 2020 : 0)

  useEffect(() => {
    if (!isInView) return

    const duration = 2000
    const steps = 60
    const increment = (value - (isYear ? 2020 : 0)) / steps
    let current = isYear ? 2020 : 0
    let step = 0

    const timer = setInterval(() => {
      step++
      current += increment
      setCount(Math.round(current))

      if (step >= steps) {
        setCount(value)
        clearInterval(timer)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value, isYear, isInView])

  return (
    <span className="font-display text-4xl md:text-5xl font-bold text-safety">
      {count}{suffix}
    </span>
  )
}

function CompanyOverview() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="section-padding bg-navy text-white overflow-hidden">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="gold" className="mb-6">About Us</Badge>

            <h2 className="font-heading text-h2 mb-6">
              Powering South Africa's{' '}
              <span className="text-safety">Industrial Growth</span>
            </h2>

            <p className="text-gray-300 text-body-lg mb-6">
              Batlokoa Innovative Projects (Pty) Ltd is a 100% Black-Women-Owned,
              Level 1 BBB-EE Company offering comprehensive mining, engineering,
              and technical project management services.
            </p>

            <p className="text-gray-400 mb-8">
              Established in 2022 and based in Gauteng, we work with mining engineers
              who have a vast network in most major mining houses across South Africa.
              The company represents the power, visions, and aims of professional women
              in the mining and engineering sector.
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  className="text-center md:text-left"
                >
                  <AnimatedCounter
                    value={stat.value}
                    suffix={stat.suffix}
                    isYear={stat.isYear}
                    isInView={isInView}
                  />
                  <p className="text-gray-400 text-sm mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Visual */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Abstract SA Map Representation */}
            <div className="relative aspect-square max-w-md mx-auto">
              {/* Decorative circles */}
              <div className="absolute inset-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-safety/20 rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-industrial/30 rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-gold/40 rounded-full" />
              </div>

              {/* Location marker */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                  <div className="w-4 h-4 bg-safety rounded-full animate-ping absolute" />
                  <div className="w-4 h-4 bg-safety rounded-full relative z-10" />
                </div>
                <div className="mt-3 text-center">
                  <p className="text-safety font-semibold text-sm">Randfontein</p>
                  <p className="text-gray-400 text-xs">Gauteng</p>
                </div>
              </div>

              {/* Connection lines to mining hubs */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#e94560" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#d4af37" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                {/* Lines to mining regions */}
                <line x1="200" y1="200" x2="280" y2="120" stroke="url(#lineGradient)" strokeWidth="1" strokeDasharray="4 4">
                  <animate attributeName="stroke-dashoffset" from="0" to="8" dur="1s" repeatCount="indefinite" />
                </line>
                <line x1="200" y1="200" x2="320" y2="220" stroke="url(#lineGradient)" strokeWidth="1" strokeDasharray="4 4">
                  <animate attributeName="stroke-dashoffset" from="0" to="8" dur="1s" repeatCount="indefinite" />
                </line>
                <line x1="200" y1="200" x2="140" y2="280" stroke="url(#lineGradient)" strokeWidth="1" strokeDasharray="4 4">
                  <animate attributeName="stroke-dashoffset" from="0" to="8" dur="1s" repeatCount="indefinite" />
                </line>
              </svg>

              {/* Mining hub markers */}
              <div className="absolute top-[30%] right-[20%]">
                <div className="w-2 h-2 bg-gold rounded-full" />
                <p className="text-gold text-xs mt-1">Johannesburg</p>
              </div>
              <div className="absolute top-[55%] right-[15%]">
                <div className="w-2 h-2 bg-gold rounded-full" />
                <p className="text-gold text-xs mt-1">Rustenburg</p>
              </div>
              <div className="absolute bottom-[25%] left-[30%]">
                <div className="w-2 h-2 bg-gold rounded-full" />
                <p className="text-gold text-xs mt-1">Welkom</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default CompanyOverview

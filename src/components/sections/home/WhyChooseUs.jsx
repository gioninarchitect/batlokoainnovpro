import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Diamond, LayoutGrid, Tag, Handshake } from 'lucide-react'
import mechanicalBg from '@/assets/images/products/mechanical.jpg'

const features = [
  {
    icon: Diamond,
    title: 'Unmatched Quality',
    description: 'Products crafted from the finest materials with rigorous quality control checks for long-term reliability.'
  },
  {
    icon: LayoutGrid,
    title: 'Comprehensive Range',
    description: 'From bolts to electrical supplies and PPE - your one-stop shop for all engineering solutions.'
  },
  {
    icon: Tag,
    title: 'Competitive Pricing',
    description: 'Cost-effective solutions for bulk orders without compromising on quality. Ideal for wholesalers.'
  },
  {
    icon: Handshake,
    title: 'Customer-Centric',
    description: 'Exceptional service from consultation to after-sales support. Building long-lasting relationships.'
  }
]

function FeatureCard({ feature, index }) {
  const Icon = feature.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group"
    >
      <div className="bg-white rounded-2xl p-8 h-full border border-gray-100 hover:border-safety/20 hover:shadow-card-hover transition-all duration-300">
        {/* Icon */}
        <div className="w-14 h-14 bg-gradient-to-br from-industrial to-safety rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
          <Icon size={28} className="text-white" />
        </div>

        {/* Content */}
        <h3 className="font-heading text-h4 text-navy mb-3">
          {feature.title}
        </h3>
        <p className="text-gray-600">
          {feature.description}
        </p>
      </div>
    </motion.div>
  )
}

function WhyChooseUs() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="section-padding relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={mechanicalBg}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-white/95" />
      </div>

      <div className="container-custom relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-h2 text-navy mb-4">
            Why Choose Us
          </h2>
          <p className="text-body-lg text-gray-600 max-w-2xl mx-auto">
            Experience the difference that quality, expertise, and dedication can make for your projects.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default WhyChooseUs

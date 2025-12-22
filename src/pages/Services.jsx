import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { ArrowRight, Phone, Wrench, Zap, Cog, HardHat, Cylinder, GitBranch, ScrollText, CircleDot, Factory, Plus, Eye } from 'lucide-react'
import { Button, Card, Badge, ServiceDetailModal } from '@ui'
import { products } from '@data/products'
import { useQuoteCart } from '@/context/QuoteCartContext'
import steelPipesBg from '@/assets/images/products/steel-pipes.jpg'

const iconMap = {
  'bolt': CircleDot,
  'scroll': ScrollText,
  'cylinder': Cylinder,
  'git-branch': GitBranch,
  'wrench': Wrench,
  'zap': Zap,
  'cog': Cog,
  'hard-hat': HardHat
}

function ServiceCard({ service, index, onViewDetails, onAddToQuote }) {
  const Icon = iconMap[service.icon] || Cog
  const { items } = useQuoteCart()
  const isInCart = items.some(item => item.id === service.id)

  return (
    <motion.div
      id={service.slug}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="h-full flex flex-col">
        {/* Image */}
        {service.image && (
          <div
            className="h-40 -mx-6 -mt-6 mb-4 overflow-hidden cursor-pointer group"
            onClick={() => onViewDetails(service)}
          >
            <img
              src={service.image}
              alt={service.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}

        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-industrial to-safety rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon size={28} className="text-white" />
          </div>
          <div>
            <h3 className="font-heading text-h4 text-navy">{service.title}</h3>
          </div>
        </div>

        <p className="text-gray-600 mb-4">{service.description}</p>

        <div className="border-t border-gray-100 pt-4 mt-auto">
          <h4 className="text-sm font-semibold text-navy mb-2">Key Features:</h4>
          <ul className="space-y-1.5">
            {service.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-1.5 h-1.5 bg-safety rounded-full" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={() => onViewDetails(service)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
          >
            <Eye size={16} />
            View Details
          </button>
          <button
            onClick={() => onAddToQuote(service)}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              isInCart
                ? 'bg-green-500 text-white'
                : 'bg-safety text-white hover:bg-safety-dark'
            }`}
          >
            <Plus size={16} />
            {isInCart ? 'Added' : 'Add to Quote'}
          </button>
        </div>
      </Card>
    </motion.div>
  )
}

function Services() {
  const [selectedService, setSelectedService] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { addItem, openCart } = useQuoteCart()

  const handleViewDetails = (service) => {
    setSelectedService(service)
    setIsModalOpen(true)
  }

  const handleAddToQuote = (service) => {
    addItem(service, 1)
    // Show brief feedback then open cart
    setTimeout(() => openCart(), 300)
  }

  const handleRequestQuote = (service) => {
    addItem(service, 1)
    setIsModalOpen(false)
    openCart()
  }

  return (
    <>
      <Helmet>
        <title>Our Services | Batlokoa Innovative Projects</title>
        <meta name="description" content="Comprehensive engineering solutions including bolts & nuts, steel pipes, electrical supplies, mechanical engineering, and PPE products." />
        <link rel="canonical" href="https://batlokoainnovpro.co.za/services" />
      </Helmet>

      {/* Service Detail Modal */}
      <ServiceDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        service={selectedService}
        onRequestQuote={handleRequestQuote}
      />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-navy to-deepblue">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center text-white"
          >
            <Badge variant="gold" className="mb-4">Our Services</Badge>
            <h1 className="font-heading text-h1 mb-4">
              Comprehensive Engineering Solutions
            </h1>
            <p className="text-gray-300 text-body-lg max-w-2xl mx-auto">
              Choose Batlokoa Innovative Projects for all your engineering solutions
              and supplies. Experience the difference that quality and expertise make.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section-padding relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img src={steelPipesBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gray-50/80" />
        </div>
        <div className="container-custom relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((service, index) => (
              <ServiceCard
                key={service.id}
                service={service}
                index={index}
                onViewDetails={handleViewDetails}
                onAddToQuote={handleAddToQuote}
              />
            ))}

            {/* Additional Service: Processing Plants */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <Card className="h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-industrial to-safety rounded-xl flex items-center justify-center flex-shrink-0">
                    <Factory size={28} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-heading text-h4 text-navy">Processing Plants & Smelters</h3>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">
                  Complete supplies for processing plants and smelters. Industrial-grade equipment and materials.
                </p>

                <div className="border-t border-gray-100 pt-4 mt-auto">
                  <h4 className="text-sm font-semibold text-navy mb-2">Key Features:</h4>
                  <ul className="space-y-1.5">
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 bg-safety rounded-full" />
                      Industrial equipment
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 bg-safety rounded-full" />
                      Smelter materials
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 bg-safety rounded-full" />
                      Processing supplies
                    </li>
                  </ul>
                </div>

                <Button to="/contact" variant="outline" size="sm" className="mt-6 w-full">
                  Request Quote
                  <ArrowRight size={16} />
                </Button>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-navy">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-white text-center lg:text-left">
              <h2 className="font-heading text-h2 mb-2">Talk to a Consultant Today</h2>
              <p className="text-gray-300">
                Our experts are ready to help you find the right solutions for your project.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <a
                href="tel:0739748317"
                className="inline-flex items-center gap-2 bg-white text-navy px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                <Phone size={20} />
                073 974 8317
              </a>
              <Button to="/contact">
                Schedule Consultation
                <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Services

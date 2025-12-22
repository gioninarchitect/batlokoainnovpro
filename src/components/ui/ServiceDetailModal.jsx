import { Suspense, lazy, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Phone, MessageCircle } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'
import Badge from './Badge'

// Lazy load 3D model
const ProductModel = lazy(() => import('@3d/ProductModels'))

function ServiceDetailModal({ isOpen, onClose, service, onRequestQuote }) {
  const [activeTab, setActiveTab] = useState('overview')

  if (!service) return null

  const whatsappNumber = '27739748317'
  const whatsappMessage = encodeURIComponent(`Hi, I'm interested in ${service.title}. Can you provide more information?`)
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* Left: 3D Model and Image */}
        <div className="bg-gradient-to-br from-navy to-industrial p-8 flex flex-col">
          {/* 3D Model */}
          <div className="h-64 lg:h-80 rounded-xl overflow-hidden bg-navy/50 mb-4">
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-safety border-t-transparent rounded-full animate-spin" />
              </div>
            }>
              <ProductModel slug={service.slug} className="w-full h-full" />
            </Suspense>
          </div>

          {/* Product Image */}
          {service.image && (
            <div className="rounded-xl overflow-hidden">
              <img
                src={service.image}
                alt={service.title}
                className="w-full h-40 object-cover"
              />
            </div>
          )}
        </div>

        {/* Right: Content */}
        <div className="p-8">
          {/* Header */}
          <Badge variant="gold" className="mb-3">Product Category</Badge>
          <h2 className="font-heading text-h2 text-navy mb-2">{service.title}</h2>
          <p className="text-gray-600 mb-6">{service.description}</p>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-100">
            {['overview', 'features', 'specs'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'text-safety border-safety'
                    : 'text-gray-500 border-transparent hover:text-navy'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[200px]">
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <p className="text-gray-600">
                  At Batlokoa Innovative Projects, we provide high-quality {service.title.toLowerCase()}
                  for mining, construction, and industrial applications. Our products undergo rigorous
                  quality control to ensure reliability and performance.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-500">Availability</p>
                    <p className="font-semibold text-navy">In Stock</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-500">Lead Time</p>
                    <p className="font-semibold text-navy">1-3 Days</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'features' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ul className="space-y-3">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-1 w-5 h-5 bg-safety/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check size={12} className="text-safety" />
                      </span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-3">
                    <span className="mt-1 w-5 h-5 bg-safety/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check size={12} className="text-safety" />
                    </span>
                    <span className="text-gray-700">Bulk pricing available</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 w-5 h-5 bg-safety/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check size={12} className="text-safety" />
                    </span>
                    <span className="text-gray-700">Delivery to your doorstep</span>
                  </li>
                </ul>
              </motion.div>
            )}

            {activeTab === 'specs' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Category</span>
                  <span className="font-medium text-navy">{service.title}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Quality Grade</span>
                  <span className="font-medium text-navy">Industrial Grade</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Certification</span>
                  <span className="font-medium text-navy">ISO Compliant</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Min. Order</span>
                  <span className="font-medium text-navy">Contact for details</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-100">
            <Button onClick={() => onRequestQuote(service)} className="flex-1">
              Request Quote
              <ArrowRight size={18} />
            </Button>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
            >
              <MessageCircle size={18} />
              WhatsApp
            </a>
            <a
              href="tel:0739748317"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-100 text-navy px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              <Phone size={18} />
              Call Now
            </a>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ServiceDetailModal

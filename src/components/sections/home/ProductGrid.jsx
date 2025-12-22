import { useRef, useState, Suspense, lazy } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Wrench, Zap, Cog, HardHat, Cylinder, GitBranch, ScrollText, CircleDot, Plus } from 'lucide-react'
import { Card } from '@ui'
import { products } from '@data/products'
import { useQuoteCart } from '@/context/QuoteCartContext'

// Lazy load 3D models for performance
const ProductModel = lazy(() => import('@3d/ProductModels'))

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

function ProductCard({ product, index }) {
  const Icon = iconMap[product.icon] || Cog
  const [isHovered, setIsHovered] = useState(false)
  const { addItem, items, openCart } = useQuoteCart()
  const isInCart = items.some(item => item.id === product.id)

  const handleAddToQuote = (e) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product, 1)
    setTimeout(() => openCart(), 300)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/services#${product.slug}`}>
        <Card className="group h-full overflow-hidden">
          {/* 3D Model / Icon Container */}
          <div className="relative w-full h-32 mb-4 rounded-xl overflow-hidden bg-gradient-to-br from-navy/5 to-industrial/10">
            {/* Default Icon - fades out on hover */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ opacity: isHovered ? 0 : 1, scale: isHovered ? 0.8 : 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-16 h-16 bg-industrial/10 rounded-xl flex items-center justify-center group-hover:bg-safety/10 transition-colors duration-300">
                <Icon size={32} className="text-industrial group-hover:text-safety transition-colors duration-300" />
              </div>
            </motion.div>

            {/* 3D Model - fades in on hover */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  className="absolute inset-0"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <Suspense fallback={
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-safety border-t-transparent rounded-full animate-spin" />
                    </div>
                  }>
                    <ProductModel slug={product.slug} className="w-full h-full" />
                  </Suspense>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Content */}
          <h3 className="font-heading text-h4 text-navy mb-2 group-hover:text-safety transition-colors duration-300">
            {product.title}
          </h3>

          <p className="text-gray-600 text-body-sm mb-4 line-clamp-2">
            {product.description}
          </p>

          {/* Features */}
          <ul className="space-y-1 mb-4">
            {product.features.slice(0, 3).map((feature, i) => (
              <li key={i} className="text-caption text-gray-500 flex items-center gap-2">
                <span className="w-1 h-1 bg-safety rounded-full" />
                {feature}
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-industrial font-semibold text-sm group-hover:text-safety transition-colors duration-300">
              <span>Learn More</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
            </div>
            <button
              onClick={handleAddToQuote}
              className={`p-2 rounded-lg transition-colors ${
                isInCart
                  ? 'bg-green-500 text-white'
                  : 'bg-safety/10 text-safety hover:bg-safety hover:text-white'
              }`}
              title="Add to Quote"
            >
              <Plus size={18} />
            </button>
          </div>
        </Card>
      </Link>
    </motion.div>
  )
}

function ProductGrid() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="section-padding bg-gray-50">
      <div className="container-custom">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-h2 text-navy mb-4">
            Our Product Categories
          </h2>
          <p className="text-body-lg text-gray-600 max-w-2xl mx-auto">
            Comprehensive engineering solutions for mining, construction, and industrial sectors.
          </p>
        </motion.div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default ProductGrid

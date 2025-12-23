/**
 * QuoteEngine - Pricing and quote generation engine
 * Handles bulk discounts, delivery calculations, and VAT
 *
 * Features:
 * - Tiered bulk discounts
 * - BBB-EE client benefits
 * - Location-based delivery pricing
 * - South African logistics buffer
 */

import { PrismaClient } from '@prisma/client'
import productEngine from './ProductEngine.js'

const prisma = new PrismaClient()

// VAT rate in South Africa
const VAT_RATE = 0.15

// Default bulk discount tiers (can be overridden per product)
const DEFAULT_BULK_DISCOUNTS = [
  { min: 100, discount: 0.10 },   // 10% off for 100+
  { min: 500, discount: 0.15 },   // 15% off for 500+
  { min: 1000, discount: 0.20 }   // 20% off for 1000+
]

// BBB-EE client discount
const BBBEE_CLIENT_DISCOUNT = 0.02  // Additional 2% for BBB-EE clients

// Delivery pricing by location (base + per kg)
const DELIVERY_RATES = {
  // Gauteng (local)
  gauteng: { baseCost: 150, perKg: 2, days: 2 },
  johannesburg: { baseCost: 150, perKg: 2, days: 2 },
  pretoria: { baseCost: 180, perKg: 2.5, days: 2 },
  randfontein: { baseCost: 100, perKg: 1.5, days: 1 },

  // Other provinces
  'western cape': { baseCost: 450, perKg: 5, days: 4 },
  'cape town': { baseCost: 450, perKg: 5, days: 4 },
  'kwazulu-natal': { baseCost: 350, perKg: 4, days: 3 },
  durban: { baseCost: 350, perKg: 4, days: 3 },
  mpumalanga: { baseCost: 280, perKg: 3.5, days: 3 },
  limpopo: { baseCost: 350, perKg: 4, days: 4 },
  'north west': { baseCost: 250, perKg: 3, days: 3 },
  'free state': { baseCost: 300, perKg: 3.5, days: 3 },
  'eastern cape': { baseCost: 400, perKg: 4.5, days: 4 },
  'northern cape': { baseCost: 450, perKg: 5, days: 5 },

  // Default for unknown locations
  default: { baseCost: 400, perKg: 4, days: 5 }
}

// SA logistics buffer (accounts for load shedding, traffic, etc.)
const LOGISTICS_BUFFER = 1.2  // 20% extra time

class QuoteEngine {
  constructor() {
    this.isInitialized = false
  }

  /**
   * Initialize the quote engine
   * @returns {Promise<void>}
   */
  async initialize() {
    this.isInitialized = true
    console.log('QuoteEngine initialized')
  }

  /**
   * Calculate price for a single product
   * @param {string} productId - Product ID
   * @param {number} quantity - Quantity
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Pricing breakdown
   */
  async calculatePrice(productId, quantity, options = {}) {
    const {
      location = null,
      isBBBEEClient = false,
      includeDelivery = true,
      estimatedWeight = null
    } = options

    try {
      // Get product details
      const product = await productEngine.getProductById(productId)

      if (!product) {
        return { success: false, error: 'Product not found' }
      }

      // Calculate base pricing
      let unitPrice = product.price
      let discountApplied = 0
      let discountReason = null

      // Apply bulk discount
      if (quantity >= 100) {
        const bulkDiscount = this.getBulkDiscount(product, quantity)
        if (bulkDiscount > 0) {
          discountApplied = bulkDiscount
          discountReason = 'bulk'
          unitPrice = product.price * (1 - bulkDiscount)
        }
      }

      // Apply BBB-EE discount
      let bbbeeDiscount = 0
      if (isBBBEEClient) {
        bbbeeDiscount = BBBEE_CLIENT_DISCOUNT
        unitPrice = unitPrice * (1 - BBBEE_CLIENT_DISCOUNT)
      }

      // Calculate subtotal
      const subtotal = unitPrice * quantity

      // Calculate VAT
      const vatAmount = subtotal * VAT_RATE

      // Calculate delivery if requested
      let deliveryCost = 0
      let deliveryDays = 0
      let deliveryNote = null

      if (includeDelivery && location) {
        const deliveryCalc = this.calculateDelivery(location, quantity, estimatedWeight)
        deliveryCost = deliveryCalc.cost
        deliveryDays = deliveryCalc.days
        deliveryNote = deliveryCalc.note
      }

      // Calculate total
      const total = subtotal + vatAmount + deliveryCost

      // Calculate savings
      const originalTotal = product.price * quantity * (1 + VAT_RATE)
      const savings = originalTotal - (subtotal + vatAmount)

      return {
        success: true,
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          unit: product.unit
        },
        quantity,
        pricing: {
          unitPrice: this.round(unitPrice),
          originalUnitPrice: product.price,
          subtotal: this.round(subtotal),
          vat: this.round(vatAmount),
          vatRate: VAT_RATE * 100,
          delivery: this.round(deliveryCost),
          total: this.round(total)
        },
        discounts: {
          bulkDiscount: discountApplied * 100,
          bulkDiscountAmount: this.round(product.price * quantity * discountApplied),
          bbbeeDiscount: bbbeeDiscount * 100,
          totalSavings: this.round(savings)
        },
        delivery: includeDelivery && location ? {
          location,
          estimatedDays: deliveryDays,
          cost: this.round(deliveryCost),
          note: deliveryNote
        } : null,
        currency: 'ZAR',
        currencySymbol: 'R',
        timestamp: new Date()
      }
    } catch (error) {
      console.error('QuoteEngine calculatePrice error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get applicable bulk discount
   * @param {Object} product - Product object
   * @param {number} quantity - Order quantity
   * @returns {number} Discount rate (0-1)
   */
  getBulkDiscount(product, quantity) {
    // Use product-specific discounts if available
    const discountTiers = product.bulkDiscounts || DEFAULT_BULK_DISCOUNTS

    // Find applicable tier
    let applicableDiscount = 0
    for (const tier of discountTiers) {
      if (quantity >= tier.min) {
        applicableDiscount = tier.discount
      }
    }

    return applicableDiscount
  }

  /**
   * Calculate delivery cost and time
   * @param {string} location - Delivery location
   * @param {number} quantity - Quantity
   * @param {number} estimatedWeight - Weight in kg (optional)
   * @returns {Object} Delivery calculation
   */
  calculateDelivery(location, quantity, estimatedWeight = null) {
    const locationLower = location.toLowerCase()

    // Find matching rate
    let rate = DELIVERY_RATES.default
    for (const [key, value] of Object.entries(DELIVERY_RATES)) {
      if (locationLower.includes(key)) {
        rate = value
        break
      }
    }

    // Estimate weight if not provided (rough estimate based on quantity)
    const weight = estimatedWeight || Math.max(1, quantity * 0.1)  // 100g per item default

    // Calculate cost
    const cost = rate.baseCost + (weight * rate.perKg)

    // Apply logistics buffer to days
    const days = Math.ceil(rate.days * LOGISTICS_BUFFER)

    return {
      cost: this.round(cost),
      days,
      note: `Delivery to ${location}: ${days} working days (includes SA logistics buffer)`
    }
  }

  /**
   * Calculate multi-item quote
   * @param {Array} items - Array of {productId, quantity}
   * @param {Object} options - Quote options
   * @returns {Promise<Object>} Full quote breakdown
   */
  async calculateQuote(items, options = {}) {
    const {
      location = null,
      isBBBEEClient = false,
      customerEmail = null,
      notes = null
    } = options

    if (!items || items.length === 0) {
      return { success: false, error: 'No items provided' }
    }

    try {
      const lineItems = []
      let subtotal = 0
      let totalSavings = 0

      for (const item of items) {
        const priceCalc = await this.calculatePrice(item.productId, item.quantity, {
          location: null,  // Calculate delivery separately
          isBBBEEClient,
          includeDelivery: false
        })

        if (!priceCalc.success) {
          continue
        }

        lineItems.push({
          productId: priceCalc.product.id,
          name: priceCalc.product.name,
          sku: priceCalc.product.sku,
          unit: priceCalc.product.unit,
          quantity: item.quantity,
          unitPrice: priceCalc.pricing.unitPrice,
          lineTotal: priceCalc.pricing.subtotal,
          discountApplied: priceCalc.discounts.bulkDiscount
        })

        subtotal += priceCalc.pricing.subtotal
        totalSavings += priceCalc.discounts.totalSavings
      }

      // Calculate VAT on total
      const vatAmount = subtotal * VAT_RATE

      // Calculate delivery for full order
      let deliveryCost = 0
      let deliveryDays = 0
      if (location) {
        const totalWeight = lineItems.reduce((acc, item) => acc + (item.quantity * 0.1), 0)
        const deliveryCalc = this.calculateDelivery(location, 0, totalWeight)
        deliveryCost = deliveryCalc.cost
        deliveryDays = deliveryCalc.days
      }

      const total = subtotal + vatAmount + deliveryCost

      return {
        success: true,
        items: lineItems,
        itemCount: lineItems.length,
        summary: {
          subtotal: this.round(subtotal),
          vat: this.round(vatAmount),
          vatRate: VAT_RATE * 100,
          delivery: this.round(deliveryCost),
          total: this.round(total),
          savings: this.round(totalSavings)
        },
        delivery: location ? {
          location,
          estimatedDays: deliveryDays,
          cost: this.round(deliveryCost)
        } : null,
        discounts: {
          bbbeeApplied: isBBBEEClient,
          bbbeeNote: isBBBEEClient ? '2% BBB-EE client discount applied' : null
        },
        validity: {
          createdAt: new Date(),
          validDays: 14,
          validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        },
        currency: 'ZAR',
        currencySymbol: 'R'
      }
    } catch (error) {
      console.error('QuoteEngine calculateQuote error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get bulk discount tiers info
   * @param {string} productId - Optional product ID
   * @returns {Promise<Object>} Discount tier information
   */
  async getBulkDiscountInfo(productId = null) {
    let tiers = DEFAULT_BULK_DISCOUNTS

    if (productId) {
      const product = await productEngine.getProductById(productId)
      if (product?.bulkDiscounts) {
        tiers = product.bulkDiscounts
      }
    }

    return {
      tiers: tiers.map(tier => ({
        minQuantity: tier.min,
        discountPercent: tier.discount * 100,
        description: `${tier.discount * 100}% off for ${tier.min}+ units`
      })),
      bbbeeDiscount: {
        percent: BBBEE_CLIENT_DISCOUNT * 100,
        description: 'Additional 2% for BBB-EE registered clients'
      },
      note: 'Discounts are cumulative. BBB-EE discount applies on top of bulk discounts.'
    }
  }

  /**
   * Get delivery estimate
   * @param {string} location - Delivery location
   * @returns {Object} Delivery estimate
   */
  getDeliveryEstimate(location) {
    const calc = this.calculateDelivery(location, 1, 10)  // Assume 10kg for estimate

    return {
      location,
      estimatedDays: calc.days,
      baseCost: calc.cost,
      note: calc.note,
      buffer: 'All times include 20% SA logistics buffer',
      disclaimer: 'Final delivery cost calculated at checkout based on order weight'
    }
  }

  /**
   * Round to 2 decimal places
   * @param {number} value - Number to round
   * @returns {number} Rounded value
   */
  round(value) {
    return Math.round(value * 100) / 100
  }

  /**
   * Format price for display
   * @param {number} value - Price value
   * @returns {string} Formatted price
   */
  formatPrice(value) {
    return `R${this.round(value).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
  }
}

// Export singleton instance
const quoteEngine = new QuoteEngine()
export default quoteEngine
export { QuoteEngine }

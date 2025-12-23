/**
 * ResponseGenerator - Generates formatted responses from templates
 * Interpolates data into response templates based on intent
 *
 * Features:
 * - Template-based response generation
 * - Variable interpolation
 * - Quick reply generation
 * - Context-aware responses
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class ResponseGenerator {
  constructor() {
    this.templates = {}
    this.variables = {}
    this.isInitialized = false
  }

  /**
   * Initialize the response generator
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      const knowledgePath = path.join(__dirname, '..', 'knowledge')

      // Load response templates
      const responsesData = JSON.parse(
        fs.readFileSync(path.join(knowledgePath, 'responses.json'), 'utf8')
      )

      this.templates = responsesData.templates || {}
      this.variables = responsesData.variables || {}

      this.isInitialized = true
      console.log(`ResponseGenerator initialized: ${Object.keys(this.templates).length} templates`)
    } catch (error) {
      console.error('ResponseGenerator initialization error:', error)
      this.isInitialized = true  // Continue with degraded mode
    }
  }

  /**
   * Generate response for an intent with data
   * @param {string} intent - Intent name
   * @param {Object} data - Data to interpolate
   * @param {Object} context - Conversation context
   * @returns {Object} Generated response
   */
  generate(intent, data = {}, context = {}) {
    const startTime = performance.now()

    // Get template for intent
    const template = this.templates[intent]

    if (!template) {
      return this.generateFallback(intent, data)
    }

    // Determine which variant to use
    const variant = this.selectVariant(template, data, context)
    const templateText = variant.text

    // Interpolate variables
    const text = this.interpolate(templateText, data)

    // Get quick replies
    const quickReplies = this.getQuickReplies(template, data, context)

    const responseTime = performance.now() - startTime

    return {
      text,
      quickReplies,
      intent,
      confidence: data.confidence || 1.0,
      data: this.sanitizeData(data),
      responseTime: Math.round(responseTime * 100) / 100,
      timestamp: new Date()
    }
  }

  /**
   * Select the appropriate template variant
   * @param {Object} template - Template object
   * @param {Object} data - Response data
   * @param {Object} context - Conversation context
   * @returns {Object} Selected variant with text
   */
  selectVariant(template, data, context) {
    // Check for specific states
    if (data.error) {
      if (template.error?.default) {
        return { text: template.error.default }
      }
    }

    if (data.notFound || data.count === 0) {
      if (template.notFound?.default) {
        return { text: template.notFound.default }
      }
      if (template.notFound?.suggestion && data.suggestions?.length > 0) {
        return { text: template.notFound.suggestion }
      }
    }

    // Check for found variants
    if (template.found) {
      if (data.count === 1 && template.found.single) {
        return { text: template.found.single }
      }
      if (data.count > 1 && template.found.multiple) {
        return { text: template.found.multiple }
      }
      if (data.isFeatured && template.found.featured) {
        return { text: template.found.featured }
      }
      if (template.found.default) {
        return { text: template.found.default }
      }
    }

    // Check for specific variants based on data
    for (const [key, variants] of Object.entries(template)) {
      if (key === 'quickReplies') continue

      if (typeof variants === 'object' && !Array.isArray(variants)) {
        // Check if any variant key matches data
        for (const [variantKey, text] of Object.entries(variants)) {
          if (data[variantKey] || context[variantKey]) {
            return { text }
          }
        }

        // Use default variant if exists
        if (variants.default) {
          return { text: variants.default }
        }
      }
    }

    // Check for direct template (not nested)
    if (template.default?.default) {
      return { text: template.default.default }
    }

    // Last resort - return any string found
    const firstVariant = Object.values(template).find(
      v => typeof v === 'object' && v.default
    )
    if (firstVariant) {
      return { text: firstVariant.default }
    }

    return { text: 'I can help you with that. What specifically would you like to know?' }
  }

  /**
   * Interpolate variables in template text
   * @param {string} text - Template text
   * @param {Object} data - Data object
   * @returns {string} Interpolated text
   */
  interpolate(text, data) {
    if (!text) return ''

    // Merge with default variables
    const allData = { ...this.variables, ...data }

    // Replace {variable} patterns
    let result = text.replace(/\{(\w+)\}/g, (match, key) => {
      if (allData.hasOwnProperty(key)) {
        const value = allData[key]
        // Format special types
        if (typeof value === 'number') {
          return this.formatNumber(value, key)
        }
        if (value instanceof Date) {
          return this.formatDate(value)
        }
        if (Array.isArray(value)) {
          return this.formatList(value, key)
        }
        return value
      }
      return match  // Keep original if no replacement
    })

    // Handle conditional sections {?key:text}
    result = result.replace(/\{\?(\w+):([^}]+)\}/g, (match, key, text) => {
      return allData[key] ? text : ''
    })

    // Handle product lists
    if (data.products && result.includes('{productList}')) {
      result = result.replace('{productList}', this.formatProductList(data.products))
    }

    // Handle spec lists
    if (data.specifications && result.includes('{specsList}')) {
      result = result.replace('{specsList}', this.formatSpecsList(data.specifications))
    }

    // Handle standards lists
    if (data.standards && result.includes('{standardsList}')) {
      result = result.replace('{standardsList}', this.formatStandardsList(data.standards))
    }

    // Handle discount tiers
    if (data.discountTiers && result.includes('{discountTiers}')) {
      result = result.replace('{discountTiers}', this.formatDiscountTiers(data.discountTiers))
    }

    return result.trim()
  }

  /**
   * Format a number based on context
   * @param {number} value - Number value
   * @param {string} key - Variable key
   * @returns {string} Formatted number
   */
  formatNumber(value, key) {
    // Price-related keys
    if (key.includes('price') || key.includes('cost') || key.includes('total') ||
        key.includes('subtotal') || key.includes('vat') || key.includes('savings')) {
      return `R${value.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    // Percentage keys
    if (key.includes('percent') || key.includes('discount') || key.includes('rate')) {
      return `${value}%`
    }

    // Days/time keys
    if (key.includes('days') || key.includes('time')) {
      return `${value} days`
    }

    // Default number formatting
    return value.toLocaleString('en-ZA')
  }

  /**
   * Format a date
   * @param {Date} date - Date object
   * @returns {string} Formatted date
   */
  formatDate(date) {
    return date.toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  /**
   * Format an array as a list
   * @param {Array} list - Array of items
   * @param {string} key - Variable key
   * @returns {string} Formatted list
   */
  formatList(list, key) {
    if (list.length === 0) return ''
    if (list.length === 1) return list[0]
    if (list.length === 2) return `${list[0]} and ${list[1]}`
    return `${list.slice(0, -1).join(', ')}, and ${list[list.length - 1]}`
  }

  /**
   * Format product list for display
   * @param {Array} products - Array of products
   * @returns {string} Formatted product list
   */
  formatProductList(products) {
    if (!products || products.length === 0) return 'No products found'

    return products.slice(0, 5).map((p, i) => {
      const stock = p.inStock ? 'In Stock' : 'Out of Stock'
      return `${i + 1}. ${p.name}\n   R${p.price.toFixed(2)} per ${p.unit} | ${stock}`
    }).join('\n\n')
  }

  /**
   * Format specifications list
   * @param {Object} specs - Specifications object
   * @returns {string} Formatted specs
   */
  formatSpecsList(specs) {
    if (!specs || Object.keys(specs).length === 0) return 'No specifications available'

    return Object.entries(specs)
      .filter(([key, value]) => value && key !== 'compliance')
      .map(([key, value]) => {
        const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
        return `- ${label}: ${value}`
      })
      .join('\n')
  }

  /**
   * Format standards list
   * @param {Object} standards - Standards object with met/missing arrays
   * @returns {string} Formatted standards
   */
  formatStandardsList(standards) {
    const lines = []

    if (standards.met && standards.met.length > 0) {
      lines.push('Certified:')
      standards.met.forEach(s => {
        lines.push(`  + ${s.id}: ${s.name}`)
      })
    }

    if (standards.missing && standards.missing.length > 0) {
      lines.push('\nMissing:')
      standards.missing.forEach(s => {
        lines.push(`  - ${s.id}: ${s.name} (${s.status})`)
      })
    }

    return lines.join('\n')
  }

  /**
   * Format discount tiers
   * @param {Array} tiers - Discount tier array
   * @returns {string} Formatted tiers
   */
  formatDiscountTiers(tiers) {
    return tiers.map(tier =>
      `- ${tier.minQuantity}+ units: ${tier.discountPercent}% off`
    ).join('\n')
  }

  /**
   * Get quick replies for the response
   * @param {Object} template - Template object
   * @param {Object} data - Response data
   * @param {Object} context - Conversation context
   * @returns {Array} Quick reply buttons
   */
  getQuickReplies(template, data, context) {
    // Start with template quick replies
    let replies = template.quickReplies || []

    // Filter based on context
    if (data.notFound) {
      replies = replies.filter(r =>
        !r.includes('quote') && !r.includes('specification')
      )
    }

    // Add contextual replies
    if (data.products?.length > 0 && !replies.some(r => r.includes('quote'))) {
      replies = ['Get a quote', ...replies.slice(0, 3)]
    }

    // Limit to 4 replies
    return replies.slice(0, 4)
  }

  /**
   * Generate fallback response
   * @param {string} intent - Intent name
   * @param {Object} data - Response data
   * @returns {Object} Fallback response
   */
  generateFallback(intent, data) {
    const fallbackText = this.templates.UNKNOWN?.default?.default ||
      'I\'m not sure how to help with that. Can you try asking in a different way?'

    return {
      text: fallbackText,
      quickReplies: this.templates.UNKNOWN?.quickReplies || [
        'Browse products',
        'Get a quote',
        'Contact us'
      ],
      intent: 'UNKNOWN',
      originalIntent: intent,
      confidence: 0,
      isFallback: true,
      timestamp: new Date()
    }
  }

  /**
   * Sanitize data for inclusion in response
   * @param {Object} data - Data object
   * @returns {Object} Sanitized data
   */
  sanitizeData(data) {
    // Remove large or sensitive fields
    const sanitized = { ...data }
    delete sanitized.raw
    delete sanitized.compiledPatterns
    delete sanitized.password
    delete sanitized.token

    return sanitized
  }

  /**
   * Generate greeting response based on time
   * @param {Object} context - Conversation context
   * @returns {Object} Greeting response
   */
  generateGreeting(context = {}) {
    const hour = new Date().getHours()
    let timeOfDay = 'default'

    if (hour >= 5 && hour < 12) {
      timeOfDay = 'morning'
    } else if (hour >= 12 && hour < 17) {
      timeOfDay = 'afternoon'
    } else if (hour >= 17 && hour < 21) {
      timeOfDay = 'evening'
    }

    const greetingTemplate = this.templates.GREETING?.default?.[timeOfDay] ||
                            this.templates.GREETING?.default?.default

    return {
      text: greetingTemplate || 'Hello! Welcome to Batlokoa. How can I help you today?',
      quickReplies: this.templates.GREETING?.quickReplies || [
        'Browse products',
        'Get a quote',
        'Track order',
        'Contact sales'
      ],
      intent: 'GREETING',
      confidence: 1.0,
      timestamp: new Date()
    }
  }

  /**
   * Generate error response
   * @param {string} message - Error message
   * @returns {Object} Error response
   */
  generateError(message = null) {
    const errorTemplate = this.templates.ERROR?.default?.default ||
      'I apologize, but something went wrong. Please try again or contact us directly.'

    return {
      text: message || errorTemplate,
      quickReplies: this.templates.ERROR?.quickReplies || [
        'Try again',
        'Contact support'
      ],
      intent: 'ERROR',
      confidence: 1.0,
      isError: true,
      timestamp: new Date()
    }
  }
}

// Export singleton instance
const responseGenerator = new ResponseGenerator()
export default responseGenerator
export { ResponseGenerator }

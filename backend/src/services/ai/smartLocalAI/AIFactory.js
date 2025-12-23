/**
 * AIFactory - Main orchestrator for Smart AI Factory
 * Coordinates all components to process user queries
 *
 * Zero external API dependency
 * Target response time: <50ms
 */

// Core components
import patternMatcher from './core/PatternMatcher.js'
import intentClassifier from './core/IntentClassifier.js'
import contextManager from './core/ContextManager.js'
import scoringEngine from './core/ScoringEngine.js'
import responseGenerator from './core/ResponseGenerator.js'

// Domain engines
import productEngine from './engines/ProductEngine.js'
import quoteEngine from './engines/QuoteEngine.js'
import complianceEngine from './engines/ComplianceEngine.js'

class AIFactory {
  constructor() {
    this.isInitialized = false
    this.metrics = {
      totalRequests: 0,
      avgResponseTime: 0,
      intentDistribution: {},
      errors: 0
    }
  }

  /**
   * Initialize all AI components
   * @returns {Promise<void>}
   */
  async initialize() {
    console.log('Initializing Smart AI Factory...')

    try {
      // Initialize in parallel for speed
      await Promise.all([
        patternMatcher.initialize(),
        responseGenerator.initialize(),
        complianceEngine.initialize(),
        productEngine.initialize(),
        quoteEngine.initialize(),
        contextManager.initialize(),
        scoringEngine.initialize()
      ])

      // IntentClassifier depends on PatternMatcher
      await intentClassifier.initialize()

      this.isInitialized = true
      console.log('Smart AI Factory initialized successfully')
    } catch (error) {
      console.error('AIFactory initialization error:', error)
      throw error
    }
  }

  /**
   * Process a user message
   * @param {string} input - User's message
   * @param {string} visitorId - Visitor identifier
   * @param {string} customerId - Optional customer ID
   * @returns {Promise<Object>} AI response
   */
  async process(input, visitorId, customerId = null) {
    const startTime = performance.now()

    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      // Get or create session
      const session = await contextManager.getSession(visitorId, customerId)

      // Classify intent
      const classification = intentClassifier.classify(input, session.context)

      // Track scoring event
      await this.trackScoringEvent(session.id, classification.intent, input)

      // Handle the intent
      const intentResult = await this.handleIntent(
        classification,
        session,
        input
      )

      // Generate response
      const response = responseGenerator.generate(
        classification.intent,
        {
          ...intentResult,
          confidence: classification.confidence
        },
        session.context
      )

      // Save message to session
      await contextManager.addMessage(session.id, {
        role: 'USER',
        content: input,
        intent: classification.intent,
        confidence: classification.confidence,
        entities: classification.entities
      })

      await contextManager.addMessage(session.id, {
        role: 'BOT',
        content: response.text,
        responseTime: performance.now() - startTime
      })

      // Update metrics
      this.updateMetrics(classification.intent, performance.now() - startTime)

      return {
        success: true,
        response: {
          text: response.text,
          quickReplies: response.quickReplies,
          data: response.data
        },
        intent: classification.intent,
        confidence: classification.confidence,
        entities: classification.entities,
        session: {
          id: session.id,
          leadScore: session.leadScore,
          leadTier: session.leadTier
        },
        responseTime: Math.round(performance.now() - startTime)
      }
    } catch (error) {
      console.error('AIFactory process error:', error)
      this.metrics.errors++

      return {
        success: false,
        response: responseGenerator.generateError(),
        error: error.message,
        responseTime: Math.round(performance.now() - startTime)
      }
    }
  }

  /**
   * Handle intent by calling appropriate engine
   * @param {Object} classification - Intent classification
   * @param {Object} session - User session
   * @param {string} input - Original input
   * @returns {Promise<Object>} Intent handling result
   */
  async handleIntent(classification, session, input) {
    const { intent, parameters, entities } = classification

    switch (intent) {
      case 'PRODUCT_SEARCH':
        return await this.handleProductSearch(parameters, entities)

      case 'PRICE_QUOTE':
        return await this.handlePriceQuote(parameters, entities, session)

      case 'SPEC_QUERY':
        return await this.handleSpecQuery(parameters, entities)

      case 'COMPLIANCE_CHECK':
        return await this.handleComplianceCheck(parameters, entities)

      case 'DELIVERY_INQUIRY':
        return await this.handleDeliveryInquiry(parameters, entities)

      case 'COMPATIBILITY_CHECK':
        return await this.handleCompatibilityCheck(parameters, entities)

      case 'BULK_DISCOUNT':
        return await this.handleBulkDiscount(parameters, entities)

      case 'BBBEE_INQUIRY':
        return await this.handleBBBEEInquiry(parameters)

      case 'PROJECT_ASSISTANCE':
        return await this.handleProjectAssistance(parameters, entities)

      case 'STOCK_CHECK':
        return await this.handleStockCheck(parameters, entities)

      case 'ORDER_STATUS':
        return await this.handleOrderStatus(parameters)

      case 'QUOTE_STATUS':
        return await this.handleQuoteStatus(parameters)

      case 'GENERAL_INFO':
        return await this.handleGeneralInfo(parameters)

      case 'CONTACT_REQUEST':
        return { contactType: parameters.contactType || 'general' }

      case 'GREETING':
        return { timeOfDay: this.getTimeOfDay() }

      case 'THANKS':
        return {}

      case 'UNKNOWN':
      default:
        return {
          suggestions: classification.suggestions || [],
          requiresClarification: true
        }
    }
  }

  /**
   * Handle product search intent
   */
  async handleProductSearch(params, entities) {
    const searchParams = {
      query: params.query || '',
      category: params.category,
      productCode: entities.productCodes?.[0] || params.productCode,
      maxResults: 5
    }

    const results = await productEngine.search(searchParams)

    return {
      count: results.count,
      products: results.products,
      query: searchParams.query,
      notFound: results.count === 0
    }
  }

  /**
   * Handle price quote intent
   */
  async handlePriceQuote(params, entities, session) {
    // First search for product if not specified
    if (!params.productId && params.query) {
      const searchResult = await productEngine.search({
        query: params.query,
        productCode: entities.productCodes?.[0],
        maxResults: 1
      })

      if (searchResult.products?.length > 0) {
        params.productId = searchResult.products[0].id
      }
    }

    if (!params.productId) {
      return {
        notFound: true,
        message: 'Please specify which product you need pricing for.'
      }
    }

    const quantity = entities.quantities?.[0]?.value || params.quantity || 1
    const location = entities.locations?.[0] || params.location

    const pricing = await quoteEngine.calculatePrice(params.productId, quantity, {
      location,
      isBBBEEClient: session.customerId != null
    })

    return {
      ...pricing,
      productName: pricing.product?.name,
      unitPrice: pricing.pricing?.unitPrice,
      quantity,
      subtotal: pricing.pricing?.subtotal,
      vat: pricing.pricing?.vat,
      total: pricing.pricing?.total,
      discount: pricing.discounts?.bulkDiscount,
      savings: pricing.discounts?.totalSavings,
      bulkNote: pricing.discounts?.bulkDiscount > 0
        ? `Bulk discount applied: ${pricing.discounts.bulkDiscount}%`
        : 'Order 100+ for bulk discounts'
    }
  }

  /**
   * Handle specification query intent
   */
  async handleSpecQuery(params, entities) {
    // Search for product
    const searchResult = await productEngine.search({
      query: params.query || '',
      productCode: entities.productCodes?.[0],
      maxResults: 1
    })

    if (searchResult.products?.length === 0) {
      return { notFound: true }
    }

    const product = searchResult.products[0]

    return {
      productName: product.name,
      specifications: product.specifications,
      specsList: product.specifications,
      compliance: product.specifications?.compliance || [],
      unit: product.unit,
      category: product.category
    }
  }

  /**
   * Handle compliance check intent
   */
  async handleComplianceCheck(params, entities) {
    // Get product
    const searchResult = await productEngine.search({
      query: params.query || '',
      productCode: entities.productCodes?.[0],
      maxResults: 1
    })

    if (searchResult.products?.length === 0) {
      return {
        notFound: true,
        message: 'Please specify a product to check compliance for.'
      }
    }

    const product = searchResult.products[0]
    const industry = params.industry || 'general'

    const compliance = await complianceEngine.checkProductCompliance(
      product.id,
      industry
    )

    return {
      ...compliance,
      productName: product.name,
      standards: compliance.standards,
      standardsList: compliance.standards,
      industries: compliance.suitableIndustries || [industry],
      warnings: compliance.warnings
    }
  }

  /**
   * Handle delivery inquiry intent
   */
  async handleDeliveryInquiry(params, entities) {
    const location = entities.locations?.[0] || params.location

    if (!location) {
      return {
        notFound: true,
        message: 'Please specify your delivery location.'
      }
    }

    const estimate = quoteEngine.getDeliveryEstimate(location)

    return {
      location,
      days: estimate.estimatedDays,
      cost: estimate.baseCost,
      note: estimate.note
    }
  }

  /**
   * Handle compatibility check intent
   */
  async handleCompatibilityCheck(params, entities) {
    const { product1, product2 } = params

    if (!product1 || !product2) {
      return {
        notFound: true,
        message: 'Please specify two products to check compatibility.'
      }
    }

    // Search for both products
    const [search1, search2] = await Promise.all([
      productEngine.search({ query: product1, maxResults: 1 }),
      productEngine.search({ query: product2, maxResults: 1 })
    ])

    if (search1.products?.length === 0 || search2.products?.length === 0) {
      return {
        notFound: true,
        message: 'Could not find one or both products.'
      }
    }

    const compatibility = await productEngine.checkCompatibility(
      search1.products[0].id,
      search2.products[0].id
    )

    return {
      product1: search1.products[0].name,
      product2: search2.products[0].name,
      compatible: compatibility.compatible,
      reason: compatibility.reason,
      warnings: compatibility.warnings,
      recommendations: compatibility.recommendations
    }
  }

  /**
   * Handle bulk discount inquiry
   */
  async handleBulkDiscount(params, entities) {
    const discountInfo = await quoteEngine.getBulkDiscountInfo(params.productId)

    return {
      discountTiers: discountInfo.tiers,
      tierList: discountInfo.tiers
        .map(t => `${t.minQuantity}+ units: ${t.discountPercent}% off`)
        .join('\n'),
      bbbeeNote: discountInfo.bbbeeDiscount.description,
      quantity: entities.quantities?.[0]?.value,
      applicableDiscount: params.quantity
        ? this.findApplicableDiscount(discountInfo.tiers, params.quantity)
        : null
    }
  }

  /**
   * Find applicable discount for quantity
   */
  findApplicableDiscount(tiers, quantity) {
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (quantity >= tiers[i].minQuantity) {
        return tiers[i].discountPercent
      }
    }
    return 0
  }

  /**
   * Handle BBB-EE inquiry
   */
  async handleBBBEEInquiry(params) {
    const bbbeeInfo = complianceEngine.getBBBEEInfo()

    return {
      ...bbbeeInfo,
      requestType: params.requestType,
      validUntil: bbbeeInfo.certificate.validUntil,
      verificationNumber: bbbeeInfo.verification.verificationNumber
    }
  }

  /**
   * Handle project assistance
   */
  async handleProjectAssistance(params, entities) {
    const industry = params.industry || 'general'

    // Get industry-relevant categories
    const categories = await productEngine.getCategories()

    return {
      projectType: params.projectType,
      industry,
      categories: categories.slice(0, 5),
      message: `I can help with your ${params.projectType || ''} project. What products do you need?`
    }
  }

  /**
   * Handle stock check
   */
  async handleStockCheck(params, entities) {
    const searchResult = await productEngine.search({
      query: params.query || '',
      productCode: entities.productCodes?.[0],
      maxResults: 1
    })

    if (searchResult.products?.length === 0) {
      return { notFound: true }
    }

    const product = searchResult.products[0]

    return {
      productName: product.name,
      inStock: product.inStock,
      quantity: product.stockQty,
      unit: product.unit,
      stockStatus: product.inStock ? 'In Stock' : 'Out of Stock',
      restockDate: product.inStock ? null : 'Contact us for restock date'
    }
  }

  /**
   * Handle order status
   */
  async handleOrderStatus(params) {
    // This would integrate with the order system
    // For now, return a placeholder
    if (!params.orderNumber) {
      return {
        notFound: true,
        message: 'Please provide your order number.'
      }
    }

    return {
      orderNumber: params.orderNumber,
      message: `To check order ${params.orderNumber}, please contact us or use the customer portal.`
    }
  }

  /**
   * Handle quote status
   */
  async handleQuoteStatus(params) {
    if (!params.quoteNumber) {
      return {
        notFound: true,
        message: 'Please provide your quote reference number.'
      }
    }

    return {
      quoteNumber: params.quoteNumber,
      message: `To check quote ${params.quoteNumber}, please contact us or use the customer portal.`
    }
  }

  /**
   * Handle general info
   */
  async handleGeneralInfo(params) {
    return {
      infoType: params.infoType || 'about',
      companyName: 'Batlokoa Innovative Projects (Pty) Ltd'
    }
  }

  /**
   * Track scoring event based on intent
   */
  async trackScoringEvent(sessionId, intent, input) {
    const eventMapping = {
      PRODUCT_SEARCH: 'chat_product_inquiry',
      PRICE_QUOTE: 'chat_price_inquiry',
      COMPLIANCE_CHECK: 'chat_compliance_inquiry',
      DELIVERY_INQUIRY: 'chat_delivery_inquiry',
      BBBEE_INQUIRY: 'bbbee_cert_request',
      CONTACT_REQUEST: 'contact_form_filled'
    }

    const eventType = eventMapping[intent] || 'chat_message_sent'

    await scoringEngine.trackEvent(sessionId, eventType, { input, intent })
  }

  /**
   * Get time of day for greetings
   */
  getTimeOfDay() {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 17) return 'afternoon'
    if (hour >= 17 && hour < 21) return 'evening'
    return 'night'
  }

  /**
   * Update metrics
   */
  updateMetrics(intent, responseTime) {
    this.metrics.totalRequests++
    this.metrics.avgResponseTime =
      (this.metrics.avgResponseTime * (this.metrics.totalRequests - 1) + responseTime) /
      this.metrics.totalRequests

    this.metrics.intentDistribution[intent] =
      (this.metrics.intentDistribution[intent] || 0) + 1
  }

  /**
   * Get factory metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      isInitialized: this.isInitialized,
      patternMatcher: patternMatcher.getMetrics(),
      scoring: scoringEngine.getTierThresholds(),
      context: contextManager.getStats()
    }
  }

  /**
   * Health check
   */
  healthCheck() {
    return {
      status: this.isInitialized ? 'healthy' : 'initializing',
      components: {
        patternMatcher: patternMatcher.isInitialized,
        intentClassifier: intentClassifier.isInitialized,
        responseGenerator: responseGenerator.isInitialized,
        productEngine: productEngine.isInitialized,
        quoteEngine: quoteEngine.isInitialized,
        complianceEngine: complianceEngine.isInitialized,
        contextManager: contextManager.isInitialized,
        scoringEngine: scoringEngine.isInitialized
      },
      metrics: {
        totalRequests: this.metrics.totalRequests,
        avgResponseTime: Math.round(this.metrics.avgResponseTime),
        errors: this.metrics.errors
      }
    }
  }
}

// Export singleton instance
const aiFactory = new AIFactory()
export default aiFactory
export { AIFactory }

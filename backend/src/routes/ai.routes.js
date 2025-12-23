/**
 * Smart Local AI Routes
 * API endpoints for AI chat, scoring, products, and compliance
 *
 * All endpoints work offline after initial load (no external APIs)
 */

import { Router } from 'express'
import {
  initializeAI,
  processMessage,
  getHealth,
  getMetrics,
  trackEvent,
  getLeadScore,
  getHotLeads,
  getScoringAnalytics,
  searchProducts,
  calculatePrice,
  checkCompliance,
  getBBBEEInfo,
  scoringEngine,
  productEngine,
  quoteEngine,
  complianceEngine
} from '../services/ai/smartLocalAI/index.js'

// Legacy scorer for backward compatibility
import scorer from '../services/ai/smartLocalAI/scorer.js'

const router = Router()

// Initialize AI on first request
let isAIInitialized = false

const ensureAIInitialized = async () => {
  if (!isAIInitialized) {
    await initializeAI()
    isAIInitialized = true
  }
}

// ==================== CHAT ENDPOINTS ====================

/**
 * POST /api/v1/ai/chat
 * Main chat endpoint - process user message and return AI response
 */
router.post('/chat', async (req, res) => {
  try {
    await ensureAIInitialized()

    const { message, visitorId, customerId } = req.body

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' })
    }

    // Generate visitor ID if not provided
    const visitor = visitorId || `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Get customer ID from auth if available
    const customer = customerId || req.user?.customerId || null

    const response = await processMessage(message, visitor, customer)
    res.json(response)
  } catch (error) {
    console.error('AI Chat Error:', error)
    res.status(500).json({ error: 'AI service error', message: error.message })
  }
})

// ==================== HEALTH & METRICS ====================

/**
 * GET /api/v1/ai/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    await ensureAIInitialized()
    const health = getHealth()
    res.json(health)
  } catch (error) {
    res.json({
      status: 'degraded',
      error: error.message
    })
  }
})

/**
 * GET /api/v1/ai/metrics
 * Get AI performance metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    await ensureAIInitialized()
    const metrics = getMetrics()
    res.json(metrics)
  } catch (error) {
    console.error('AI Metrics Error:', error)
    res.status(500).json({ error: 'Metrics error', message: error.message })
  }
})

// ==================== PRODUCT SEARCH ====================

/**
 * GET /api/v1/ai/search
 * Search products using AI-powered search
 */
router.get('/search', async (req, res) => {
  try {
    await ensureAIInitialized()

    const { q, query, category, code, limit } = req.query

    const results = await searchProducts({
      query: q || query || '',
      category,
      productCode: code,
      maxResults: parseInt(limit) || 10
    })

    res.json(results)
  } catch (error) {
    console.error('AI Search Error:', error)
    res.status(500).json({ error: 'Search error', message: error.message })
  }
})

/**
 * GET /api/v1/ai/products/recommend/:id
 * Get product recommendations
 */
router.get('/products/recommend/:id', async (req, res) => {
  try {
    await ensureAIInitialized()

    const { type = 'complementary', limit = 5 } = req.query

    const recommendations = await productEngine.getRecommendations(
      req.params.id,
      type,
      parseInt(limit)
    )

    res.json({ recommendations })
  } catch (error) {
    console.error('Recommendations Error:', error)
    res.status(500).json({ error: 'Recommendations error', message: error.message })
  }
})

// ==================== PRICING ====================

/**
 * POST /api/v1/ai/price
 * Calculate pricing for a product
 */
router.post('/price', async (req, res) => {
  try {
    await ensureAIInitialized()

    const { productId, quantity, location, isBBBEEClient } = req.body

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' })
    }

    const pricing = await calculatePrice(productId, quantity || 1, {
      location,
      isBBBEEClient: isBBBEEClient || false
    })

    res.json(pricing)
  } catch (error) {
    console.error('Pricing Error:', error)
    res.status(500).json({ error: 'Pricing error', message: error.message })
  }
})

/**
 * POST /api/v1/ai/quote
 * Calculate multi-item quote
 */
router.post('/quote', async (req, res) => {
  try {
    await ensureAIInitialized()

    const { items, location, isBBBEEClient, customerEmail, notes } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' })
    }

    const quote = await quoteEngine.calculateQuote(items, {
      location,
      isBBBEEClient: isBBBEEClient || false,
      customerEmail,
      notes
    })

    res.json(quote)
  } catch (error) {
    console.error('Quote Error:', error)
    res.status(500).json({ error: 'Quote error', message: error.message })
  }
})

/**
 * GET /api/v1/ai/bulk-discounts
 * Get bulk discount information
 */
router.get('/bulk-discounts', async (req, res) => {
  try {
    await ensureAIInitialized()

    const { productId } = req.query
    const discounts = await quoteEngine.getBulkDiscountInfo(productId)

    res.json(discounts)
  } catch (error) {
    console.error('Bulk Discounts Error:', error)
    res.status(500).json({ error: 'Discounts error', message: error.message })
  }
})

/**
 * GET /api/v1/ai/delivery
 * Get delivery estimate
 */
router.get('/delivery', async (req, res) => {
  try {
    await ensureAIInitialized()

    const { location } = req.query

    if (!location) {
      return res.status(400).json({ error: 'Location is required' })
    }

    const estimate = quoteEngine.getDeliveryEstimate(location)
    res.json(estimate)
  } catch (error) {
    console.error('Delivery Error:', error)
    res.status(500).json({ error: 'Delivery error', message: error.message })
  }
})

// ==================== COMPLIANCE ====================

/**
 * GET /api/v1/ai/compliance/check
 * Check product compliance for an industry
 */
router.get('/compliance/check', async (req, res) => {
  try {
    await ensureAIInitialized()

    const { productId, industry } = req.query

    if (!productId || !industry) {
      return res.status(400).json({ error: 'Product ID and industry are required' })
    }

    const compliance = await checkCompliance(productId, industry)
    res.json(compliance)
  } catch (error) {
    console.error('Compliance Error:', error)
    res.status(500).json({ error: 'Compliance error', message: error.message })
  }
})

/**
 * GET /api/v1/ai/compliance/standards
 * Get all available standards
 */
router.get('/compliance/standards', async (req, res) => {
  try {
    await ensureAIInitialized()

    const standards = complianceEngine.getAllStandards()
    res.json({ standards })
  } catch (error) {
    console.error('Standards Error:', error)
    res.status(500).json({ error: 'Standards error', message: error.message })
  }
})

/**
 * GET /api/v1/ai/compliance/industries
 * Get all industries with requirements
 */
router.get('/compliance/industries', async (req, res) => {
  try {
    await ensureAIInitialized()

    const industries = complianceEngine.getAllIndustries()
    res.json({ industries })
  } catch (error) {
    console.error('Industries Error:', error)
    res.status(500).json({ error: 'Industries error', message: error.message })
  }
})

/**
 * GET /api/v1/ai/bbbee
 * Get BBB-EE information
 */
router.get('/bbbee', async (req, res) => {
  try {
    await ensureAIInitialized()

    const info = getBBBEEInfo()
    res.json(info)
  } catch (error) {
    console.error('BBB-EE Error:', error)
    res.status(500).json({ error: 'BBB-EE error', message: error.message })
  }
})

// ==================== LEAD SCORING ====================

/**
 * POST /api/v1/ai/track
 * Track a scoring event
 */
router.post('/track', async (req, res) => {
  try {
    await ensureAIInitialized()

    const { sessionId, eventType, metadata } = req.body

    if (!sessionId || !eventType) {
      return res.status(400).json({ error: 'Session ID and event type are required' })
    }

    const result = await trackEvent(sessionId, eventType, metadata || {})
    res.json(result)
  } catch (error) {
    console.error('Track Error:', error)
    res.status(500).json({ error: 'Track error', message: error.message })
  }
})

/**
 * GET /api/v1/ai/score/session/:id
 * Get lead score for a session
 */
router.get('/score/session/:id', async (req, res) => {
  try {
    await ensureAIInitialized()

    const score = await getLeadScore(req.params.id)
    res.json(score)
  } catch (error) {
    console.error('Lead Score Error:', error)
    res.status(500).json({ error: 'Scoring error', message: error.message })
  }
})

/**
 * GET /api/v1/ai/leads/hot
 * Get hot leads for sales dashboard
 */
router.get('/leads/hot', async (req, res) => {
  try {
    await ensureAIInitialized()

    const { limit = 10 } = req.query
    const leads = await getHotLeads(parseInt(limit))

    res.json({ leads })
  } catch (error) {
    console.error('Hot Leads Error:', error)
    res.status(500).json({ error: 'Leads error', message: error.message })
  }
})

/**
 * GET /api/v1/ai/analytics
 * Get scoring analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    await ensureAIInitialized()

    const { days = 7 } = req.query
    const analytics = await getScoringAnalytics(parseInt(days))

    res.json(analytics)
  } catch (error) {
    console.error('Analytics Error:', error)
    res.status(500).json({ error: 'Analytics error', message: error.message })
  }
})

/**
 * GET /api/v1/ai/events
 * Get available scoring event types
 */
router.get('/events', async (req, res) => {
  try {
    await ensureAIInitialized()

    const events = scoringEngine.getEventTypes()
    const thresholds = scoringEngine.getTierThresholds()

    res.json({ events, thresholds })
  } catch (error) {
    console.error('Events Error:', error)
    res.status(500).json({ error: 'Events error', message: error.message })
  }
})

// ==================== LEGACY SCORING ENDPOINTS ====================
// (Backward compatibility with existing scorer.js)

/**
 * GET /api/v1/ai/score/customer/:id
 * Get lead score for a customer (legacy)
 */
router.get('/score/customer/:id', async (req, res) => {
  try {
    const customerId = req.params.id

    const score = await scorer.calculateLeadScore(customerId)
    res.json(score)
  } catch (error) {
    console.error('Lead Score Error:', error)
    res.status(500).json({ error: 'Scoring error', message: error.message })
  }
})

/**
 * GET /api/v1/ai/churn/customer/:id
 * Get churn risk for a customer (legacy)
 */
router.get('/churn/customer/:id', async (req, res) => {
  try {
    const customerId = req.params.id

    const risk = await scorer.detectChurnRisk(customerId)
    res.json(risk)
  } catch (error) {
    console.error('Churn Detection Error:', error)
    res.status(500).json({ error: 'Churn detection error', message: error.message })
  }
})

/**
 * GET /api/v1/ai/score/supplier/:id
 * Get performance score for a supplier (legacy)
 */
router.get('/score/supplier/:id', async (req, res) => {
  try {
    const supplierId = req.params.id

    const score = await scorer.scoreSupplier(supplierId)
    res.json(score)
  } catch (error) {
    console.error('Supplier Score Error:', error)
    res.status(500).json({ error: 'Scoring error', message: error.message })
  }
})

/**
 * GET /api/v1/ai/alerts/stock
 * Get stock alerts (legacy)
 */
router.get('/alerts/stock', async (req, res) => {
  try {
    const alerts = await scorer.getStockAlerts()
    res.json(alerts)
  } catch (error) {
    console.error('Stock Alerts Error:', error)
    res.status(500).json({ error: 'Stock alerts error', message: error.message })
  }
})

/**
 * GET /api/v1/ai/suggestions/reorder
 * Get reorder suggestions (legacy)
 */
router.get('/suggestions/reorder', async (req, res) => {
  try {
    const suggestions = await scorer.getReorderSuggestions()
    res.json(suggestions)
  } catch (error) {
    console.error('Reorder Suggestions Error:', error)
    res.status(500).json({ error: 'Suggestions error', message: error.message })
  }
})

export default router

/**
 * Smart Local AI Factory - Main Entry Point
 *
 * Zero-cost, offline-capable AI assistant for Batlokoa Innovative Projects
 * Uses pattern matching and pre-computed responses (no external APIs)
 *
 * Features:
 * - Pattern-based intent detection
 * - Entity extraction
 * - Product search and pricing
 * - Compliance verification (SANS/OHSA/DMR)
 * - Lead scoring
 * - Multi-turn conversation context
 * - BBB-EE Level 1 information
 * - SA logistics support
 */

// Main factory
import aiFactory from './AIFactory.js'

// Core components (for direct access if needed)
import patternMatcher from './core/PatternMatcher.js'
import intentClassifier from './core/IntentClassifier.js'
import contextManager from './core/ContextManager.js'
import scoringEngine from './core/ScoringEngine.js'
import responseGenerator from './core/ResponseGenerator.js'

// Domain engines
import productEngine from './engines/ProductEngine.js'
import quoteEngine from './engines/QuoteEngine.js'
import complianceEngine from './engines/ComplianceEngine.js'

/**
 * Initialize the Smart AI Factory
 * Call this on server startup
 */
export async function initializeAI() {
  await aiFactory.initialize()
  return aiFactory
}

/**
 * Process a user message
 * @param {string} message - User's input message
 * @param {string} visitorId - Unique visitor identifier
 * @param {string} customerId - Optional customer ID if authenticated
 * @returns {Promise<Object>} AI response
 */
export async function processMessage(message, visitorId, customerId = null) {
  return aiFactory.process(message, visitorId, customerId)
}

/**
 * Get AI health status
 */
export function getHealth() {
  return aiFactory.healthCheck()
}

/**
 * Get AI metrics
 */
export function getMetrics() {
  return aiFactory.getMetrics()
}

/**
 * Track a scoring event
 * @param {string} sessionId - Session ID
 * @param {string} eventType - Type of event
 * @param {Object} metadata - Additional data
 */
export async function trackEvent(sessionId, eventType, metadata = {}) {
  return scoringEngine.trackEvent(sessionId, eventType, metadata)
}

/**
 * Get lead score for a session
 * @param {string} sessionId - Session ID
 */
export async function getLeadScore(sessionId) {
  return scoringEngine.getScore(sessionId)
}

/**
 * Get hot leads for sales dashboard
 * @param {number} limit - Maximum number of leads
 */
export async function getHotLeads(limit = 10) {
  return scoringEngine.getHotLeads(limit)
}

/**
 * Get scoring analytics
 * @param {number} days - Number of days to analyze
 */
export async function getScoringAnalytics(days = 7) {
  return scoringEngine.getAnalytics(days)
}

/**
 * Search products
 * @param {Object} params - Search parameters
 */
export async function searchProducts(params) {
  if (!productEngine.isInitialized) {
    await productEngine.initialize()
  }
  return productEngine.search(params)
}

/**
 * Calculate pricing
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity
 * @param {Object} options - Pricing options
 */
export async function calculatePrice(productId, quantity, options = {}) {
  if (!quoteEngine.isInitialized) {
    await quoteEngine.initialize()
  }
  return quoteEngine.calculatePrice(productId, quantity, options)
}

/**
 * Check product compliance
 * @param {string} productId - Product ID
 * @param {string} industry - Industry name
 */
export async function checkCompliance(productId, industry) {
  if (!complianceEngine.isInitialized) {
    await complianceEngine.initialize()
  }
  return complianceEngine.checkProductCompliance(productId, industry)
}

/**
 * Get BBB-EE information
 */
export function getBBBEEInfo() {
  return complianceEngine.getBBBEEInfo()
}

// Export factory and components
export {
  aiFactory,
  patternMatcher,
  intentClassifier,
  contextManager,
  scoringEngine,
  responseGenerator,
  productEngine,
  quoteEngine,
  complianceEngine
}

// Default export
export default aiFactory

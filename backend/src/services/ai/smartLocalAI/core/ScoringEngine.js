/**
 * ScoringEngine - Lead scoring and behavior tracking
 * Scores visitors based on their interactions to identify hot leads
 *
 * Integrates with database for persistence and sales notifications
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Scoring event definitions
const EVENT_SCORES = {
  // Page views
  page_view_home: 1,
  page_view_products: 3,
  page_view_services: 3,
  page_view_about: 2,
  page_view_contact: 8,
  page_view_bbbee: 5,

  // Product interactions
  product_view: 5,
  product_spec_view: 10,
  product_compare: 12,
  product_add_to_cart: 15,

  // Pricing interactions
  price_check: 15,
  bulk_discount_view: 20,
  quote_started: 25,
  quote_item_added: 10,

  // Chat interactions
  chat_opened: 3,
  chat_message_sent: 3,
  chat_product_inquiry: 8,
  chat_price_inquiry: 12,
  chat_compliance_inquiry: 10,
  chat_delivery_inquiry: 8,

  // High-value actions
  bbbee_cert_request: 30,
  quote_request: 30,
  quote_submitted: 50,
  contact_form_filled: 35,
  phone_clicked: 25,
  email_clicked: 20,
  whatsapp_clicked: 22,
  callback_requested: 40,

  // Order-related
  order_started: 30,
  order_completed: 100,
  repeat_visit: 5
}

// Lead tier thresholds
const TIER_THRESHOLDS = {
  HOT: 80,
  WARM: 40,
  COOL: 20,
  COLD: 0
}

// Notification cooldown (30 minutes in milliseconds)
const NOTIFICATION_COOLDOWN = 30 * 60 * 1000

class ScoringEngine {
  constructor() {
    this.lastNotifications = new Map()  // sessionId -> timestamp
    this.isInitialized = false
  }

  /**
   * Initialize the scoring engine
   * @returns {Promise<void>}
   */
  async initialize() {
    this.isInitialized = true
    console.log('ScoringEngine initialized')
  }

  /**
   * Track an event and update lead score
   * @param {string} sessionId - Session ID
   * @param {string} eventType - Type of event
   * @param {Object} metadata - Additional event data
   * @returns {Promise<Object>} Updated score info
   */
  async trackEvent(sessionId, eventType, metadata = {}) {
    const points = EVENT_SCORES[eventType] || 0

    if (points === 0 && !EVENT_SCORES.hasOwnProperty(eventType)) {
      console.warn(`Unknown event type: ${eventType}`)
    }

    try {
      // Record the event
      await prisma.leadEvent.create({
        data: {
          sessionId,
          eventType,
          points,
          metadata
        }
      })

      // Get current session
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId }
      })

      if (!session) {
        return { score: 0, tier: 'COLD', pointsAdded: 0 }
      }

      // Calculate new score
      const newScore = session.leadScore + points
      const newTier = this.calculateTier(newScore)

      // Update session
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          leadScore: newScore,
          leadTier: newTier
        }
      })

      // Check if we need to notify sales team
      if (newTier === 'HOT' && session.leadTier !== 'HOT') {
        await this.notifySalesTeam(sessionId, newScore, eventType)
      }

      return {
        score: newScore,
        previousScore: session.leadScore,
        tier: newTier,
        previousTier: session.leadTier,
        pointsAdded: points,
        tierChanged: newTier !== session.leadTier
      }
    } catch (error) {
      console.error('ScoringEngine trackEvent error:', error)
      return { score: 0, tier: 'COLD', pointsAdded: points, error: true }
    }
  }

  /**
   * Calculate tier from score
   * @param {number} score - Lead score
   * @returns {string} Lead tier
   */
  calculateTier(score) {
    if (score >= TIER_THRESHOLDS.HOT) return 'HOT'
    if (score >= TIER_THRESHOLDS.WARM) return 'WARM'
    if (score >= TIER_THRESHOLDS.COOL) return 'COOL'
    return 'COLD'
  }

  /**
   * Notify sales team of a hot lead
   * @param {string} sessionId - Session ID
   * @param {number} score - Current score
   * @param {string} triggerEvent - Event that triggered notification
   * @returns {Promise<void>}
   */
  async notifySalesTeam(sessionId, score, triggerEvent) {
    // Check cooldown
    const lastNotification = this.lastNotifications.get(sessionId)
    if (lastNotification && Date.now() - lastNotification < NOTIFICATION_COOLDOWN) {
      return
    }

    try {
      // Get session details
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: {
          events: {
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          messages: {
            where: { role: 'USER' },
            orderBy: { createdAt: 'desc' },
            take: 3
          }
        }
      })

      if (!session) return

      // Build notification data
      const notificationData = {
        sessionId,
        score,
        tier: 'HOT',
        triggerEvent,
        visitorId: session.visitorId,
        customerId: session.customerId,
        recentEvents: session.events.map(e => ({
          type: e.eventType,
          points: e.points,
          timestamp: e.createdAt
        })),
        recentMessages: session.messages.map(m => m.content),
        suggestedAction: this.getSuggestedAction(triggerEvent),
        timestamp: new Date()
      }

      // Create notification in database
      await prisma.notification.create({
        data: {
          type: 'LOW_STOCK_ALERT',  // Reusing existing enum, should add HOT_LEAD
          channel: 'EMAIL',
          recipient: process.env.SALES_EMAIL || 'sales@batlokoa.co.za',
          subject: `HOT LEAD - Score ${score}`,
          message: JSON.stringify(notificationData),
          entityType: 'chat_session',
          entityId: sessionId
        }
      })

      // Also log to activity
      await prisma.activity.create({
        data: {
          type: 'HOT_LEAD_DETECTED',
          description: `Hot lead detected with score ${score} (triggered by ${triggerEvent})`,
          metadata: notificationData,
          entityType: 'chat_session',
          entityId: sessionId
        }
      })

      // Update cooldown
      this.lastNotifications.set(sessionId, Date.now())

      console.log(`HOT LEAD notification sent for session ${sessionId}, score ${score}`)
    } catch (error) {
      console.error('ScoringEngine notifySalesTeam error:', error)
    }
  }

  /**
   * Get suggested action based on trigger event
   * @param {string} triggerEvent - Event type
   * @returns {string} Suggested action
   */
  getSuggestedAction(triggerEvent) {
    const actions = {
      quote_submitted: 'Follow up within 1 hour to close the sale',
      quote_request: 'Prepare personalized quote and call within 2 hours',
      callback_requested: 'Call immediately - customer is waiting',
      contact_form_filled: 'Call within 1 hour with relevant product info',
      bbbee_cert_request: 'Send certificate and highlight procurement benefits',
      phone_clicked: 'Customer may call - be ready with pricing',
      bulk_discount_view: 'Large order potential - prepare volume pricing',
      default: 'Contact within 1 hour to qualify and assist'
    }

    return actions[triggerEvent] || actions.default
  }

  /**
   * Get lead score for a session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Score information
   */
  async getScore(sessionId) {
    try {
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: {
          events: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      })

      if (!session) {
        return { score: 0, tier: 'COLD', events: [] }
      }

      return {
        score: session.leadScore,
        tier: session.leadTier,
        events: session.events.map(e => ({
          type: e.eventType,
          points: e.points,
          timestamp: e.createdAt
        })),
        thresholds: TIER_THRESHOLDS,
        nextTier: this.getNextTierInfo(session.leadScore, session.leadTier)
      }
    } catch (error) {
      console.error('ScoringEngine getScore error:', error)
      return { score: 0, tier: 'COLD', events: [], error: true }
    }
  }

  /**
   * Get info about next tier
   * @param {number} currentScore - Current score
   * @param {string} currentTier - Current tier
   * @returns {Object} Next tier info
   */
  getNextTierInfo(currentScore, currentTier) {
    const tierOrder = ['COLD', 'COOL', 'WARM', 'HOT']
    const currentIndex = tierOrder.indexOf(currentTier)

    if (currentIndex >= tierOrder.length - 1) {
      return { tier: 'HOT', pointsNeeded: 0, isMaxTier: true }
    }

    const nextTier = tierOrder[currentIndex + 1]
    const nextThreshold = TIER_THRESHOLDS[nextTier]

    return {
      tier: nextTier,
      pointsNeeded: nextThreshold - currentScore,
      isMaxTier: false
    }
  }

  /**
   * Get hot leads for dashboard
   * @param {number} limit - Maximum number of leads
   * @returns {Promise<Array>} Array of hot lead sessions
   */
  async getHotLeads(limit = 10) {
    try {
      const hotLeads = await prisma.chatSession.findMany({
        where: {
          leadTier: 'HOT',
          isActive: true
        },
        orderBy: { leadScore: 'desc' },
        take: limit,
        include: {
          messages: {
            where: { role: 'USER' },
            orderBy: { createdAt: 'desc' },
            take: 3
          },
          events: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      })

      return hotLeads.map(lead => ({
        sessionId: lead.id,
        visitorId: lead.visitorId,
        customerId: lead.customerId,
        score: lead.leadScore,
        tier: lead.leadTier,
        lastActive: lead.lastMessageAt,
        recentMessages: lead.messages.map(m => m.content),
        topEvents: lead.events.map(e => e.eventType)
      }))
    } catch (error) {
      console.error('ScoringEngine getHotLeads error:', error)
      return []
    }
  }

  /**
   * Get scoring analytics
   * @param {number} days - Number of days to analyze
   * @returns {Promise<Object>} Analytics data
   */
  async getAnalytics(days = 7) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    try {
      // Get tier distribution
      const tierDistribution = await prisma.chatSession.groupBy({
        by: ['leadTier'],
        where: {
          createdAt: { gte: startDate }
        },
        _count: { id: true }
      })

      // Get event frequency
      const eventFrequency = await prisma.leadEvent.groupBy({
        by: ['eventType'],
        where: {
          createdAt: { gte: startDate }
        },
        _count: { id: true },
        _sum: { points: true }
      })

      // Get conversion rate (sessions that converted)
      const conversions = await prisma.chatSession.count({
        where: {
          createdAt: { gte: startDate },
          convertedTo: { not: null }
        }
      })

      const totalSessions = await prisma.chatSession.count({
        where: {
          createdAt: { gte: startDate }
        }
      })

      return {
        period: { days, startDate },
        tierDistribution: tierDistribution.reduce((acc, t) => {
          acc[t.leadTier] = t._count.id
          return acc
        }, {}),
        eventFrequency: eventFrequency.map(e => ({
          event: e.eventType,
          count: e._count.id,
          totalPoints: e._sum.points
        })).sort((a, b) => b.count - a.count),
        conversions: {
          total: conversions,
          rate: totalSessions > 0 ? (conversions / totalSessions * 100).toFixed(2) : 0
        },
        totalSessions
      }
    } catch (error) {
      console.error('ScoringEngine getAnalytics error:', error)
      return { error: true }
    }
  }

  /**
   * Get available event types
   * @returns {Object} Event types with scores
   */
  getEventTypes() {
    return { ...EVENT_SCORES }
  }

  /**
   * Get tier thresholds
   * @returns {Object} Tier thresholds
   */
  getTierThresholds() {
    return { ...TIER_THRESHOLDS }
  }
}

// Export singleton instance
const scoringEngine = new ScoringEngine()
export default scoringEngine
export { ScoringEngine }

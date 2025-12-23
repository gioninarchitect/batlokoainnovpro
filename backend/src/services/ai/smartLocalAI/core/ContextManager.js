/**
 * ContextManager - Manages conversation context and state
 * Tracks multi-turn conversations and user preferences
 *
 * Integrates with database for persistence
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Context expiry (7 days in milliseconds)
const CONTEXT_EXPIRY = 7 * 24 * 60 * 60 * 1000

class ContextManager {
  constructor() {
    // In-memory cache for active sessions
    this.sessions = new Map()
    this.isInitialized = false
  }

  /**
   * Initialize the context manager
   * @returns {Promise<void>}
   */
  async initialize() {
    this.isInitialized = true
    console.log('ContextManager initialized')
  }

  /**
   * Get or create a session for a visitor
   * @param {string} visitorId - Unique visitor identifier
   * @param {string} customerId - Optional customer ID if authenticated
   * @returns {Promise<Object>} Session object
   */
  async getSession(visitorId, customerId = null) {
    // Check in-memory cache first
    if (this.sessions.has(visitorId)) {
      const session = this.sessions.get(visitorId)
      // Update last access time
      session.lastAccess = new Date()
      return session
    }

    try {
      // Try to find existing active session in database
      let dbSession = await prisma.chatSession.findFirst({
        where: {
          visitorId,
          isActive: true,
          lastMessageAt: {
            gte: new Date(Date.now() - CONTEXT_EXPIRY)
          }
        },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 10  // Last 10 messages for context
          }
        }
      })

      if (!dbSession) {
        // Create new session
        dbSession = await prisma.chatSession.create({
          data: {
            visitorId,
            customerId,
            startedAt: new Date(),
            lastMessageAt: new Date(),
            context: {},
            leadScore: 0,
            leadTier: 'COLD'
          }
        })
      }

      // Build session object
      const session = {
        id: dbSession.id,
        visitorId: dbSession.visitorId,
        customerId: dbSession.customerId,
        startedAt: dbSession.startedAt,
        lastAccess: new Date(),
        context: dbSession.context || {},
        leadScore: dbSession.leadScore,
        leadTier: dbSession.leadTier,
        messages: dbSession.messages || [],
        // Derived context from recent messages
        recentIntents: [],
        lastProductId: null,
        lastLocation: null,
        preferences: {}
      }

      // Extract context from recent messages
      if (dbSession.messages) {
        for (const msg of dbSession.messages) {
          if (msg.intent) {
            session.recentIntents.push(msg.intent)
          }
          if (msg.entities?.productId) {
            session.lastProductId = session.lastProductId || msg.entities.productId
          }
          if (msg.entities?.location) {
            session.lastLocation = session.lastLocation || msg.entities.location
          }
        }
      }

      // Cache in memory
      this.sessions.set(visitorId, session)

      return session
    } catch (error) {
      console.error('ContextManager getSession error:', error)
      // Return a minimal session on error
      return this.createMinimalSession(visitorId)
    }
  }

  /**
   * Create a minimal session when database is unavailable
   * @param {string} visitorId - Visitor ID
   * @returns {Object} Minimal session object
   */
  createMinimalSession(visitorId) {
    return {
      id: `temp_${visitorId}_${Date.now()}`,
      visitorId,
      customerId: null,
      startedAt: new Date(),
      lastAccess: new Date(),
      context: {},
      leadScore: 0,
      leadTier: 'COLD',
      messages: [],
      recentIntents: [],
      lastProductId: null,
      lastLocation: null,
      preferences: {},
      isTemporary: true
    }
  }

  /**
   * Update session context
   * @param {string} sessionId - Session ID
   * @param {Object} updates - Context updates
   * @returns {Promise<void>}
   */
  async updateContext(sessionId, updates) {
    try {
      // Update in database
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          context: updates,
          lastMessageAt: new Date()
        }
      })

      // Update in-memory cache
      for (const [visitorId, session] of this.sessions.entries()) {
        if (session.id === sessionId) {
          session.context = { ...session.context, ...updates }
          session.lastAccess = new Date()
          break
        }
      }
    } catch (error) {
      console.error('ContextManager updateContext error:', error)
    }
  }

  /**
   * Add a message to the session
   * @param {string} sessionId - Session ID
   * @param {Object} message - Message object
   * @returns {Promise<Object>} Created message
   */
  async addMessage(sessionId, message) {
    try {
      const chatMessage = await prisma.chatMessage.create({
        data: {
          sessionId,
          role: message.role,
          content: message.content,
          intent: message.intent || null,
          confidence: message.confidence || null,
          entities: message.entities || null,
          responseTime: message.responseTime || null,
          usedFallback: message.usedFallback || false
        }
      })

      // Update session last message time
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { lastMessageAt: new Date() }
      })

      return chatMessage
    } catch (error) {
      console.error('ContextManager addMessage error:', error)
      return null
    }
  }

  /**
   * Get context summary for response generation
   * @param {Object} session - Session object
   * @returns {Object} Context summary
   */
  getContextSummary(session) {
    return {
      hasHistory: session.messages.length > 0,
      recentIntents: session.recentIntents.slice(0, 5),
      lastProductId: session.lastProductId,
      lastLocation: session.lastLocation,
      leadScore: session.leadScore,
      leadTier: session.leadTier,
      isReturning: session.messages.length > 5,
      preferences: session.preferences,
      customerId: session.customerId
    }
  }

  /**
   * Remember a user preference
   * @param {string} sessionId - Session ID
   * @param {string} key - Preference key
   * @param {*} value - Preference value
   * @returns {Promise<void>}
   */
  async remember(sessionId, key, value) {
    try {
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId }
      })

      if (session) {
        const context = session.context || {}
        context.preferences = context.preferences || {}
        context.preferences[key] = value

        await prisma.chatSession.update({
          where: { id: sessionId },
          data: { context }
        })
      }
    } catch (error) {
      console.error('ContextManager remember error:', error)
    }
  }

  /**
   * Recall a user preference
   * @param {string} sessionId - Session ID
   * @param {string} key - Preference key
   * @returns {Promise<*>} Preference value or null
   */
  async recall(sessionId, key) {
    try {
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId }
      })

      if (session?.context?.preferences) {
        return session.context.preferences[key] || null
      }

      return null
    } catch (error) {
      console.error('ContextManager recall error:', error)
      return null
    }
  }

  /**
   * Close a session
   * @param {string} sessionId - Session ID
   * @param {string} convertedTo - What the session converted to (if any)
   * @returns {Promise<void>}
   */
  async closeSession(sessionId, convertedTo = null) {
    try {
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          isActive: false,
          convertedTo,
          convertedAt: convertedTo ? new Date() : null
        }
      })

      // Remove from in-memory cache
      for (const [visitorId, session] of this.sessions.entries()) {
        if (session.id === sessionId) {
          this.sessions.delete(visitorId)
          break
        }
      }
    } catch (error) {
      console.error('ContextManager closeSession error:', error)
    }
  }

  /**
   * Clean up expired sessions from cache
   */
  cleanupCache() {
    const now = Date.now()
    for (const [visitorId, session] of this.sessions.entries()) {
      if (now - session.lastAccess.getTime() > CONTEXT_EXPIRY) {
        this.sessions.delete(visitorId)
      }
    }
  }

  /**
   * Get session statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      activeSessions: this.sessions.size,
      isInitialized: this.isInitialized
    }
  }
}

// Export singleton instance
const contextManager = new ContextManager()
export default contextManager
export { ContextManager }

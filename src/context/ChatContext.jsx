/**
 * ChatContext - Manages Smart AI chat state
 * Handles messages, sessions, and widget visibility
 * Includes service worker registration for offline capability
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useServiceWorker } from '@/hooks/useServiceWorker'

const ChatContext = createContext()

// API URL detection
const API_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:3016/api/v1'
  : `${typeof window !== 'undefined' ? window.location.origin : ''}/api/v1`

// Generate visitor ID for anonymous users
const getVisitorId = () => {
  const stored = localStorage.getItem('batlokoa_visitor_id')
  if (stored) return stored

  const newId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  localStorage.setItem('batlokoa_visitor_id', newId)
  return newId
}

export function ChatProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [visitorId] = useState(getVisitorId)
  const [error, setError] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  // Service worker for offline capability
  const { isReady: swReady } = useServiceWorker()

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Add welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const hour = new Date().getHours()
      let greeting = 'Hello'
      if (hour >= 5 && hour < 12) greeting = 'Good morning'
      else if (hour >= 12 && hour < 17) greeting = 'Good afternoon'
      else if (hour >= 17 && hour < 21) greeting = 'Good evening'

      setMessages([{
        id: 'welcome',
        role: 'bot',
        content: `${greeting}! Welcome to Batlokoa Innovative Projects. I'm here to help you find industrial products, get quotes, check compliance, and more. How can I assist you today?`,
        timestamp: new Date(),
        quickReplies: [
          'Browse products',
          'Get a quote',
          'Check compliance',
          'BBB-EE certificate'
        ]
      }])
    }
  }, [isOpen, messages.length])

  // Clear unread count when chat is opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0)
    }
  }, [isOpen])

  // Send message to AI backend
  const sendMessage = useCallback(async (content) => {
    if (!content.trim()) return

    setError(null)

    // Add user message immediately
    const userMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    try {
      const response = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: content.trim(),
          visitorId,
          sessionId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      // Update session ID if returned
      if (data.session?.id) {
        setSessionId(data.session.id)
      }

      // Add bot response
      const botMessage = {
        id: `bot_${Date.now()}`,
        role: 'bot',
        content: data.response?.text || 'I apologize, but I could not process your request.',
        timestamp: new Date(),
        quickReplies: data.response?.quickReplies || [],
        data: data.response?.data,
        intent: data.intent,
        confidence: data.confidence,
        responseTime: data.responseTime
      }

      setMessages(prev => [...prev, botMessage])

      // Increment unread if chat is minimized
      if (isMinimized) {
        setUnreadCount(prev => prev + 1)
      }

    } catch (err) {
      console.error('Chat error:', err)
      setError('Unable to connect to assistant. Please try again.')

      // Add error message
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        role: 'bot',
        content: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment or contact us directly at sales@batlokoa.co.za.',
        timestamp: new Date(),
        isError: true,
        quickReplies: ['Try again', 'Contact us']
      }])
    } finally {
      setIsTyping(false)
    }
  }, [visitorId, sessionId, isMinimized])

  // Handle quick reply click
  const handleQuickReply = useCallback((reply) => {
    sendMessage(reply)
  }, [sendMessage])

  // Clear chat history
  const clearChat = useCallback(() => {
    setMessages([])
    setSessionId(null)
    setError(null)
  }, [])

  // Toggle chat open/closed
  const toggleChat = useCallback(() => {
    if (isMinimized) {
      setIsMinimized(false)
    } else {
      setIsOpen(prev => !prev)
    }
  }, [isMinimized])

  // Minimize chat
  const minimizeChat = useCallback(() => {
    setIsMinimized(true)
  }, [])

  // Maximize chat
  const maximizeChat = useCallback(() => {
    setIsMinimized(false)
    setUnreadCount(0)
  }, [])

  // Close chat completely
  const closeChat = useCallback(() => {
    setIsOpen(false)
    setIsMinimized(false)
  }, [])

  const value = {
    isOpen,
    isMinimized,
    messages,
    isTyping,
    error,
    unreadCount,
    sessionId,
    isOffline,
    swReady,
    sendMessage,
    handleQuickReply,
    clearChat,
    toggleChat,
    minimizeChat,
    maximizeChat,
    closeChat,
    setIsOpen
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within ChatProvider')
  }
  return context
}

export default ChatContext

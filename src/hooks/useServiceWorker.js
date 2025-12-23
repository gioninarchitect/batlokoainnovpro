/**
 * useServiceWorker - Hook for service worker registration and management
 * Enables offline capability for the Smart AI chat
 */

import { useState, useEffect, useCallback } from 'react'

export function useServiceWorker() {
  const [isSupported, setIsSupported] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [registration, setRegistration] = useState(null)
  const [error, setError] = useState(null)

  // Check for service worker support
  useEffect(() => {
    setIsSupported('serviceWorker' in navigator)
  }, [])

  // Register service worker
  useEffect(() => {
    if (!isSupported) return

    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })

        setRegistration(reg)
        setIsRegistered(true)

        // Check if service worker is ready
        if (reg.active) {
          setIsReady(true)
          // Pre-cache AI knowledge base
          preCacheAI(reg)
        }

        // Handle updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                setIsReady(true)
                preCacheAI(reg)
              }
            })
          }
        })

        console.log('[SW] Registered successfully')
      } catch (err) {
        console.error('[SW] Registration failed:', err)
        setError(err.message)
      }
    }

    registerSW()
  }, [isSupported])

  // Wait for service worker to be ready
  useEffect(() => {
    if (!isSupported) return

    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg)
      setIsReady(true)
      preCacheAI(reg)
    })
  }, [isSupported])

  // Pre-cache AI knowledge base
  const preCacheAI = useCallback((reg) => {
    if (reg?.active) {
      reg.active.postMessage({ type: 'PRE_CACHE_AI' })
    }
  }, [])

  // Clear all caches
  const clearCache = useCallback(async () => {
    if (!registration?.active) return false

    return new Promise((resolve) => {
      const channel = new MessageChannel()
      channel.port1.onmessage = (event) => {
        resolve(event.data.success)
      }
      registration.active.postMessage(
        { type: 'CLEAR_CACHE' },
        [channel.port2]
      )
    })
  }, [registration])

  // Get cache status
  const getCacheStatus = useCallback(async () => {
    if (!registration?.active) return null

    return new Promise((resolve) => {
      const channel = new MessageChannel()
      channel.port1.onmessage = (event) => {
        resolve(event.data)
      }
      registration.active.postMessage(
        { type: 'GET_CACHE_STATUS' },
        [channel.port2]
      )
    })
  }, [registration])

  // Force update
  const update = useCallback(async () => {
    if (!registration) return false

    try {
      await registration.update()
      return true
    } catch (err) {
      console.error('[SW] Update failed:', err)
      return false
    }
  }, [registration])

  // Unregister
  const unregister = useCallback(async () => {
    if (!registration) return false

    try {
      await registration.unregister()
      setIsRegistered(false)
      setIsReady(false)
      return true
    } catch (err) {
      console.error('[SW] Unregister failed:', err)
      return false
    }
  }, [registration])

  return {
    isSupported,
    isRegistered,
    isReady,
    error,
    clearCache,
    getCacheStatus,
    update,
    unregister
  }
}

export default useServiceWorker

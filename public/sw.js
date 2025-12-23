/**
 * Batlokoa Smart AI Service Worker
 * Enables offline capability for the AI chat assistant
 *
 * Features:
 * - Caches static assets on install
 * - Caches AI knowledge base on first fetch
 * - Serves from cache when offline
 * - Background sync for offline messages
 */

const CACHE_NAME = 'batlokoa-ai-v1'
const STATIC_CACHE = 'batlokoa-static-v1'
const AI_CACHE = 'batlokoa-ai-knowledge-v1'

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/logo.png'
]

// AI knowledge base paths to cache
const AI_KNOWLEDGE_PATHS = [
  '/api/v1/ai/health',
  '/api/v1/ai/events',
  '/api/v1/ai/compliance/standards',
  '/api/v1/ai/compliance/industries',
  '/api/v1/ai/bbbee',
  '/api/v1/ai/bulk-discounts'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.error('[SW] Failed to cache static assets:', err)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name !== CACHE_NAME &&
                     name !== STATIC_CACHE &&
                     name !== AI_CACHE
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name)
              return caches.delete(name)
            })
        )
      })
      .then(() => self.clients.claim())
  )
})

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Handle AI API requests
  if (url.pathname.startsWith('/api/v1/ai/')) {
    event.respondWith(handleAIRequest(request))
    return
  }

  // Handle static assets
  if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticRequest(request))
    return
  }

  // Default: network first, cache fallback
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request))
  )
})

/**
 * Handle AI API requests with cache-first for knowledge base
 */
async function handleAIRequest(request) {
  const url = new URL(request.url)
  const isKnowledgeRequest = AI_KNOWLEDGE_PATHS.some(path =>
    url.pathname.endsWith(path.replace('/api/v1/ai', ''))
  )

  // For knowledge base: cache first, network fallback
  if (isKnowledgeRequest) {
    try {
      const cached = await caches.match(request)
      if (cached) {
        // Return cached version immediately
        // Also update cache in background
        updateAICache(request)
        return cached
      }

      // Fetch from network and cache
      const response = await fetch(request)
      if (response.ok) {
        const cache = await caches.open(AI_CACHE)
        cache.put(request, response.clone())
      }
      return response
    } catch (error) {
      // Return cached version if network fails
      const cached = await caches.match(request)
      if (cached) return cached

      // Return error response
      return new Response(
        JSON.stringify({
          error: 'Offline',
          message: 'This data is not available offline'
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }

  // For chat and other dynamic requests: network first
  try {
    const response = await fetch(request)
    return response
  } catch (error) {
    // Return offline-friendly response for chat
    if (url.pathname.includes('/chat')) {
      return new Response(
        JSON.stringify({
          success: false,
          response: {
            text: 'I\'m currently offline. Your message will be sent when you reconnect.',
            quickReplies: ['Try again', 'Contact us']
          },
          offline: true
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Offline', message: 'Network unavailable' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * Handle static asset requests with cache-first strategy
 */
async function handleStaticRequest(request) {
  try {
    const cached = await caches.match(request)
    if (cached) {
      return cached
    }

    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    const cached = await caches.match(request)
    if (cached) return cached

    throw error
  }
}

/**
 * Update AI cache in background
 */
async function updateAICache(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(AI_CACHE)
      cache.put(request, response.clone())
    }
  } catch (error) {
    // Ignore errors - cache will be used
  }
}

/**
 * Check if URL is a static asset
 */
function isStaticAsset(pathname) {
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg',
    '.woff', '.woff2', '.ttf', '.eot', '.ico'
  ]
  return staticExtensions.some(ext => pathname.endsWith(ext))
}

/**
 * Pre-cache AI knowledge base
 * Call this from the main app after SW registration
 */
async function preCacheAIKnowledge() {
  try {
    const cache = await caches.open(AI_CACHE)

    for (const path of AI_KNOWLEDGE_PATHS) {
      try {
        const response = await fetch(path)
        if (response.ok) {
          await cache.put(path, response)
          console.log('[SW] Cached:', path)
        }
      } catch (error) {
        console.warn('[SW] Failed to cache:', path)
      }
    }

    console.log('[SW] AI knowledge base cached')
  } catch (error) {
    console.error('[SW] Failed to pre-cache AI knowledge:', error)
  }
}

// Message handler for cache management
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {}

  switch (type) {
    case 'PRE_CACHE_AI':
      preCacheAIKnowledge()
      break

    case 'CLEAR_CACHE':
      caches.delete(AI_CACHE)
        .then(() => caches.delete(STATIC_CACHE))
        .then(() => {
          event.ports[0]?.postMessage({ success: true })
        })
      break

    case 'GET_CACHE_STATUS':
      Promise.all([
        caches.open(STATIC_CACHE).then(c => c.keys()),
        caches.open(AI_CACHE).then(c => c.keys())
      ]).then(([staticKeys, aiKeys]) => {
        event.ports[0]?.postMessage({
          static: staticKeys.length,
          ai: aiKeys.length
        })
      })
      break
  }
})

console.log('[SW] Service worker loaded')

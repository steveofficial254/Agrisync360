/**
 * AgriSync 360 Service Worker
 * Handles offline caching and background sync
 */

const CACHE_VERSION = 'v1.0.0'
const STATIC_CACHE = `agrisync-static-${CACHE_VERSION}` 
const DYNAMIC_CACHE = `agrisync-dynamic-${CACHE_VERSION}` 
const API_CACHE = `agrisync-api-${CACHE_VERSION}` 

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// API routes to cache
const CACHEABLE_APIS = [
  '/api/weather/forecast',
  '/api/market/prices',
  '/api/advisory/crop/maize',
  '/api/advisory/crop/beans',
  '/api/advisory/crop/potatoes',
  '/api/advisory/crop/tomatoes',
  '/api/advisory/crop/tea',
  '/api/payments/plans',
]

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing AgriSync 360 Service Worker...')
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.log('[SW] Some assets failed to cache:', err)
      })
    }).then(() => self.skipWaiting())
  )
})

// Activate event — clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new service worker...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => (
            name !== STATIC_CACHE &&
            name !== DYNAMIC_CACHE &&
            name !== API_CACHE
          ))
          .map((name) => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event — cache strategy
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip chrome-extension and non-http requests
  if (!url.protocol.startsWith('http')) return

  // API requests — Network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    const isCacheable = CACHEABLE_APIS.some(
      path => url.pathname.startsWith(path)
    )

    if (isCacheable) {
      event.respondWith(networkFirstWithCache(request, API_CACHE))
      return
    }
    return // Don't cache other API calls
  }

  // Static assets — Cache first
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirstWithNetwork(request, STATIC_CACHE))
    return
  }

  // HTML pages — Network first, serve cached on offline
  if (request.destination === 'document' ||
      request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone()
          caches.open(DYNAMIC_CACHE).then(c => c.put(request, clone))
          return response
        })
        .catch(() => {
          return caches.match(request).then(
            cached => cached || caches.match('/')
          )
        })
    )
    return
  }
})

// Network first — try network, fall back to cache
async function networkFirstWithCache(request, cacheName) {
  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      await cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    const cached = await caches.match(request)
    if (cached) {
      console.log('[SW] Serving from cache (offline):', request.url)
      return cached
    }

    // Return offline response for API
    return new Response(
      JSON.stringify({
        success: false,
        error: 'OFFLINE',
        message: 'No internet connection. Showing cached data.',
        offline: true,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Cache first — serve from cache, update in background
async function cacheFirstWithNetwork(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) {
    // Update cache in background
    fetch(request).then((response) => {
      if (response.ok) {
        caches.open(cacheName).then(c => c.put(request, response))
      }
    }).catch(() => {})

    return cached
  }

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      await cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    return new Response('Offline', { status: 503 })
  }
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('[SW] Background sync triggered')
  }
})

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'AgriSync 360',
      {
        body: data.body || '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: data.tag || 'agrisync-notification',
        data: data.url ? { url: data.url } : {},
        actions: [
          { action: 'view', title: 'View' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
        requireInteraction: data.important || false,
      }
    )
  )
})

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      const existing = windowClients.find(c => c.url === url)
      if (existing) return existing.focus()
      return clients.openWindow(url)
    })
  )
})

console.log('[SW] AgriSync 360 Service Worker loaded')

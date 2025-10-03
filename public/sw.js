// Dynamic versioning - will be replaced during build
const BUILD_VERSION = '5977388-1759399057539'
const CACHE_NAME = `grabtogo-${BUILD_VERSION}`
const STATIC_CACHE_NAME = `grabtogo-static-${BUILD_VERSION}`
const DYNAMIC_CACHE_NAME = `grabtogo-dynamic-${BUILD_VERSION}`

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  // Add more static assets as needed
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...', 'Version:', BUILD_VERSION)

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        // Force immediate activation of new service worker
        return self.skipWaiting()
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...', 'Version:', BUILD_VERSION)

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // Delete ALL old caches that don't match current version
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('grabtogo-') &&
                cacheName !== STATIC_CACHE_NAME &&
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        // Take control of all pages immediately
        console.log('Service Worker claiming all clients')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
    return
  }

  // Handle static assets (excluding SVG and other non-cacheable files)
  if (url.pathname.startsWith('/_next/static/') ||
      (url.pathname.includes('.') &&
       !url.pathname.startsWith('/api/') &&
       !url.pathname.endsWith('.svg') &&
       !url.pathname.endsWith('.xml'))) {
    event.respondWith(handleStaticAsset(request))
    return
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request))
    return
  }

  // Default handling
  event.respondWith(
    caches.match(request)
      .then((response) => {
        return response || fetch(request)
      })
      .catch(() => {
        return caches.match('/offline.html')
      })
  )
})

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url)

  try {
    // Always try network first for API requests
    const response = await fetch(request)

    // Cache successful GET requests (excluding auth and sensitive endpoints)
    if (response.ok &&
        !url.pathname.includes('/auth/') &&
        !url.pathname.includes('/payments/') &&
        !url.pathname.includes('/admin/')) {

      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      // Clone response as it can only be consumed once
      cache.put(request, response.clone())
    }

    return response
  } catch (error) {
    console.log('API request failed, trying cache:', url.pathname)

    // Try to serve from cache for non-sensitive endpoints
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Return offline response for failed API requests
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This feature requires an internet connection'
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Fetch from network and cache
    const response = await fetch(request)
    if (response.ok && response.status === 200) {
      // Only cache JavaScript, CSS, and image files
      const contentType = response.headers.get('content-type') || ''
      const cacheableTypes = ['javascript', 'css', 'image/', 'font']
      const shouldCache = cacheableTypes.some(type => contentType.includes(type))

      if (shouldCache) {
        const cache = await caches.open(STATIC_CACHE_NAME)
        cache.put(request, response.clone())
      }
    }

    return response
  } catch (error) {
    console.log('Static asset request failed:', request.url, error)
    return new Response('Asset not available offline', { status: 404 })
  }
}

// Handle navigation requests - ALWAYS use network first for fresh content
async function handleNavigation(request) {
  try {
    // Try network first for navigation to always get fresh HTML
    const response = await fetch(request)

    // Cache successful navigation responses for offline fallback
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, response.clone())
    }

    return response
  } catch (error) {
    console.log('Navigation request failed, trying cache then offline page')

    // Try cache first
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Serve offline page as last resort
    const offlinePage = await caches.match('/offline.html')
    return offlinePage || new Response('Offline', { status: 503 })
  }
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  console.log('Performing background sync...')
  // Implement background sync logic here
  // For example, retry failed API requests
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event)

  const options = {
    body: 'You have new updates!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icons/open-96x96.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close-96x96.png'
      }
    ]
  }

  if (event.data) {
    try {
      const pushData = event.data.json()
      options.body = pushData.message || options.body
      options.data = pushData.data || options.data

      if (pushData.title) {
        options.title = pushData.title
      }
    } catch (error) {
      console.error('Error parsing push data:', error)
    }
  }

  event.waitUntil(
    self.registration.showNotification('GrabtoGo', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)

  event.notification.close()

  if (event.action === 'close') {
    return
  }

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen)
            return client.focus()
          }
        }

        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

// Message handling for update checks and manual actions
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    // Force the waiting service worker to become active
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    // Send current version to client
    event.ports[0].postMessage({ version: BUILD_VERSION })
  }

  if (event.data && event.data.type === 'SHARE_TARGET') {
    console.log('Share target received:', event.data)
    // Handle shared content
  }
})

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-analytics') {
    event.waitUntil(updateAnalytics())
  }
})

async function updateAnalytics() {
  try {
    // Update analytics data in the background
    console.log('Updating analytics in background...')
    // This would make API calls to sync data
  } catch (error) {
    console.error('Background analytics update failed:', error)
  }
}
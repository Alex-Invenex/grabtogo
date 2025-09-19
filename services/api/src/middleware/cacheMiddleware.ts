import { Request, Response, NextFunction } from 'express'
import { cache, CacheTTL } from '../utils/cache'

interface CacheOptions {
  ttl?: number
  keyGenerator?: (req: Request) => string
  condition?: (req: Request) => boolean
  skipCache?: (req: Request) => boolean
}

/**
 * Middleware to cache GET requests
 */
export function cacheMiddleware(options: CacheOptions = {}) {
  const {
    ttl = CacheTTL.MEDIUM,
    keyGenerator = defaultKeyGenerator,
    condition = () => true,
    skipCache = () => false
  } = options

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next()
    }

    // Check if caching should be skipped
    if (skipCache(req) || !condition(req)) {
      return next()
    }

    const cacheKey = keyGenerator(req)

    try {
      // Try to get from cache
      const cachedData = await cache.get(cacheKey)

      if (cachedData) {
        // Set cache headers
        res.setHeader('X-Cache', 'HIT')
        res.setHeader('Cache-Control', `public, max-age=${ttl}`)

        return res.json(cachedData)
      }

      // Cache miss - intercept response
      res.setHeader('X-Cache', 'MISS')

      // Store original json method
      const originalJson = res.json

      // Override json method to cache the response
      res.json = function(data: any) {
        // Cache the response data
        cache.set(cacheKey, data, ttl).catch(error => {
          console.error('Failed to cache response:', error)
        })

        // Set cache headers
        res.setHeader('Cache-Control', `public, max-age=${ttl}`)

        // Call original json method
        return originalJson.call(this, data)
      }

      next()
    } catch (error) {
      console.error('Cache middleware error:', error)
      next()
    }
  }
}

/**
 * Default cache key generator
 */
function defaultKeyGenerator(req: Request): string {
  const { originalUrl, query } = req
  const userId = req.user?.id || 'anonymous'
  const queryString = Object.keys(query).length > 0 ? JSON.stringify(query) : ''

  return `api:${originalUrl}:${userId}:${queryString}`
}

/**
 * Cache invalidation middleware
 */
export function invalidateCacheMiddleware(patterns: string[] | ((req: Request) => string[])) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original response methods
    const originalJson = res.json
    const originalSend = res.send

    // Function to invalidate cache
    const invalidateCache = async () => {
      try {
        const patternsToInvalidate = typeof patterns === 'function' ? patterns(req) : patterns

        for (const pattern of patternsToInvalidate) {
          await cache.delPattern(pattern)
        }
      } catch (error) {
        console.error('Cache invalidation error:', error)
      }
    }

    // Override response methods to invalidate cache on successful operations
    res.json = function(data: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        invalidateCache()
      }
      return originalJson.call(this, data)
    }

    res.send = function(data: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        invalidateCache()
      }
      return originalSend.call(this, data)
    }

    next()
  }
}

/**
 * Specific cache configurations for different endpoints
 */
export const CacheConfigs = {
  // Product listings - cache for 30 minutes
  products: {
    ttl: CacheTTL.MEDIUM,
    keyGenerator: (req: Request) => {
      const { vendorId, category, page = 1, limit = 20 } = req.query
      return `products:${vendorId || 'all'}:${category || 'all'}:${page}:${limit}`
    },
    condition: (req: Request) => !req.user || req.user.role === 'CUSTOMER'
  },

  // Vendor listings - cache for 1 hour
  vendors: {
    ttl: CacheTTL.LONG,
    keyGenerator: (req: Request) => {
      const { location, businessType, page = 1, limit = 20 } = req.query
      return `vendors:${location || 'all'}:${businessType || 'all'}:${page}:${limit}`
    }
  },

  // User profile - cache for 5 minutes
  profile: {
    ttl: CacheTTL.SHORT,
    keyGenerator: (req: Request) => `profile:${req.user?.id}`,
    condition: (req: Request) => !!req.user
  },

  // Search results - cache for 30 minutes
  search: {
    ttl: CacheTTL.MEDIUM,
    keyGenerator: (req: Request) => {
      const { q, category, location, minPrice, maxPrice } = req.query
      return `search:${q}:${category || 'all'}:${location || 'all'}:${minPrice || 0}:${maxPrice || 'max'}`
    }
  },

  // Analytics - cache for 1 hour
  analytics: {
    ttl: CacheTTL.LONG,
    keyGenerator: (req: Request) => {
      const { period = '30d' } = req.query
      return `analytics:${req.user?.id}:${period}`
    },
    condition: (req: Request) => req.user?.role === 'VENDOR'
  }
}

/**
 * Cache invalidation patterns for different operations
 */
export const CacheInvalidationPatterns = {
  // When product is created/updated/deleted
  product: (req: Request) => [
    `products:${req.body.vendorId || req.params.vendorId}:*`,
    `products:all:*`,
    `search:*`,
    `vendor:${req.body.vendorId || req.params.vendorId}`
  ],

  // When vendor is created/updated
  vendor: (req: Request) => [
    `vendors:*`,
    `vendor:${req.params.vendorId || req.user?.vendorId}`,
    `search:*`
  ],

  // When offer is created/updated/deleted
  offer: (req: Request) => [
    `offers:${req.body.vendorId || req.params.vendorId}`,
    `vendor:${req.body.vendorId || req.params.vendorId}`,
    `products:${req.body.vendorId || req.params.vendorId}:*`
  ],

  // When order is created/updated
  order: (req: Request) => [
    `orders:user:${req.user?.id}:*`,
    `orders:vendor:${req.body.vendorId}:*`,
    `analytics:${req.body.vendorId}:*`,
    `analytics:${req.user?.id}:*`
  ],

  // When user profile is updated
  userProfile: (req: Request) => [
    `profile:${req.user?.id}`,
    `user:${req.user?.id}`
  ]
}
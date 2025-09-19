import Redis from 'ioredis'

class CacheManager {
  private redis: Redis

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      lazyConnect: true,
      family: 4,
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000,
    })

    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error)
    })

    this.redis.on('connect', () => {
      console.log('✅ Redis connected successfully')
    })
  }

  /**
   * Cache data with optional TTL
   */
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value)
      await this.redis.setex(key, ttlSeconds, serializedValue)
    } catch (error) {
      console.error('Cache set error:', error)
      throw error
    }
  }

  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key)
      if (!value) return null
      return JSON.parse(value) as T
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  /**
   * Delete cached data
   */
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key)
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error)
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key)
      return result === 1
    } catch (error) {
      console.error('Cache exists error:', error)
      return false
    }
  }

  /**
   * Increment counter with TTL
   */
  async increment(key: string, ttlSeconds: number = 3600): Promise<number> {
    try {
      const pipeline = this.redis.pipeline()
      pipeline.incr(key)
      pipeline.expire(key, ttlSeconds)
      const results = await pipeline.exec()
      return results?.[0]?.[1] as number || 0
    } catch (error) {
      console.error('Cache increment error:', error)
      return 0
    }
  }

  /**
   * Set data in hash
   */
  async hset(key: string, field: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value)
      await this.redis.hset(key, field, serializedValue)
      if (ttlSeconds) {
        await this.redis.expire(key, ttlSeconds)
      }
    } catch (error) {
      console.error('Cache hset error:', error)
    }
  }

  /**
   * Get data from hash
   */
  async hget<T>(key: string, field: string): Promise<T | null> {
    try {
      const value = await this.redis.hget(key, field)
      if (!value) return null
      return JSON.parse(value) as T
    } catch (error) {
      console.error('Cache hget error:', error)
      return null
    }
  }

  /**
   * Get all hash fields
   */
  async hgetall<T>(key: string): Promise<Record<string, T> | null> {
    try {
      const hash = await this.redis.hgetall(key)
      if (!hash || Object.keys(hash).length === 0) return null

      const result: Record<string, T> = {}
      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value) as T
      }
      return result
    } catch (error) {
      console.error('Cache hgetall error:', error)
      return null
    }
  }

  /**
   * Add to set
   */
  async sadd(key: string, member: string, ttlSeconds?: number): Promise<void> {
    try {
      await this.redis.sadd(key, member)
      if (ttlSeconds) {
        await this.redis.expire(key, ttlSeconds)
      }
    } catch (error) {
      console.error('Cache sadd error:', error)
    }
  }

  /**
   * Check if member is in set
   */
  async sismember(key: string, member: string): Promise<boolean> {
    try {
      const result = await this.redis.sismember(key, member)
      return result === 1
    } catch (error) {
      console.error('Cache sismember error:', error)
      return false
    }
  }

  /**
   * Get all set members
   */
  async smembers(key: string): Promise<string[]> {
    try {
      return await this.redis.smembers(key)
    } catch (error) {
      console.error('Cache smembers error:', error)
      return []
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    try {
      await this.redis.quit()
    } catch (error) {
      console.error('Redis disconnect error:', error)
    }
  }
}

// Singleton instance
export const cache = new CacheManager()

// Cache key generators
export const CacheKeys = {
  user: (userId: string) => `user:${userId}`,
  vendor: (vendorId: string) => `vendor:${vendorId}`,
  product: (productId: string) => `product:${productId}`,
  products: (vendorId: string, page: number = 1) => `products:${vendorId}:page:${page}`,
  vendorsList: (page: number = 1, filters?: string) => `vendors:page:${page}${filters ? ':' + filters : ''}`,
  userOrders: (userId: string, page: number = 1) => `orders:user:${userId}:page:${page}`,
  vendorOrders: (vendorId: string, page: number = 1) => `orders:vendor:${vendorId}:page:${page}`,
  offers: (vendorId: string) => `offers:${vendorId}`,
  analytics: (vendorId: string, period: string) => `analytics:${vendorId}:${period}`,
  rateLimit: (ip: string, endpoint: string) => `rate_limit:${ip}:${endpoint}`,
  session: (sessionId: string) => `session:${sessionId}`,
  searchResults: (query: string, filters?: string) => `search:${query}${filters ? ':' + filters : ''}`,
}

// Cache TTL constants (in seconds)
export const CacheTTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400, // 24 hours
  RATE_LIMIT: 60,   // 1 minute
  SESSION: 2592000, // 30 days
}
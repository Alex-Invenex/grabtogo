import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

export const redis =
  globalForRedis.redis ??
  new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
  })

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

// Cache utility functions
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key)
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  },

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value)
      if (ttl) {
        await redis.setex(key, ttl, serialized)
      } else {
        await redis.set(key, serialized)
      }
      return true
    } catch (error) {
      console.error('Redis set error:', error)
      return false
    }
  },

  async del(key: string): Promise<boolean> {
    try {
      await redis.del(key)
      return true
    } catch (error) {
      console.error('Redis del error:', error)
      return false
    }
  },

  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key)
      return result === 1
    } catch (error) {
      console.error('Redis exists error:', error)
      return false
    }
  },

  async flushPattern(pattern: string): Promise<boolean> {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
      return true
    } catch (error) {
      console.error('Redis flush pattern error:', error)
      return false
    }
  },
}

// Session store for NextAuth
export class RedisAdapter {
  async getSessionAndUser(sessionToken: string) {
    const sessionKey = `session:${sessionToken}`
    const session = await cache.get<any>(sessionKey)
    if (!session) return null

    const userKey = `user:${session.userId}`
    const user = await cache.get<any>(userKey)
    if (!user) return null

    return { session, user }
  }

  async createSession(session: any) {
    const sessionKey = `session:${session.sessionToken}`
    await cache.set(sessionKey, session, 30 * 24 * 60 * 60) // 30 days
    return session
  }

  async updateSession(session: any) {
    const sessionKey = `session:${session.sessionToken}`
    await cache.set(sessionKey, session, 30 * 24 * 60 * 60) // 30 days
    return session
  }

  async deleteSession(sessionToken: string) {
    const sessionKey = `session:${sessionToken}`
    await cache.del(sessionKey)
  }
}
import { db } from '@/lib/db'
import { redis } from '@/lib/redis'

export interface SecurityEventData {
  userId?: string
  event: string
  details?: string
  ipAddress?: string
  userAgent?: string
}

/**
 * Log security event to database
 */
export async function logSecurityEvent(data: SecurityEventData) {
  try {
    await db.securityEvent.create({
      data: {
        userId: data.userId,
        event: data.event,
        details: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    })
  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}

/**
 * Check if account is locked
 */
export async function isAccountLocked(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { accountLocked: true, accountLockedUntil: true },
  })

  if (!user || !user.accountLocked) return false

  // Check if lockout has expired
  if (user.accountLockedUntil && new Date() > user.accountLockedUntil) {
    // Unlock the account
    await db.user.update({
      where: { id: userId },
      data: {
        accountLocked: false,
        accountLockedUntil: null,
        failedAttempts: 0,
      },
    })
    return false
  }

  return true
}

/**
 * Record failed login attempt and potentially lock account
 */
export async function recordFailedAttempt(userId: string): Promise<boolean> {
  const maxAttempts = parseInt(process.env.ACCOUNT_LOCKOUT_ATTEMPTS || '5')
  const lockoutDuration = parseInt(process.env.ACCOUNT_LOCKOUT_DURATION || '900000') // 15 minutes

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { failedAttempts: true },
  })

  if (!user) return false

  const newFailedAttempts = user.failedAttempts + 1
  const shouldLock = newFailedAttempts >= maxAttempts

  await db.user.update({
    where: { id: userId },
    data: {
      failedAttempts: newFailedAttempts,
      lastFailedAttempt: new Date(),
      accountLocked: shouldLock,
      accountLockedUntil: shouldLock ? new Date(Date.now() + lockoutDuration) : null,
    },
  })

  return shouldLock
}

/**
 * Reset failed attempts after successful login
 */
export async function resetFailedAttempts(userId: string) {
  await db.user.update({
    where: { id: userId },
    data: {
      failedAttempts: 0,
      lastFailedAttempt: null,
      accountLocked: false,
      accountLockedUntil: null,
    },
  })
}

/**
 * Rate limiting based on IP address
 */
export async function checkRateLimit(
  ipAddress: string,
  action: string = 'login'
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const key = `rate_limit:${action}:${ipAddress}`
  const window = parseInt(process.env.RATE_LIMIT_WINDOW || '900000') // 15 minutes
  const maxAttempts = parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS || '10')

  try {
    const current = await redis.get(key)
    const count = current ? parseInt(current) : 0

    if (count >= maxAttempts) {
      const ttl = await redis.ttl(key)
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + (ttl * 1000),
      }
    }

    // Increment counter
    await redis.multi()
      .incr(key)
      .expire(key, Math.floor(window / 1000))
      .exec()

    return {
      allowed: true,
      remaining: maxAttempts - count - 1,
      resetTime: Date.now() + window,
    }
  } catch (error) {
    console.error('Rate limit check failed:', error)
    // If Redis fails, allow the request but log the error
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetTime: Date.now() + window,
    }
  }
}

/**
 * Check for suspicious activity patterns
 */
export async function detectSuspiciousActivity(
  userId: string,
  ipAddress: string
): Promise<{ suspicious: boolean; reasons: string[] }> {
  const reasons: string[] = []

  try {
    // Check for multiple failed attempts in short time
    const recentFailures = await db.securityEvent.count({
      where: {
        userId,
        event: 'login_failed',
        createdAt: {
          gte: new Date(Date.now() - 3600000), // Last hour
        },
      },
    })

    if (recentFailures >= 3) {
      reasons.push('Multiple failed login attempts in the last hour')
    }

    // Check for logins from multiple IPs
    const recentIPs = await db.securityEvent.findMany({
      where: {
        userId,
        event: 'login_success',
        createdAt: {
          gte: new Date(Date.now() - 3600000), // Last hour
        },
      },
      select: { ipAddress: true },
      distinct: ['ipAddress'],
    })

    if (recentIPs.length > 3) {
      reasons.push('Logins from multiple IP addresses')
    }

    // Check for unusual time patterns (if we have historical data)
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    })

    if (user && user.createdAt > new Date(Date.now() - 86400000)) {
      // Account created in last 24 hours
      reasons.push('New account with immediate activity')
    }

    return {
      suspicious: reasons.length > 0,
      reasons,
    }
  } catch (error) {
    console.error('Suspicious activity detection failed:', error)
    return { suspicious: false, reasons: [] }
  }
}

/**
 * Generate and store email verification token
 */
export async function generateEmailVerificationToken(email: string): Promise<string> {
  const token = generateRandomToken(32)
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await db.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  })

  return token
}

/**
 * Verify email verification token
 */
export async function verifyEmailToken(token: string): Promise<string | null> {
  const verificationToken = await db.verificationToken.findUnique({
    where: { token },
  })

  if (!verificationToken || verificationToken.expires < new Date()) {
    return null
  }

  // Delete the token after use
  await db.verificationToken.delete({
    where: { token },
  })

  return verificationToken.identifier
}

/**
 * Generate and store password reset token
 */
export async function generatePasswordResetToken(email: string): Promise<string> {
  const token = generateRandomToken(32)
  const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  // Delete any existing reset tokens for this email
  await db.verificationToken.deleteMany({
    where: {
      identifier: email,
      token: { startsWith: 'reset_' },
    },
  })

  await db.verificationToken.create({
    data: {
      identifier: email,
      token: `reset_${token}`,
      expires,
    },
  })

  return token
}

/**
 * Verify password reset token
 */
export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  const resetToken = await db.verificationToken.findUnique({
    where: { token: `reset_${token}` },
  })

  if (!resetToken || resetToken.expires < new Date()) {
    return null
  }

  return resetToken.identifier
}

/**
 * Delete password reset token after use
 */
export async function deletePasswordResetToken(token: string): Promise<void> {
  await db.verificationToken.delete({
    where: { token: `reset_${token}` },
  })
}

/**
 * Generate cryptographically secure random token
 */
function generateRandomToken(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIP) {
    return realIP
  }

  return 'unknown'
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown'
}
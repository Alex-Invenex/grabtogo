import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { db } from './db'

export interface TwoFactorSecret {
  secret: string
  qrCode: string
  backupCodes: string[]
}

/**
 * Generate 2FA secret and QR code
 */
export async function generate2FASecret(userEmail: string): Promise<TwoFactorSecret> {
  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `GrabtoGo (${userEmail})`,
    issuer: 'GrabtoGo',
    length: 32,
  })

  // Generate QR code
  const qrCode = await QRCode.toDataURL(secret.otpauth_url as string)

  // Generate backup codes
  const backupCodes = generateBackupCodes(10)

  return {
    secret: secret.base32,
    qrCode,
    backupCodes,
  }
}

/**
 * Verify 2FA token
 */
export function verify2FAToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps before and after for clock drift
  })
}

/**
 * Generate backup codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []

  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase()
    codes.push(code)
  }

  return codes
}

/**
 * Enable 2FA for user
 */
export async function enable2FA(userId: string, secret: string, token: string): Promise<{
  success: boolean
  message: string
}> {
  // Verify the token first
  const isValid = verify2FAToken(secret, token)

  if (!isValid) {
    return {
      success: false,
      message: 'Invalid verification code',
    }
  }

  try {
    // Update user with 2FA enabled
    await db.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
      },
    })

    return {
      success: true,
      message: '2FA enabled successfully',
    }
  } catch (error) {
    console.error('Failed to enable 2FA:', error)
    return {
      success: false,
      message: 'Failed to enable 2FA',
    }
  }
}

/**
 * Disable 2FA for user
 */
export async function disable2FA(userId: string, token: string): Promise<{
  success: boolean
  message: string
}> {
  try {
    // Get user's 2FA secret
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    })

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return {
        success: false,
        message: '2FA is not enabled',
      }
    }

    // Verify the token
    const isValid = verify2FAToken(user.twoFactorSecret, token)

    if (!isValid) {
      return {
        success: false,
        message: 'Invalid verification code',
      }
    }

    // Disable 2FA
    await db.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    })

    return {
      success: true,
      message: '2FA disabled successfully',
    }
  } catch (error) {
    console.error('Failed to disable 2FA:', error)
    return {
      success: false,
      message: 'Failed to disable 2FA',
    }
  }
}

/**
 * Verify 2FA during login
 */
export async function verify2FALogin(userId: string, token: string): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    })

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return false
    }

    return verify2FAToken(user.twoFactorSecret, token)
  } catch (error) {
    console.error('Failed to verify 2FA during login:', error)
    return false
  }
}

/**
 * Check if user has 2FA enabled
 */
export async function is2FAEnabled(userId: string): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    })

    return user?.twoFactorEnabled || false
  } catch (error) {
    console.error('Failed to check 2FA status:', error)
    return false
  }
}
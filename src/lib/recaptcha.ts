/**
 * Verify reCAPTCHA v3 token on server-side
 */
export async function verifyRecaptcha(token: string, action: string): Promise<{
  success: boolean
  score?: number
  error?: string
}> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY

  if (!secretKey) {
    console.error('reCAPTCHA secret key not configured')
    return {
      success: false,
      error: 'reCAPTCHA not configured',
    }
  }

  try {
    const response = await fetch(
      'https://www.google.com/recaptcha/api/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `secret=${secretKey}&response=${token}`,
      }
    )

    const data = await response.json()

    // Check if verification was successful
    if (!data.success) {
      return {
        success: false,
        error: 'reCAPTCHA verification failed',
      }
    }

    // Check if action matches (optional but recommended)
    if (data.action && data.action !== action) {
      return {
        success: false,
        error: 'reCAPTCHA action mismatch',
      }
    }

    // reCAPTCHA v3 returns a score between 0.0 and 1.0
    // 0.0 is very likely a bot, 1.0 is very likely a human
    // Recommended threshold is 0.5
    const score = data.score || 0

    if (score < 0.5) {
      return {
        success: false,
        score,
        error: 'Low reCAPTCHA score - possible bot activity',
      }
    }

    return {
      success: true,
      score,
    }
  } catch (error) {
    console.error('reCAPTCHA verification error:', error)
    return {
      success: false,
      error: 'Failed to verify reCAPTCHA',
    }
  }
}

/**
 * Verify reCAPTCHA with custom threshold
 */
export async function verifyRecaptchaWithThreshold(
  token: string,
  action: string,
  threshold: number = 0.5
): Promise<{
  success: boolean
  score?: number
  error?: string
}> {
  const result = await verifyRecaptcha(token, action)

  if (!result.success) {
    return result
  }

  if (result.score && result.score < threshold) {
    return {
      success: false,
      score: result.score,
      error: `reCAPTCHA score ${result.score} below threshold ${threshold}`,
    }
  }

  return result
}
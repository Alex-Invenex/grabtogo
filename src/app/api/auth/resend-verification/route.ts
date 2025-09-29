import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { generateEmailVerificationToken, checkRateLimit, logSecurityEvent } from '@/lib/security'
import { sendVerificationEmail } from '@/lib/email'
import { emailSchema } from '@/lib/password'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = emailSchema.parse(body)

    // Rate limiting for resend verification
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'

    const rateLimit = await checkRateLimit(ipAddress, 'resend_verification')
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Please wait before requesting another verification email',
          resetTime: rateLimit.resetTime
        },
        { status: 429 }
      )
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        emailVerified: true,
        isActive: true,
        createdAt: true
      },
    })

    if (!user) {
      // Don't reveal that user doesn't exist for security
      return NextResponse.json(
        { message: 'If an account with that email exists, a verification email will be sent.' },
        { status: 200 }
      )
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      )
    }

    // Check if user is too new (prevent spam)
    const accountAge = Date.now() - user.createdAt.getTime()
    const oneMinute = 60 * 1000

    if (accountAge < oneMinute) {
      return NextResponse.json(
        {
          error: 'Please wait a moment before requesting a new verification email',
          message: 'Account too new'
        },
        { status: 429 }
      )
    }

    // Delete any existing verification tokens for this email
    await db.verificationToken.deleteMany({
      where: {
        identifier: email,
        token: { not: { startsWith: 'reset_' } }
      },
    })

    // Generate new verification token
    const token = await generateEmailVerificationToken(email)

    // Send verification email
    const emailSent = await sendVerificationEmail(email, token, user.name || undefined)

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      )
    }

    // Log security event
    await logSecurityEvent({
      userId: user.id,
      event: 'verification_email_resent',
      details: JSON.stringify({ email }),
      ipAddress,
      userAgent: request.headers.get('user-agent') || 'unknown',
    })

    return NextResponse.json(
      {
        message: 'Verification email sent successfully',
        email: email
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
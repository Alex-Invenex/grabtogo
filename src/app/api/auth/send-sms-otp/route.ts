import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationOTP, formatPhoneNumber } from '@/lib/sms'
import { verifyRecaptcha } from '@/lib/recaptcha'
import { checkRateLimit } from '@/lib/security'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  phoneNumber: z.string().min(10, 'Phone number is required'),
  recaptchaToken: z.string().min(1, 'reCAPTCHA token is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, recaptchaToken } = schema.parse(body)

    // Format phone number
    const formattedPhone = formatPhoneNumber(phoneNumber)

    // Verify reCAPTCHA
    const recaptchaResult = await verifyRecaptcha(recaptchaToken, 'send_sms_otp')

    if (!recaptchaResult.success) {
      return NextResponse.json(
        { error: recaptchaResult.error || 'reCAPTCHA verification failed' },
        { status: 400 }
      )
    }

    // Rate limiting
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimit = await checkRateLimit(ipAddress, 'sms_otp')

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many OTP requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Send OTP
    const result = await sendVerificationOTP(formattedPhone)

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    })
  } catch (error) {
    console.error('Send SMS OTP error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    )
  }
}

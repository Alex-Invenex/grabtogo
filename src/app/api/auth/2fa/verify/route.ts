import { NextRequest, NextResponse } from 'next/server'
import { verify2FALogin } from '@/lib/two-factor'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  token: z.string().length(6, 'Token must be 6 digits'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, token } = schema.parse(body)

    // Verify 2FA token
    const isValid = await verify2FALogin(userId, token)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '2FA verified successfully',
    })
  } catch (error) {
    console.error('Verify 2FA error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to verify 2FA' },
      { status: 500 }
    )
  }
}

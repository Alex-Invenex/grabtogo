import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { enable2FA } from '@/lib/two-factor'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  secret: z.string().min(1, 'Secret is required'),
  token: z.string().length(6, 'Token must be 6 digits'),
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { secret, token } = schema.parse(body)

    // Enable 2FA
    const result = await enable2FA(session.user.id, secret, token)

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
    console.error('Enable 2FA error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to enable 2FA' },
      { status: 500 }
    )
  }
}

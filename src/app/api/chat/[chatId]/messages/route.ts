import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { cache } from '@/lib/redis'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const getMessagesSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  before: z.string().optional(), // Message ID for pagination
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { chatId } = await params
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    const validatedParams = getMessagesSchema.parse(queryParams)

    // Verify user has access to this chat
    const chatAccess = await db.chatParticipant.findFirst({
      where: {
        chatId,
        userId: session.user.id!
      }
    })

    if (!chatAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const page = parseInt(validatedParams.page || '1')
    const limit = parseInt(validatedParams.limit || '50')
    const skip = (page - 1) * limit

    // Create cache key
    const cacheKey = `messages:chat:${chatId}:${JSON.stringify({
      page,
      limit,
      before: validatedParams.before,
    })}`

    // Try cache first (1 minute cache for messages)
    const cached = await cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Build where clause
    const where: any = { chatId }

    if (validatedParams.before) {
      where.createdAt = {
        lt: new Date(validatedParams.before)
      }
    }

    // Get messages
    const [messages, total] = await Promise.all([
      db.chatMessage.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
              role: true,
            }
          },
          receiver: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.chatMessage.count({ where: { chatId } }),
    ])

    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    const result = {
      data: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
      chatId,
    }

    // Cache for 1 minute
    await cache.set(cacheKey, result, 60)

    return NextResponse.json(result)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Get messages error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

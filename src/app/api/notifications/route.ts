import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { cache } from '@/lib/redis'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createNotificationSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(['order', 'message', 'review', 'vendor', 'system']),
  title: z.string().min(1),
  message: z.string().min(1),
  data: z.record(z.string(), z.any()).optional(),
})

const getNotificationsSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  type: z.enum(['order', 'message', 'review', 'vendor', 'system']).optional(),
  isRead: z.enum(['true', 'false']).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Only admins and vendors can create notifications for other users
    const userRole = (session.user as any).role
    if (userRole !== 'ADMIN' && userRole !== 'VENDOR') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createNotificationSchema.parse(body)

    // Create notification
    const notification = await db.notification.create({
      data: {
        userId: validatedData.userId,
        type: validatedData.type,
        title: validatedData.title,
        message: validatedData.message,
        data: validatedData.data ? JSON.stringify(validatedData.data) : null,
      }
    })

    // Clear user's notifications cache
    await cache.flushPattern(`notifications:user:${validatedData.userId}:*`)

    // Send real-time notification via Socket.io
    if (global.io) {
      global.io.to(`user:${validatedData.userId}`).emit('new-notification', {
        ...notification,
        data: validatedData.data
      })
    }

    return NextResponse.json({
      message: 'Notification created successfully',
      notification: {
        ...notification,
        data: validatedData.data
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Create notification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    const validatedParams = getNotificationsSchema.parse(params)

    const page = parseInt(validatedParams.page || '1')
    const limit = parseInt(validatedParams.limit || '20')
    const skip = (page - 1) * limit

    // Create cache key
    const cacheKey = `notifications:user:${session.user.id}:${JSON.stringify({
      page,
      limit,
      type: validatedParams.type,
      isRead: validatedParams.isRead,
    })}`

    // Try cache first
    const cached = await cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Build where clause
    const where: any = {
      userId: session.user.id!
    }

    if (validatedParams.type) {
      where.type = validatedParams.type
    }

    if (validatedParams.isRead) {
      where.isRead = validatedParams.isRead === 'true'
    }

    // Get notifications
    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.notification.count({ where }),
      db.notification.count({
        where: {
          userId: session.user.id!,
          isRead: false
        }
      })
    ])

    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    // Parse JSON data for each notification
    const parsedNotifications = notifications.map(notification => ({
      ...notification,
      data: notification.data ? JSON.parse(notification.data) : null
    }))

    const result = {
      data: parsedNotifications,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
      unreadCount,
    }

    // Cache for 2 minutes
    await cache.set(cacheKey, result, 120)

    return NextResponse.json(result)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Get notifications error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

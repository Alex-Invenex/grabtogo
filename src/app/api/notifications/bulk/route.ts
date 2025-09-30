import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { cache } from '@/lib/redis'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const bulkActionSchema = z.object({
  action: z.enum(['mark_all_read', 'delete_all_read', 'delete_all']),
  notificationIds: z.array(z.string()).optional(),
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

    const body = await request.json()
    const { action, notificationIds } = bulkActionSchema.parse(body)

    let result

    switch (action) {
      case 'mark_all_read':
        if (notificationIds && notificationIds.length > 0) {
          // Mark specific notifications as read
          result = await db.notification.updateMany({
            where: {
              id: { in: notificationIds },
              userId: session.user.id!
            },
            data: {
              isRead: true,
              readAt: new Date()
            }
          })
        } else {
          // Mark all notifications as read
          result = await db.notification.updateMany({
            where: {
              userId: session.user.id!,
              isRead: false
            },
            data: {
              isRead: true,
              readAt: new Date()
            }
          })
        }
        break

      case 'delete_all_read':
        result = await db.notification.deleteMany({
          where: {
            userId: session.user.id!,
            isRead: true
          }
        })
        break

      case 'delete_all':
        if (notificationIds && notificationIds.length > 0) {
          // Delete specific notifications
          result = await db.notification.deleteMany({
            where: {
              id: { in: notificationIds },
              userId: session.user.id!
            }
          })
        } else {
          // Delete all notifications
          result = await db.notification.deleteMany({
            where: {
              userId: session.user.id!
            }
          })
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Clear user's notifications cache
    await cache.flushPattern(`notifications:user:${session.user.id}:*`)

    return NextResponse.json({
      message: `${action} completed successfully`,
      affected: result.count
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Bulk notification action error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

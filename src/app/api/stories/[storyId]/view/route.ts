import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { cache } from '@/lib/redis'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { storyId } = await params

    // Verify story exists and is active
    const story = await db.vendorStory.findUnique({
      where: { id: storyId },
      select: {
        id: true,
        vendorId: true,
        isActive: true,
        expiresAt: true,
        viewCount: true,
      }
    })

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }

    if (!story.isActive || story.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Story is no longer available' },
        { status: 410 }
      )
    }

    // Don't count views from the story owner
    if (story.vendorId === session.user.id!) {
      return NextResponse.json({
        message: 'View not counted for story owner',
        viewCount: story.viewCount
      })
    }

    // Check if user already viewed this story
    const existingView = await db.storyView.findUnique({
      where: {
        storyId_userId: {
          storyId,
          userId: session.user.id!
        }
      }
    })

    if (existingView) {
      return NextResponse.json({
        message: 'Story already viewed',
        viewCount: story.viewCount
      })
    }

    // Create view record and increment count
    await Promise.all([
      db.storyView.create({
        data: {
          storyId,
          userId: session.user.id!
        }
      }),
      db.vendorStory.update({
        where: { id: storyId },
        data: {
          viewCount: { increment: 1 }
        }
      })
    ])

    // Clear story cache
    await cache.del(`story:${storyId}`)
    await cache.flushPattern(`stories:*`)

    // Update analytics (if we want to track story views in vendor analytics)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await db.vendorAnalytics.upsert({
      where: {
        vendorId_date: {
          vendorId: story.vendorId,
          date: today
        }
      },
      update: {
        storyViews: { increment: 1 }
      },
      create: {
        vendorId: story.vendorId,
        date: today,
        storyViews: 1
      }
    })

    return NextResponse.json({
      message: 'Story view recorded',
      viewCount: story.viewCount + 1
    })

  } catch (error) {
    console.error('Record story view error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
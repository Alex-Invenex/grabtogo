import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { cache } from '@/lib/redis'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params

    // Try cache first
    const cacheKey = `story:${storyId}`
    const cached = await cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const story = await db.vendorStory.findUnique({
      where: { id: storyId },
      include: {
        vendor: {
          include: {
            vendorProfile: {
              select: {
                storeName: true,
                logoUrl: true,
                isVerified: true,
                city: true,
              }
            }
          }
        },
        _count: {
          select: {
            views: true
          }
        }
      }
    })

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }

    // Check if story is expired
    if (story.expiresAt < new Date() || !story.isActive) {
      return NextResponse.json(
        { error: 'Story is no longer available' },
        { status: 410 }
      )
    }

    const result = {
      ...story,
      viewCount: story._count.views,
      _count: undefined,
    }

    // Cache for 10 minutes
    await cache.set(cacheKey, result, 600)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Get story error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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
    const body = await request.json()

    // Verify story belongs to vendor
    const story = await db.vendorStory.findFirst({
      where: {
        id: storyId,
        vendorId: session.user.id!
      }
    })

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found or access denied' },
        { status: 404 }
      )
    }

    // Update story
    const updatedStory = await db.vendorStory.update({
      where: { id: storyId },
      data: {
        caption: body.caption,
        isActive: body.isActive !== undefined ? body.isActive : story.isActive,
      },
      include: {
        vendor: {
          include: {
            vendorProfile: {
              select: {
                storeName: true,
                logoUrl: true,
                isVerified: true,
              }
            }
          }
        }
      }
    })

    // Clear caches
    await cache.del(`story:${storyId}`)
    await cache.flushPattern(`stories:*`)

    return NextResponse.json({
      message: 'Story updated successfully',
      story: updatedStory
    })

  } catch (error) {
    console.error('Update story error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Verify story belongs to vendor or user is admin
    const userRole = (session.user as any).role
    const whereClause: any = { id: storyId }

    if (userRole !== 'ADMIN') {
      whereClause.vendorId = session.user.id!
    }

    const story = await db.vendorStory.findFirst({
      where: whereClause
    })

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found or access denied' },
        { status: 404 }
      )
    }

    // Delete story (cascade will handle views)
    await db.vendorStory.delete({
      where: { id: storyId }
    })

    // Clear caches
    await cache.del(`story:${storyId}`)
    await cache.flushPattern(`stories:*`)

    return NextResponse.json({
      message: 'Story deleted successfully'
    })

  } catch (error) {
    console.error('Delete story error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
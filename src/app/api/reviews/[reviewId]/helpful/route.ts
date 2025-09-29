import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { cache } from '@/lib/redis'
import { z } from 'zod'

const voteSchema = z.object({
  isHelpful: z.boolean(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { reviewId } = await params
    const body = await request.json()
    const { isHelpful } = voteSchema.parse(body)

    // Check if review exists
    const review = await db.review.findUnique({
      where: { id: reviewId },
      select: { id: true, productId: true }
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Upsert helpful vote
    const vote = await db.reviewHelpfulVote.upsert({
      where: {
        reviewId_userId: {
          reviewId,
          userId: session.user.id!,
        }
      },
      update: {
        isHelpful,
      },
      create: {
        reviewId,
        userId: session.user.id!,
        isHelpful,
      }
    })

    // Update helpful count on review
    const helpfulCount = await db.reviewHelpfulVote.count({
      where: {
        reviewId,
        isHelpful: true,
      }
    })

    await db.review.update({
      where: { id: reviewId },
      data: { helpfulCount }
    })

    // Clear related caches
    await cache.del(`review:${reviewId}`)
    await cache.flushPattern(`reviews:product:${review.productId}:*`)

    return NextResponse.json({
      message: 'Vote recorded successfully',
      vote,
      helpfulCount,
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Vote helpful error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { reviewId } = await params

    // Check if review exists
    const review = await db.review.findUnique({
      where: { id: reviewId },
      select: { id: true, productId: true }
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Delete vote
    await db.reviewHelpfulVote.delete({
      where: {
        reviewId_userId: {
          reviewId,
          userId: session.user.id!,
        }
      }
    }).catch(() => {
      // Ignore if vote doesn't exist
    })

    // Update helpful count on review
    const helpfulCount = await db.reviewHelpfulVote.count({
      where: {
        reviewId,
        isHelpful: true,
      }
    })

    await db.review.update({
      where: { id: reviewId },
      data: { helpfulCount }
    })

    // Clear related caches
    await cache.del(`review:${reviewId}`)
    await cache.flushPattern(`reviews:product:${review.productId}:*`)

    return NextResponse.json({
      message: 'Vote removed successfully',
      helpfulCount,
    })

  } catch (error) {
    console.error('Remove vote error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
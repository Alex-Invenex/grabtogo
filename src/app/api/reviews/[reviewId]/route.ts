import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { cache } from '@/lib/redis';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().optional(),
  comment: z.string().optional(),
  images: z.array(z.string().url()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;

    // Try cache first
    const cacheKey = `review:${reviewId}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const review = await db.review.findUnique({
      where: { id: reviewId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: true,
        _count: {
          select: {
            helpfulVotes: {
              where: { isHelpful: true },
            },
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const result = {
      ...review,
      helpfulVotesCount: review._count.helpfulVotes,
      _count: undefined,
    };

    // Cache for 10 minutes
    await cache.set(cacheKey, result, 600);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { reviewId } = await params;
    const body = await request.json();
    const validatedData = updateReviewSchema.parse(body);

    // Check if review exists and user owns it
    const existingReview = await db.review.findUnique({
      where: { id: reviewId },
      include: { images: true },
    });

    if (!existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (existingReview.userId !== session.user.id!) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update review
    const updatedReview = await db.review.update({
      where: { id: reviewId },
      data: {
        ...validatedData,
        updatedAt: new Date(),
        images: validatedData.images
          ? {
              deleteMany: {},
              create: validatedData.images.map((url, index) => ({
                url,
                altText: `Review image ${index + 1}`,
              })),
            }
          : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        images: true,
      },
    });

    // Clear related caches
    await cache.del(`review:${reviewId}`);
    await cache.flushPattern(`reviews:product:${existingReview.productId}:*`);
    await cache.flushPattern(`product:${existingReview.productId}:*`);

    return NextResponse.json({
      message: 'Review updated successfully',
      review: updatedReview,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Update review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { reviewId } = await params;

    // Check if review exists and user owns it (or is admin)
    const existingReview = await db.review.findUnique({
      where: { id: reviewId },
      select: {
        userId: true,
        productId: true,
      },
    });

    if (!existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const userRole = (session.user as any).role;
    if (existingReview.userId !== session.user.id! && userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete review (cascade will handle images and votes)
    await db.review.delete({
      where: { id: reviewId },
    });

    // Clear related caches
    await cache.del(`review:${reviewId}`);
    await cache.flushPattern(`reviews:product:${existingReview.productId}:*`);
    await cache.flushPattern(`product:${existingReview.productId}:*`);

    return NextResponse.json({
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Delete review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

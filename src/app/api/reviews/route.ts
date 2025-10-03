import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { cache } from '@/lib/redis';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createReviewSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  title: z.string().optional(),
  comment: z.string().optional(),
  images: z.array(z.string().url()).optional(),
});

const getReviewsSchema = z.object({
  productId: z.string().optional(),
  userId: z.string().optional(),
  rating: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.enum(['newest', 'oldest', 'rating_high', 'rating_low', 'helpful']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createReviewSchema.parse(body);

    // Check if user has already reviewed this product
    const existingReview = await db.review.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id!,
          productId: validatedData.productId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 400 }
      );
    }

    // Verify product exists and user has purchased it (optional verification)
    const product = await db.product.findUnique({
      where: { id: validatedData.productId },
      select: { id: true, name: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if user has purchased this product
    const hasPurchased = await db.orderItem.findFirst({
      where: {
        productId: validatedData.productId,
        order: {
          userId: session.user.id!,
          status: 'DELIVERED',
        },
      },
    });

    const isVerified = !!hasPurchased;

    // Create review with images
    const review = await db.review.create({
      data: {
        userId: session.user.id!,
        productId: validatedData.productId,
        rating: validatedData.rating,
        title: validatedData.title,
        comment: validatedData.comment,
        isVerified,
        images: validatedData.images
          ? {
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

    // Clear product cache
    await cache.flushPattern(`product:${validatedData.productId}:*`);
    await cache.flushPattern(`reviews:product:${validatedData.productId}:*`);

    return NextResponse.json(
      {
        message: 'Review created successfully',
        review,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Create review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const validatedParams = getReviewsSchema.parse(params);

    const page = parseInt(validatedParams.page || '1');
    const limit = parseInt(validatedParams.limit || '10');
    const sortBy = validatedParams.sortBy || 'newest';
    const rating = validatedParams.rating ? parseInt(validatedParams.rating) : undefined;
    const skip = (page - 1) * limit;

    // Create cache key
    const cacheKey = `reviews:${JSON.stringify({
      productId: validatedParams.productId,
      userId: validatedParams.userId,
      rating,
      page,
      limit,
      sortBy,
    })}`;

    // Try cache first (5 minutes)
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Build where clause
    const where: any = {};

    if (validatedParams.productId) {
      where.productId = validatedParams.productId;
    }

    if (validatedParams.userId) {
      where.userId = validatedParams.userId;
    }

    if (rating) {
      where.rating = rating;
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: 'desc' };

    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'rating_high':
        orderBy = { rating: 'desc' };
        break;
      case 'rating_low':
        orderBy = { rating: 'asc' };
        break;
      case 'helpful':
        orderBy = { helpfulCount: 'desc' };
        break;
    }

    // Get reviews with pagination
    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
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
        orderBy,
        skip,
        take: limit,
      }),
      db.review.count({ where }),
    ]);

    // Get rating distribution if productId is provided
    let ratingDistribution: Record<number, number> | null = null;
    let averageRating: number | null = null;

    if (validatedParams.productId) {
      const ratings = await db.review.groupBy({
        by: ['rating'],
        where: { productId: validatedParams.productId },
        _count: {
          rating: true,
        },
      });

      ratingDistribution = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };

      let totalRating = 0;
      let totalReviews = 0;

      ratings.forEach(({ rating, _count }) => {
        ratingDistribution![rating as keyof typeof ratingDistribution] = _count.rating;
        totalRating += rating * _count.rating;
        totalReviews += _count.rating;
      });

      averageRating = totalReviews > 0 ? parseFloat((totalRating / totalReviews).toFixed(1)) : 0;
    }

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const result = {
      data: reviews.map((review) => ({
        ...review,
        helpfulVotesCount: review._count.helpfulVotes,
        _count: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
      summary: validatedParams.productId
        ? {
            averageRating,
            totalReviews: total,
            ratingDistribution,
          }
        : undefined,
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, result, 300);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Get reviews error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

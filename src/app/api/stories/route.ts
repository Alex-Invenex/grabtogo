import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { cache } from '@/lib/redis';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createStorySchema = z.object({
  type: z.enum(['image', 'video']).default('image'),
  mediaUrl: z.string().url(),
  caption: z.string().optional(),
  productIds: z.array(z.string()).default([]),
});

const getStoriesSchema = z.object({
  vendorId: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  activeOnly: z.enum(['true', 'false']).default('true'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'VENDOR') {
      return NextResponse.json({ error: 'Only vendors can create stories' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createStorySchema.parse(body);

    // Check vendor subscription limits (if needed)
    const subscription = await db.vendorSubscription.findUnique({
      where: { vendorId: session.user.id! },
    });

    // Basic plan vendors might have story limits (implement if needed)

    // Set expiry time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Verify product IDs belong to the vendor
    if (validatedData.productIds.length > 0) {
      const productCount = await db.product.count({
        where: {
          id: { in: validatedData.productIds },
          vendorId: session.user.id!,
        },
      });

      if (productCount !== validatedData.productIds.length) {
        return NextResponse.json({ error: 'Some products do not belong to you' }, { status: 400 });
      }
    }

    // Create story
    const story = await db.vendorStory.create({
      data: {
        vendorId: session.user.id!,
        type: validatedData.type,
        mediaUrl: validatedData.mediaUrl,
        caption: validatedData.caption,
        productIds: validatedData.productIds,
        expiresAt,
      },
      include: {
        vendor: {
          include: {
            vendorProfile: {
              select: {
                storeName: true,
                logoUrl: true,
                isVerified: true,
              },
            },
          },
        },
      },
    });

    // Clear stories cache
    await cache.flushPattern(`stories:*`);

    return NextResponse.json(
      {
        message: 'Story created successfully',
        story,
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

    console.error('Create story error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const validatedParams = getStoriesSchema.parse(params);

    const page = parseInt(validatedParams.page || '1');
    const limit = parseInt(validatedParams.limit || '20');
    const skip = (page - 1) * limit;
    const activeOnly = validatedParams.activeOnly === 'true';

    // Create cache key
    const cacheKey = `stories:${JSON.stringify({
      vendorId: validatedParams.vendorId,
      page,
      limit,
      activeOnly,
    })}`;

    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Build where clause
    const where: any = {};

    if (validatedParams.vendorId) {
      where.vendorId = validatedParams.vendorId;
    }

    if (activeOnly) {
      where.isActive = true;
      where.expiresAt = { gt: new Date() };
    }

    // Get stories grouped by vendor
    const [stories, total] = await Promise.all([
      db.vendorStory.findMany({
        where,
        include: {
          vendor: {
            include: {
              vendorProfile: {
                select: {
                  storeName: true,
                  logoUrl: true,
                  isVerified: true,
                  city: true,
                },
              },
            },
          },
          _count: {
            select: {
              views: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.vendorStory.count({ where }),
    ]);

    // Group stories by vendor for better UX
    const vendorStories = new Map();

    stories.forEach((story) => {
      const vendorId = story.vendorId;
      if (!vendorStories.has(vendorId)) {
        vendorStories.set(vendorId, {
          vendor: {
            id: story.vendor.id,
            name: story.vendor.name,
            profile: story.vendor.vendorProfile,
          },
          stories: [],
          hasUnviewed: false,
        });
      }

      vendorStories.get(vendorId).stories.push({
        ...story,
        viewCount: story._count.views,
        _count: undefined,
        vendor: undefined, // Remove to avoid duplication
      });
    });

    const groupedStories = Array.from(vendorStories.values());

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const result = {
      data: groupedStories,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
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

    console.error('Get stories error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

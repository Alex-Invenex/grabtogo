import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { cache } from '@/lib/redis';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().min(1, 'Product slug is required'),
  description: z.string().optional(),
  shortDesc: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  price: z.number().positive('Price must be positive'),
  comparePrice: z.number().positive().optional(),
  cost: z.number().positive().optional(),
  quantity: z.number().int().nonnegative('Quantity must be non-negative').default(0),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  images: z.array(z.object({
    url: z.string().url(),
    altText: z.string().optional(),
    sortOrder: z.number().int().nonnegative().default(0),
  })).default([]),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  publishedAt: z.string().datetime().optional(),
});

const updateProductSchema = createProductSchema.partial();

// GET - List vendor's products
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'VENDOR') {
      return NextResponse.json({ error: 'Only vendors can access this endpoint' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const search = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');
    const isActive = searchParams.get('isActive');

    // Build where clause
    const where: any = {
      vendorId: session.user.id!, // Use session.user.id as vendorId
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Get products with pagination
    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          images: {
            select: {
              id: true,
              url: true,
              altText: true,
              sortOrder: true,
            },
            orderBy: {
              sortOrder: 'asc',
            },
          },
          _count: {
            select: {
              reviews: true,
              orderItems: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Get vendor products error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'VENDOR') {
      return NextResponse.json({ error: 'Only vendors can create products' }, { status: 403 });
    }

    // Check if vendor has active subscription
    const subscription = await db.vendorSubscription.findFirst({
      where: {
        vendorId: session.user.id!, // Use session.user.id as vendorId
        status: { in: ['ACTIVE', 'TRIAL'] },
        endDate: { gte: new Date() },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Active subscription required to create products' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createProductSchema.parse(body);

    // Check if slug is unique for this vendor
    const existingProduct = await db.product.findFirst({
      where: {
        slug: validatedData.slug,
        vendorId: session.user.id!,
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: 'A product with this slug already exists' },
        { status: 400 }
      );
    }

    // Create product with images
    const product = await db.product.create({
      data: {
        vendorId: session.user.id!, // Use session.user.id as vendorId
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        shortDesc: validatedData.shortDesc,
        categoryId: validatedData.categoryId,
        price: validatedData.price,
        comparePrice: validatedData.comparePrice,
        cost: validatedData.cost,
        quantity: validatedData.quantity,
        sku: validatedData.sku,
        barcode: validatedData.barcode,
        isActive: validatedData.isActive,
        isFeatured: validatedData.isFeatured,
        publishedAt: validatedData.publishedAt ? new Date(validatedData.publishedAt) : new Date(),
        images: {
          create: validatedData.images.map((img, index) => ({
            url: img.url,
            altText: img.altText || validatedData.name,
            sortOrder: img.sortOrder || index,
          })),
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            altText: true,
            sortOrder: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });

    // Clear products cache
    await cache.flushPattern('products:*');

    return NextResponse.json(
      {
        message: 'Product created successfully',
        product,
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

    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

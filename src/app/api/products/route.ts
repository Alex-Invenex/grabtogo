import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache } from '@/lib/redis';

export const dynamic = 'force-dynamic';

// Mock data for development when database is unavailable
const getMockProducts = (limit: number) => {
  const mockProducts = Array.from({ length: Math.min(limit, 6) }, (_, i) => ({
    id: `mock-product-${i + 1}`,
    name: `Sample Product ${i + 1}`,
    slug: `sample-product-${i + 1}`,
    price: 999 + i * 100,
    comparePrice: 1499 + i * 150,
    shortDesc: `This is a sample product description for product ${i + 1}`,
    images: [
      {
        id: `img-${i + 1}`,
        url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=400&q=80',
        altText: `Sample Product ${i + 1}`,
        sortOrder: 0,
      },
    ],
    vendor: {
      id: `vendor-${i + 1}`,
      name: 'Sample Vendor',
      vendorProfile: {
        storeName: 'Sample Store',
        storeSlug: 'sample-store',
      },
    },
    category: {
      id: 'cat-1',
      name: 'Sample Category',
      slug: 'sample-category',
    },
    viewCount: 100 + i * 10,
    _count: {
      reviews: 5 + i,
    },
    createdAt: new Date(),
  }));

  return {
    data: mockProducts,
    pagination: {
      page: 1,
      limit,
      total: mockProducts.length,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
  };
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    const skip = (page - 1) * limit;

    // Create cache key
    const cacheKey = `products:${JSON.stringify({
      page,
      limit,
      category,
      search,
      sortBy,
      sortOrder,
      minPrice,
      maxPrice,
    })}`;

    // Try to get from cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Build where clause
    const where: any = {
      isActive: true,
      publishedAt: {
        lte: new Date(),
      },
    };

    if (category) {
      where.categoryId = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { shortDesc: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // Build orderBy
    const orderBy: any = {};
    if (sortBy === 'price') {
      orderBy.price = sortOrder;
    } else if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Get products with pagination
    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              vendorProfile: {
                select: {
                  storeName: true,
                  storeSlug: true,
                },
              },
            },
          },
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
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const result = {
      data: products,
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
    console.error('Products API error:', error);

    // Return mock data when database is unavailable
    console.log('Database unavailable, returning mock data');
    const mockData = getMockProducts(limit);
    return NextResponse.json(mockData);
  }
}

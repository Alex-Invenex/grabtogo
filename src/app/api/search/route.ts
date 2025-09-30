import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim();
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseFloat(searchParams.get('radius') || '10');
    const category = searchParams.get('category');
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999');
    const brand = searchParams.get('brand');
    const sortBy = searchParams.get('sortBy') || 'relevance'; // relevance, price_asc, price_desc, rating, distance
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || 'products'; // products, vendors, all

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    // Create cache key
    const cacheKey = `search:${JSON.stringify({
      query,
      lat,
      lng,
      radius,
      category,
      minPrice,
      maxPrice,
      brand,
      sortBy,
      page,
      limit,
      type,
    })}`;

    // Try to get from cache first (cache for 5 minutes for search results)
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Track search for analytics
    await trackSearch(query, lat, lng);

    let result: any = {};

    if (type === 'products' || type === 'all') {
      result.products = await searchProducts({
        query,
        lat,
        lng,
        radius,
        category,
        minPrice,
        maxPrice,
        brand,
        sortBy,
        page,
        limit: type === 'all' ? Math.floor(limit / 2) : limit,
        skip: type === 'all' ? 0 : skip,
      });
    }

    if (type === 'vendors' || type === 'all') {
      result.vendors = await searchVendors({
        query,
        lat,
        lng,
        radius,
        page,
        limit: type === 'all' ? Math.floor(limit / 2) : limit,
        skip: type === 'all' ? 0 : skip,
      });
    }

    // Add search suggestions
    result.suggestions = await getSearchSuggestions(query);

    // Cache for 5 minutes
    await cache.set(cacheKey, result, 300);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function searchProducts(params: {
  query: string;
  lat: number;
  lng: number;
  radius: number;
  category?: string | null;
  minPrice: number;
  maxPrice: number;
  brand?: string | null;
  sortBy: string;
  page: number;
  limit: number;
  skip: number;
}) {
  const {
    query,
    lat,
    lng,
    radius,
    category,
    minPrice,
    maxPrice,
    brand,
    sortBy,
    page,
    limit,
    skip,
  } = params;

  // Build where clause
  const where: any = {
    isActive: true,
    publishedAt: { not: null },
    quantity: { gt: 0 },
    price: {
      gte: minPrice,
      lte: maxPrice,
    },
  };

  if (category) {
    where.category = {
      slug: category,
    };
  }

  if (brand) {
    where.brand = { equals: brand, mode: 'insensitive' };
  }

  // Add full-text search
  where.OR = [
    { name: { contains: query, mode: 'insensitive' } },
    { description: { contains: query, mode: 'insensitive' } },
    { shortDesc: { contains: query, mode: 'insensitive' } },
    { tags: { has: query } },
    { brand: { contains: query, mode: 'insensitive' } },
  ];

  // Build orderBy clause
  let orderBy: any = { createdAt: 'desc' };

  switch (sortBy) {
    case 'price_asc':
      orderBy = { price: 'asc' };
      break;
    case 'price_desc':
      orderBy = { price: 'desc' };
      break;
    case 'rating':
      orderBy = { reviews: { _count: 'desc' } };
      break;
    case 'popularity':
      orderBy = { orderCount: 'desc' };
      break;
    case 'newest':
      orderBy = { createdAt: 'desc' };
      break;
  }

  // Include vendor with profile
  const includeVendor = {
    vendor: {
      include: {
        vendorProfile: {
          select: {
            storeName: true,
            city: true,
            latitude: true,
            longitude: true,
            deliveryRadius: true,
          },
        },
      },
    },
  };

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        ...includeVendor,
      },
      orderBy,
      skip,
      take: limit,
    }),
    db.product.count({ where }),
  ]);

  // Calculate average ratings and distances
  const enrichedProducts = products.map((product) => {
    const ratings = product.reviews.map((r) => r.rating);
    const avgRating =
      ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;

    let distance = null;
    if (
      lat &&
      lng &&
      product.vendor.vendorProfile?.latitude &&
      product.vendor.vendorProfile?.longitude
    ) {
      // Calculate approximate distance using Haversine formula
      const R = 6371; // Earth's radius in kilometers
      const dLat = ((product.vendor.vendorProfile.latitude - lat) * Math.PI) / 180;
      const dLng = ((product.vendor.vendorProfile.longitude - lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((product.vendor.vendorProfile.latitude * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distance = R * c;
    }

    return {
      ...product,
      averageRating: parseFloat(avgRating.toFixed(1)),
      reviewCount: product.reviews.length,
      distanceKm: distance ? parseFloat(distance.toFixed(2)) : null,
      reviews: undefined, // Remove individual reviews from response
    };
  });

  const totalPages = Math.ceil(total / limit);

  return {
    data: enrichedProducts,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

async function searchVendors(params: {
  query: string;
  lat: number;
  lng: number;
  radius: number;
  page: number;
  limit: number;
  skip: number;
}) {
  const { query, lat, lng, radius, page, limit, skip } = params;

  const where: any = {
    isActive: true,
    OR: [
      { storeName: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { city: { contains: query, mode: 'insensitive' } },
    ],
  };

  // If location provided, add distance filter
  if (lat && lng) {
    where.latitude = { not: null };
    where.longitude = { not: null };
  }

  const [vendors, total] = await Promise.all([
    db.vendorProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            _count: {
              select: {
                products: {
                  where: {
                    isActive: true,
                    quantity: { gt: 0 },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.vendorProfile.count({ where }),
  ]);

  // Calculate distances if location provided
  const enrichedVendors = vendors.map((vendor) => {
    let distance = null;
    if (lat && lng && vendor.latitude && vendor.longitude) {
      const R = 6371;
      const dLat = ((vendor.latitude - lat) * Math.PI) / 180;
      const dLng = ((vendor.longitude - lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((vendor.latitude * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distance = R * c;
    }

    return {
      ...vendor,
      distanceKm: distance ? parseFloat(distance.toFixed(2)) : null,
    };
  });

  // Sort by distance if location provided
  if (lat && lng) {
    enrichedVendors.sort((a, b) => {
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }

  const totalPages = Math.ceil(total / limit);

  return {
    data: enrichedVendors,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

async function getSearchSuggestions(query: string) {
  // Get trending searches that match the query
  const trending = await db.trendingSearch.findMany({
    where: {
      query: {
        contains: query,
        mode: 'insensitive',
      },
    },
    orderBy: {
      searchCount: 'desc',
    },
    take: 5,
  });

  // Get category suggestions
  const categories = await db.category.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { slug: { contains: query, mode: 'insensitive' } },
      ],
      isActive: true,
    },
    select: {
      name: true,
      slug: true,
    },
    take: 3,
  });

  // Get brand suggestions
  const brands = await db.product.findMany({
    where: {
      brand: {
        contains: query,
        mode: 'insensitive',
      },
      isActive: true,
    },
    select: {
      brand: true,
    },
    distinct: ['brand'],
    take: 3,
  });

  return {
    trending: trending.map((t) => t.query),
    categories: categories.map((c) => ({ name: c.name, value: c.slug })),
    brands: brands.map((b) => b.brand).filter(Boolean),
  };
}

async function trackSearch(query: string, lat?: number, lng?: number) {
  try {
    // Update trending searches
    await db.trendingSearch.upsert({
      where: { query },
      update: {
        searchCount: { increment: 1 },
        lastSearched: new Date(),
      },
      create: {
        query,
        searchCount: 1,
        lastSearched: new Date(),
      },
    });

    // Store search history (for authenticated users, this could include userId)
    await db.searchHistory.create({
      data: {
        query,
        results: 0, // This could be updated with actual result count
      },
    });
  } catch (error) {
    console.error('Error tracking search:', error);
    // Don't throw error for analytics failure
  }
}

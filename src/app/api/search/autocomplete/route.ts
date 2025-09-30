import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cache } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')?.trim()
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    // Create cache key
    const cacheKey = `autocomplete:${query.toLowerCase()}:${limit}`

    // Try to get from cache first (cache for 1 hour)
    const cached = await cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const suggestions = await getAutocompleteSuggestions(query, limit)

    // Cache for 1 hour
    await cache.set(cacheKey, suggestions, 3600)

    return NextResponse.json(suggestions)
  } catch (error) {
    console.error('Autocomplete API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function getAutocompleteSuggestions(query: string, limit: number) {
  const suggestions: any[] = []

  // Get trending searches
  const trendingSearches = await db.trendingSearch.findMany({
    where: {
      query: {
        contains: query,
        mode: 'insensitive',
      }
    },
    orderBy: [
      { searchCount: 'desc' },
      { lastSearched: 'desc' }
    ],
    take: Math.min(limit, 5),
    select: {
      query: true,
      searchCount: true,
    }
  })

  // Add trending searches
  trendingSearches.forEach(trending => {
    suggestions.push({
      type: 'trending',
      text: trending.query,
      icon: '🔥',
      popularity: trending.searchCount,
    })
  })

  // Get product name suggestions
  const products = await db.product.findMany({
    where: {
      AND: [
        {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { tags: { has: query } },
          ]
        },
        { isActive: true },
        { quantity: { gt: 0 } }
      ]
    },
    select: {
      name: true,
      orderCount: true,
    },
    orderBy: [
      { orderCount: 'desc' },
      { createdAt: 'desc' }
    ],
    take: Math.min(limit - suggestions.length, 5),
  })

  // Add product suggestions
  products.forEach(product => {
    if (suggestions.length < limit) {
      suggestions.push({
        type: 'product',
        text: product.name,
        icon: '📦',
        popularity: product.orderCount,
      })
    }
  })

  // Get category suggestions
  if (suggestions.length < limit) {
    const categories = await db.category.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { slug: { contains: query, mode: 'insensitive' } },
            ]
          },
          { isActive: true }
        ]
      },
      select: {
        name: true,
        slug: true,
        _count: {
          select: {
            products: {
              where: {
                isActive: true,
                quantity: { gt: 0 }
              }
            }
          }
        }
      },
      orderBy: {
        products: {
          _count: 'desc'
        }
      },
      take: Math.min(limit - suggestions.length, 3),
    })

    categories.forEach(category => {
      if (suggestions.length < limit) {
        suggestions.push({
          type: 'category',
          text: category.name,
          value: category.slug,
          icon: '📁',
          productCount: category._count.products,
        })
      }
    })
  }

  // Get brand suggestions
  if (suggestions.length < limit) {
    const brands = await db.product.groupBy({
      by: ['brand'],
      where: {
        AND: [
          { brand: { not: null } },
          { brand: { contains: query, mode: 'insensitive' } },
          { isActive: true },
          { quantity: { gt: 0 } }
        ]
      },
      _count: {
        brand: true,
      },
      orderBy: {
        _count: {
          brand: 'desc'
        }
      },
      take: Math.min(limit - suggestions.length, 3),
    })

    brands.forEach(brand => {
      if (suggestions.length < limit && brand.brand) {
        suggestions.push({
          type: 'brand',
          text: brand.brand,
          icon: '🏷️',
          productCount: brand._count.brand,
        })
      }
    })
  }

  // Get vendor suggestions
  if (suggestions.length < limit) {
    const vendors = await db.vendorProfile.findMany({
      where: {
        AND: [
          {
            OR: [
              { storeName: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ]
          },
          { isActive: true }
        ]
      },
      select: {
        storeName: true,
        storeSlug: true,
        city: true,
        isVerified: true,
      },
      orderBy: [
        { isVerified: 'desc' },
        { createdAt: 'desc' }
      ],
      take: Math.min(limit - suggestions.length, 3),
    })

    vendors.forEach(vendor => {
      if (suggestions.length < limit) {
        suggestions.push({
          type: 'vendor',
          text: vendor.storeName,
          value: vendor.storeSlug,
          location: vendor.city,
          icon: vendor.isVerified ? '✅' : '🏪',
          verified: vendor.isVerified,
        })
      }
    })
  }

  // Sort suggestions by relevance and popularity
  const sortedSuggestions = suggestions.sort((a, b) => {
    // Prioritize exact matches
    const aExact = a.text.toLowerCase().startsWith(query.toLowerCase()) ? 1 : 0
    const bExact = b.text.toLowerCase().startsWith(query.toLowerCase()) ? 1 : 0

    if (aExact !== bExact) {
      return bExact - aExact
    }

    // Then by type priority (trending > product > category > brand > vendor)
    const typePriority = {
      trending: 5,
      product: 4,
      category: 3,
      brand: 2,
      vendor: 1,
    }

    const aPriority = typePriority[a.type as keyof typeof typePriority] || 0
    const bPriority = typePriority[b.type as keyof typeof typePriority] || 0

    if (aPriority !== bPriority) {
      return bPriority - aPriority
    }

    // Finally by popularity
    const aPopularity = a.popularity || a.productCount || 0
    const bPopularity = b.popularity || b.productCount || 0

    return bPopularity - aPopularity
  })

  return {
    suggestions: sortedSuggestions.slice(0, limit),
    query,
    total: sortedSuggestions.length,
  }
}
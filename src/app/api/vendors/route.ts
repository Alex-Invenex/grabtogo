import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cache } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const city = searchParams.get('city')
    const location = searchParams.get('location') // Alias for city
    const verified = searchParams.get('verified')

    const skip = (page - 1) * limit

    // Use location parameter if city not provided
    const cityFilter = city || location

    // Create cache key
    const cacheKey = `vendors:${JSON.stringify({
      page,
      limit,
      search,
      city: cityFilter,
      verified,
    })}`

    // Try to get from cache first
    const cached = await cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Build where clause
    const where: any = {
      isActive: true,
    }

    if (verified === 'true') {
      where.isVerified = true
    }

    if (cityFilter && cityFilter !== 'All Locations') {
      where.city = { contains: cityFilter, mode: 'insensitive' }
    }

    if (search) {
      where.OR = [
        { storeName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get vendor profiles with pagination
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
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      db.vendorProfile.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    const result = {
      data: vendors,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    }

    // Cache for 10 minutes
    await cache.set(cacheKey, result, 600)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Vendors API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
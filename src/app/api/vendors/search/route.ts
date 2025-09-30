import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cache } from '@/lib/redis'
import { Prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const lat = parseFloat(searchParams.get('lat') || '0')
    const lng = parseFloat(searchParams.get('lng') || '0')
    const radius = parseFloat(searchParams.get('radius') || '10') // kilometers
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const verified = searchParams.get('verified')

    // Validate coordinates
    if (!lat || !lng || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'Valid latitude and longitude are required' },
        { status: 400 }
      )
    }

    const skip = (page - 1) * limit

    // Create cache key
    const cacheKey = `vendors:search:${JSON.stringify({
      lat,
      lng,
      radius,
      page,
      limit,
      search,
      category,
      verified,
    })}`

    // Try to get from cache first (cache for 5 minutes)
    const cached = await cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Build base where clause
    const where: any = {
      isActive: true,
      latitude: { not: null },
      longitude: { not: null },
    }

    if (verified === 'true') {
      where.isVerified = true
    }

    if (search) {
      where.OR = [
        { storeName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Raw SQL query for geospatial search using PostGIS
    const vendorsQuery = `
      SELECT
        vp.*,
        u.name as user_name,
        u.email as user_email,
        u."createdAt" as user_created_at,
        ST_Distance(
          ST_MakePoint(vp.longitude, vp.latitude)::geography,
          ST_MakePoint($1, $2)::geography
        ) / 1000 as distance_km
      FROM vendor_profiles vp
      JOIN users u ON vp."userId" = u.id
      WHERE
        vp."isActive" = true
        AND vp.latitude IS NOT NULL
        AND vp.longitude IS NOT NULL
        AND ST_DWithin(
          ST_MakePoint(vp.longitude, vp.latitude)::geography,
          ST_MakePoint($1, $2)::geography,
          $3 * 1000
        )
        ${verified === 'true' ? 'AND vp."isVerified" = true' : ''}
        ${search ? `AND (
          vp."storeName" ILIKE '%${search}%' OR
          vp.description ILIKE '%${search}%' OR
          vp.city ILIKE '%${search}%'
        )` : ''}
      ORDER BY distance_km ASC
      LIMIT $4 OFFSET $5
    `

    const countQuery = `
      SELECT COUNT(*) as total
      FROM vendor_profiles vp
      WHERE
        vp."isActive" = true
        AND vp.latitude IS NOT NULL
        AND vp.longitude IS NOT NULL
        AND ST_DWithin(
          ST_MakePoint(vp.longitude, vp.latitude)::geography,
          ST_MakePoint($1, $2)::geography,
          $3 * 1000
        )
        ${verified === 'true' ? 'AND vp."isVerified" = true' : ''}
        ${search ? `AND (
          vp."storeName" ILIKE '%${search}%' OR
          vp.description ILIKE '%${search}%' OR
          vp.city ILIKE '%${search}%'
        )` : ''}
    `

    // Execute queries
    const [vendors, totalResult] = await Promise.all([
      db.$queryRaw`
        SELECT
          vp.*,
          u.name as user_name,
          u.email as user_email,
          u."createdAt" as user_created_at,
          ST_Distance(
            ST_MakePoint(vp.longitude, vp.latitude)::geography,
            ST_MakePoint(${lng}, ${lat})::geography
          ) / 1000 as distance_km
        FROM vendor_profiles vp
        JOIN users u ON vp."userId" = u.id
        WHERE
          vp."isActive" = true
          AND vp.latitude IS NOT NULL
          AND vp.longitude IS NOT NULL
          AND ST_DWithin(
            ST_MakePoint(vp.longitude, vp.latitude)::geography,
            ST_MakePoint(${lng}, ${lat})::geography,
            ${radius * 1000}
          )
          ${verified === 'true' ? Prisma.sql`AND vp."isVerified" = true` : Prisma.empty}
        ORDER BY distance_km ASC
        LIMIT ${limit} OFFSET ${skip}
      `,
      db.$queryRaw`
        SELECT COUNT(*) as total
        FROM vendor_profiles vp
        WHERE
          vp."isActive" = true
          AND vp.latitude IS NOT NULL
          AND vp.longitude IS NOT NULL
          AND ST_DWithin(
            ST_MakePoint(vp.longitude, vp.latitude)::geography,
            ST_MakePoint(${lng}, ${lat})::geography,
            ${radius * 1000}
          )
          ${verified === 'true' ? Prisma.sql`AND vp."isVerified" = true` : Prisma.empty}
      `
    ])

    const total = Number((totalResult as any)[0]?.total || 0)
    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    // Format vendors data
    const formattedVendors = (vendors as any[]).map(vendor => ({
      id: vendor.id,
      storeName: vendor.storeName,
      storeSlug: vendor.storeSlug,
      description: vendor.description,
      logoUrl: vendor.logoUrl,
      bannerUrl: vendor.bannerUrl,
      isVerified: vendor.isVerified,
      address: vendor.address,
      city: vendor.city,
      state: vendor.state,
      zipCode: vendor.zipCode,
      country: vendor.country,
      latitude: vendor.latitude,
      longitude: vendor.longitude,
      deliveryRadius: vendor.deliveryRadius,
      distanceKm: Number(vendor.distance_km).toFixed(2),
      createdAt: vendor.createdAt,
      user: {
        id: vendor.userId,
        name: vendor.user_name,
        email: vendor.user_email,
        createdAt: vendor.user_created_at,
      }
    }))

    const result = {
      data: formattedVendors,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
      searchLocation: {
        latitude: lat,
        longitude: lng,
        radius: radius,
      }
    }

    // Cache for 5 minutes
    await cache.set(cacheKey, result, 300)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Vendor geospatial search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
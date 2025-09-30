import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const location = searchParams.get('location') || ''
    const category = searchParams.get('category') || ''
    const sortBy = searchParams.get('sort') || 'featured'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = (page - 1) * limit

    // Build where clause
    const whereClause: any = {
      isActive: true,
    }

    // Category filter
    if (category && category !== 'all') {
      const categoryRecord = await db.category.findFirst({
        where: { slug: category }
      })
      if (categoryRecord) {
        whereClause.categoryId = categoryRecord.id
      }
    }

    // Search query (search in product name and description)
    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { shortDesc: { contains: query, mode: 'insensitive' } },
      ]
    }

    // Location filter would require vendor profile join
    // For now, we'll filter by vendor's city
    let vendorWhere: any = { isActive: true }
    if (location && location !== 'All Locations') {
      vendorWhere.city = location
    }

    // Sorting
    let orderBy: any = { createdAt: 'desc' }
    switch (sortBy) {
      case 'price-low':
        orderBy = { price: 'asc' }
        break
      case 'price-high':
        orderBy = { price: 'desc' }
        break
      case 'rating':
        orderBy = { orderCount: 'desc' } // Using orderCount as proxy for popularity
        break
      case 'newest':
        orderBy = { createdAt: 'desc' }
        break
      default:
        orderBy = { isFeatured: 'desc', createdAt: 'desc' }
    }

    // Fetch products (listings) with vendor info
    const [products, total] = await Promise.all([
      db.product.findMany({
        where: whereClause,
        include: {
          vendor: {
            select: {
              name: true,
              email: true,
              vendorProfile: {
                select: {
                  storeName: true,
                  logoUrl: true,
                  city: true,
                  address: true,
                  latitude: true,
                  longitude: true,
                  isVerified: true
                }
              }
            }
          },
          category: {
            select: {
              name: true,
              slug: true
            }
          },
          images: {
            take: 1,
            orderBy: { sortOrder: 'asc' }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      db.product.count({ where: whereClause })
    ])

    // Transform data to match listing format
    const listings = products.map(product => {
      const discount = product.comparePrice && product.comparePrice > product.price
        ? `${Math.round(((Number(product.comparePrice) - Number(product.price)) / Number(product.comparePrice)) * 100)}% OFF`
        : 'Special Offer'

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        storeName: product.vendor.vendorProfile?.storeName || product.vendor.name,
        storeVerified: product.vendor.vendorProfile?.isVerified || false,
        category: product.category.name,
        categorySlug: product.category.slug,
        location: product.vendor.vendorProfile?.city || 'Kerala',
        address: product.vendor.vendorProfile?.address || '',
        image: product.images[0]?.url || '/placeholder.jpg',
        discount,
        price: Number(product.price),
        comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
        priceRange: `₹${Number(product.price).toLocaleString('en-IN')}`,
        description: product.shortDesc || product.description || '',
        isFeatured: product.isFeatured,
        // Mock values - would need actual data
        rating: 4.5,
        distance: 5.0,
        isOpen: true,
        latitude: product.vendor.vendorProfile?.latitude,
        longitude: product.vendor.vendorProfile?.longitude
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        listings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + products.length < total
        }
      }
    })

  } catch (error) {
    console.error('Error fetching listings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listings' },
      { status: 500 }
    )
  }
}
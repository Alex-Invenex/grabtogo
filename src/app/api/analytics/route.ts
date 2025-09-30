import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { cache } from '@/lib/redis'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const analyticsQuerySchema = z.object({
  vendorId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  granularity: z.enum(['day', 'week', 'month']).default('day'),
  metrics: z.string().optional(), // comma-separated list
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    const validatedParams = analyticsQuerySchema.parse(params)

    const userRole = (session.user as any).role
    let vendorId = session.user.id!

    // Admins can query other vendors' analytics
    if (userRole === 'ADMIN' && validatedParams.vendorId) {
      vendorId = validatedParams.vendorId
    } else if (userRole !== 'VENDOR' && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check vendor has analytics access
    if (userRole === 'VENDOR') {
      const subscription = await db.vendorSubscription.findUnique({
        where: { vendorId },
        select: { analyticsAccess: true, status: true }
      })

      if (!subscription?.analyticsAccess || subscription.status !== 'active') {
        return NextResponse.json(
          { error: 'Analytics access requires premium subscription' },
          { status: 403 }
        )
      }
    }

    // Set date range (default to last 30 days)
    const endDate = validatedParams.endDate
      ? new Date(validatedParams.endDate)
      : new Date()
    const startDate = validatedParams.startDate
      ? new Date(validatedParams.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Create cache key
    const cacheKey = `analytics:vendor:${vendorId}:${JSON.stringify({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      granularity: validatedParams.granularity,
      metrics: validatedParams.metrics,
    })}`

    // Try cache first
    const cached = await cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Get analytics data
    const analytics = await db.vendorAnalytics.findMany({
      where: {
        vendorId,
        date: {
          gte: startDate,
          lte: endDate,
        }
      },
      orderBy: { date: 'asc' }
    })

    // Get additional metrics
    const [
      totalProducts,
      activeProducts,
      totalOrders,
      totalRevenue,
      totalCustomers,
      activeStories
    ] = await Promise.all([
      db.product.count({
        where: { vendorId }
      }),
      db.product.count({
        where: {
          vendorId,
          isActive: true,
          quantity: { gt: 0 }
        }
      }),
      db.order.count({
        where: {
          items: {
            some: {
              product: { vendorId }
            }
          },
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      db.order.aggregate({
        where: {
          items: {
            some: {
              product: { vendorId }
            }
          },
          status: 'DELIVERED',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          totalAmount: true
        }
      }),
      db.order.groupBy({
        by: ['userId'],
        where: {
          items: {
            some: {
              product: { vendorId }
            }
          },
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      db.vendorStory.count({
        where: {
          vendorId,
          isActive: true,
          expiresAt: { gt: new Date() }
        }
      })
    ])

    // Calculate aggregated metrics
    const totalSalesAmount = totalRevenue._sum.totalAmount || 0
    const uniqueCustomers = totalCustomers.length
    const averageOrderValue = totalOrders > 0 ? Number(totalSalesAmount) / totalOrders : 0

    // Calculate trends (compare with previous period)
    const periodLength = endDate.getTime() - startDate.getTime()
    const previousStartDate = new Date(startDate.getTime() - periodLength)
    const previousEndDate = new Date(startDate.getTime() - 1)

    const previousAnalytics = await db.vendorAnalytics.findMany({
      where: {
        vendorId,
        date: {
          gte: previousStartDate,
          lte: previousEndDate,
        }
      }
    })

    // Calculate trends
    const currentPeriodRevenue = analytics.reduce((sum, a) => sum + Number(a.totalRevenue), 0)
    const previousPeriodRevenue = previousAnalytics.reduce((sum, a) => sum + Number(a.totalRevenue), 0)
    const revenueGrowth = previousPeriodRevenue > 0
      ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100
      : 0

    const currentPeriodOrders = analytics.reduce((sum, a) => sum + a.totalOrders, 0)
    const previousPeriodOrders = previousAnalytics.reduce((sum, a) => sum + a.totalOrders, 0)
    const ordersGrowth = previousPeriodOrders > 0
      ? ((currentPeriodOrders - previousPeriodOrders) / previousPeriodOrders) * 100
      : 0

    // Get top products
    const topProducts = await db.product.findMany({
      where: { vendorId },
      orderBy: { orderCount: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        price: true,
        orderCount: true,
        viewCount: true,
        images: {
          take: 1,
          select: { url: true }
        }
      }
    })

    // Format time series data based on granularity
    const timeSeriesData = analytics.map(item => ({
      date: item.date.toISOString().split('T')[0],
      revenue: Number(item.totalRevenue),
      orders: item.totalOrders,
      customers: item.newCustomers + item.returningCustomers,
      productViews: item.productViews,
      storyViews: item.storyViews,
      conversionRate: item.conversionRate,
    }))

    const result = {
      summary: {
        totalProducts,
        activeProducts,
        totalOrders,
        totalRevenue: Number(totalSalesAmount),
        uniqueCustomers,
        averageOrderValue: Number(averageOrderValue.toFixed(2)),
        activeStories,
      },
      trends: {
        revenueGrowth: Number(revenueGrowth.toFixed(2)),
        ordersGrowth: Number(ordersGrowth.toFixed(2)),
      },
      timeSeriesData,
      topProducts,
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        granularity: validatedParams.granularity,
      }
    }

    // Cache for 1 hour
    await cache.set(cacheKey, result, 3600)

    return NextResponse.json(result)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Get analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update analytics data (called internally or via cron)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Only admins can trigger analytics updates
    const userRole = (session.user as any).role
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const vendorId = body.vendorId
    const date = body.date ? new Date(body.date) : new Date()
    date.setHours(0, 0, 0, 0)

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      )
    }

    // Calculate metrics for the date
    const nextDay = new Date(date)
    nextDay.setDate(nextDay.getDate() + 1)

    const [
      ordersData,
      productMetrics,
      storyMetrics
    ] = await Promise.all([
      // Orders metrics
      db.order.aggregate({
        where: {
          items: {
            some: {
              product: { vendorId }
            }
          },
          createdAt: {
            gte: date,
            lt: nextDay
          }
        },
        _count: true,
        _sum: {
          totalAmount: true
        }
      }),
      // Product metrics (views would need to be tracked separately)
      db.product.aggregate({
        where: {
          vendorId,
          updatedAt: {
            gte: date,
            lt: nextDay
          }
        },
        _sum: {
          viewCount: true
        }
      }),
      // Story metrics
      db.vendorStory.aggregate({
        where: {
          vendorId,
          createdAt: {
            gte: date,
            lt: nextDay
          }
        },
        _sum: {
          viewCount: true
        }
      })
    ])

    // Get unique customers
    const uniqueCustomers = await db.order.groupBy({
      by: ['userId'],
      where: {
        items: {
          some: {
            product: { vendorId }
          }
        },
        createdAt: {
          gte: date,
          lt: nextDay
        }
      }
    })

    const totalOrders = ordersData._count || 0
    const totalRevenue = ordersData._sum.totalAmount || 0
    const productViews = productMetrics._sum.viewCount || 0
    const storyViews = storyMetrics._sum.viewCount || 0
    const customers = uniqueCustomers.length

    // Upsert analytics record
    const analytics = await db.vendorAnalytics.upsert({
      where: {
        vendorId_date: {
          vendorId,
          date
        }
      },
      update: {
        totalOrders,
        totalRevenue,
        averageOrderValue: totalOrders > 0 ? Number(totalRevenue) / totalOrders : 0,
        productViews,
        storyViews,
        newCustomers: customers, // Simplified - would need to track properly
        conversionRate: productViews > 0 ? (totalOrders / productViews) * 100 : 0,
      },
      create: {
        vendorId,
        date,
        totalOrders,
        totalRevenue,
        averageOrderValue: totalOrders > 0 ? Number(totalRevenue) / totalOrders : 0,
        productViews,
        storyViews,
        newCustomers: customers,
        conversionRate: productViews > 0 ? (totalOrders / productViews) * 100 : 0,
      }
    })

    // Clear analytics cache
    await cache.flushPattern(`analytics:vendor:${vendorId}:*`)

    return NextResponse.json({
      message: 'Analytics updated successfully',
      analytics
    })

  } catch (error) {
    console.error('Update analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

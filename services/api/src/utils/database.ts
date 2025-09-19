import { PrismaClient } from '@prisma/client'

/**
 * Enhanced Prisma client with optimizations
 */
export class DatabaseManager {
  private static instance: DatabaseManager
  private prisma: PrismaClient

  private constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })

    // Connection pooling optimization
    this.prisma.$on('query', (e) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Query: ' + e.query)
        console.log('Duration: ' + e.duration + 'ms')
      }
    })
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }

  public getClient(): PrismaClient {
    return this.prisma
  }

  /**
   * Optimized product queries with proper indexing
   */
  public async getProductsOptimized(params: {
    vendorId?: string
    category?: string
    searchTerm?: string
    minPrice?: number
    maxPrice?: number
    page?: number
    limit?: number
    sortBy?: 'price' | 'name' | 'createdAt'
    sortOrder?: 'asc' | 'desc'
  }) {
    const {
      vendorId,
      category,
      searchTerm,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params

    const where: any = {
      isActive: true,
      ...(vendorId && { vendorId }),
      ...(category && { category }),
      ...(minPrice !== undefined && { price: { gte: minPrice } }),
      ...(maxPrice !== undefined && { price: { ...(minPrice !== undefined ? { gte: minPrice } : {}), lte: maxPrice } }),
      ...(searchTerm && {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { category: { contains: searchTerm, mode: 'insensitive' } }
        ]
      })
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
              businessType: true,
              isVerified: true
            }
          },
          _count: {
            select: {
              orders: true,
              reviews: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.product.count({ where })
    ])

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Optimized vendor queries with aggregations
   */
  public async getVendorsOptimized(params: {
    location?: string
    businessType?: string
    isVerified?: boolean
    subscriptionPlan?: string
    page?: number
    limit?: number
    includeStats?: boolean
  }) {
    const {
      location,
      businessType,
      isVerified,
      subscriptionPlan,
      page = 1,
      limit = 20,
      includeStats = false
    } = params

    const where: any = {
      ...(location && { address: { contains: location, mode: 'insensitive' } }),
      ...(businessType && { businessType }),
      ...(isVerified !== undefined && { isVerified }),
      ...(subscriptionPlan && { subscriptionPlan })
    }

    const select: any = {
      id: true,
      businessName: true,
      businessType: true,
      address: true,
      phone: true,
      isVerified: true,
      subscriptionPlan: true,
      createdAt: true,
      ...(includeStats && {
        _count: {
          select: {
            products: { where: { isActive: true } },
            orders: true,
            offers: { where: { isActive: true } }
          }
        }
      })
    }

    const [vendors, total] = await Promise.all([
      this.prisma.vendor.findMany({
        where,
        select,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.vendor.count({ where })
    ])

    return {
      vendors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Optimized order queries with aggregations
   */
  public async getOrdersOptimized(params: {
    userId?: string
    vendorId?: string
    status?: string
    startDate?: Date
    endDate?: Date
    page?: number
    limit?: number
  }) {
    const {
      userId,
      vendorId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = params

    const where: any = {
      ...(userId && { customerId: userId }),
      ...(vendorId && { vendorId }),
      ...(status && { status }),
      ...(startDate && endDate && {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      })
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
              businessType: true
            }
          },
          customer: {
            select: {
              id: true,
              email: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true
                }
              }
            }
          },
          payment: {
            select: {
              id: true,
              status: true,
              amount: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.order.count({ where })
    ])

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Optimized analytics queries
   */
  public async getAnalyticsOptimized(vendorId: string, period: string = '30d') {
    const now = new Date()
    const periodDays = parseInt(period.replace('d', ''))
    const startDate = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000))

    const [
      totalOrders,
      totalRevenue,
      totalProducts,
      totalCustomers,
      recentOrders,
      topProducts,
      dailyStats
    ] = await Promise.all([
      // Total orders count
      this.prisma.order.count({
        where: {
          vendorId,
          createdAt: { gte: startDate }
        }
      }),

      // Total revenue
      this.prisma.order.aggregate({
        where: {
          vendorId,
          status: 'COMPLETED',
          createdAt: { gte: startDate }
        },
        _sum: { totalAmount: true }
      }),

      // Active products count
      this.prisma.product.count({
        where: {
          vendorId,
          isActive: true
        }
      }),

      // Unique customers count
      this.prisma.order.findMany({
        where: {
          vendorId,
          createdAt: { gte: startDate }
        },
        select: { customerId: true },
        distinct: ['customerId']
      }),

      // Recent orders
      this.prisma.order.findMany({
        where: { vendorId },
        include: {
          customer: {
            select: { email: true }
          },
          items: {
            include: {
              product: {
                select: { name: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),

      // Top products by order count
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            vendorId,
            createdAt: { gte: startDate }
          }
        },
        _count: { productId: true },
        _sum: { quantity: true },
        orderBy: { _count: { productId: 'desc' } },
        take: 5
      }),

      // Daily statistics
      this.prisma.$queryRaw`
        SELECT
          DATE(created_at) as date,
          COUNT(*) as orders_count,
          SUM(total_amount) as revenue,
          COUNT(DISTINCT customer_id) as unique_customers
        FROM "Order"
        WHERE vendor_id = ${vendorId}
          AND created_at >= ${startDate}
          AND status = 'COMPLETED'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `
    ])

    // Get product details for top products
    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, price: true }
        })
        return {
          ...product,
          orderCount: item._count.productId,
          totalQuantity: item._sum.quantity
        }
      })
    )

    return {
      summary: {
        totalOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        totalProducts,
        totalCustomers: totalCustomers.length,
        averageOrderValue: totalOrders > 0 ? (totalRevenue._sum.totalAmount || 0) / totalOrders : 0
      },
      recentOrders: recentOrders.slice(0, 5),
      topProducts: topProductsWithDetails,
      dailyStats,
      period: `${periodDays} days`
    }
  }

  /**
   * Bulk operations for better performance
   */
  public async bulkCreateProducts(products: any[]) {
    return this.prisma.product.createMany({
      data: products,
      skipDuplicates: true
    })
  }

  public async bulkUpdateProductStatus(productIds: string[], isActive: boolean) {
    return this.prisma.product.updateMany({
      where: {
        id: { in: productIds }
      },
      data: { isActive }
    })
  }

  /**
   * Transaction helper for complex operations
   */
  public async executeTransaction<T>(
    operations: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(operations)
  }

  /**
   * Close database connection
   */
  public async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
  }
}

// Export singleton instance
export const db = DatabaseManager.getInstance()
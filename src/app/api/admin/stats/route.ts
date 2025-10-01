import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { cache } from '@/lib/redis';
import { UserRole } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Try cache first (5 minutes TTL)
    const cacheKey = 'admin:stats:dashboard';
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Calculate date ranges
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Parallel queries for better performance
    const [
      totalUsers,
      totalCustomers,
      totalVendors,
      totalAdmins,
      activeVendors,
      pendingVendorRequests,
      suspendedVendors,
      ordersToday,
      ordersThisWeek,
      ordersThisMonth,
      revenueToday,
      revenueThisMonth,
      activeSubscriptions,
      openTickets,
      totalProducts,
      totalReviews,
    ] = await Promise.all([
      // User counts
      db.user.count(),
      db.user.count({ where: { role: UserRole.CUSTOMER } }),
      db.user.count({ where: { role: UserRole.VENDOR } }),
      db.user.count({ where: { role: UserRole.ADMIN } }),

      // Vendor stats
      db.vendorProfile.count({ where: { isActive: true, isVerified: true } }),
      db.vendorRegistrationRequest.count({ where: { status: 'pending' } }),
      db.vendorProfile.count({ where: { isActive: false } }),

      // Order counts
      db.order.count({ where: { createdAt: { gte: startOfToday } } }),
      db.order.count({ where: { createdAt: { gte: startOfWeek } } }),
      db.order.count({ where: { createdAt: { gte: startOfMonth } } }),

      // Revenue calculations
      db.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startOfToday },
        },
        _sum: { amount: true },
      }),
      db.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),

      // Subscription stats
      db.vendorSubscription.count({ where: { status: 'active' } }),

      // Support tickets
      db.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),

      // Product and review counts
      db.product.count({ where: { isActive: true } }),
      db.review.count(),
    ]);

    // Calculate previous period for trends
    const [ordersYesterday, ordersLastMonth] = await Promise.all([
      db.order.count({
        where: {
          createdAt: {
            gte: new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000),
            lt: startOfToday,
          },
        },
      }),
      db.order.count({
        where: {
          createdAt: {
            gte: new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() - 1, 1),
            lt: startOfMonth,
          },
        },
      }),
    ]);

    // Calculate trends
    const ordersTodayChange =
      ordersYesterday > 0 ? ((ordersToday - ordersYesterday) / ordersYesterday) * 100 : 0;
    const ordersMonthChange =
      ordersLastMonth > 0 ? ((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100 : 0;

    const stats = {
      users: {
        total: totalUsers,
        customers: totalCustomers,
        vendors: totalVendors,
        admins: totalAdmins,
        change: 0, // Can be calculated if we track historical data
      },
      vendors: {
        total: totalVendors,
        active: activeVendors,
        pending: pendingVendorRequests,
        suspended: suspendedVendors,
        inactive: totalVendors - activeVendors - suspendedVendors,
      },
      orders: {
        today: ordersToday,
        thisWeek: ordersThisWeek,
        thisMonth: ordersThisMonth,
        todayChange: ordersTodayChange,
        monthChange: ordersMonthChange,
      },
      revenue: {
        today: revenueToday._sum.amount || 0,
        thisMonth: revenueThisMonth._sum.amount || 0,
        currency: 'INR',
      },
      subscriptions: {
        active: activeSubscriptions,
        total: activeSubscriptions,
      },
      support: {
        openTickets: openTickets,
      },
      products: {
        total: totalProducts,
      },
      reviews: {
        total: totalReviews,
      },
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, stats, 300);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

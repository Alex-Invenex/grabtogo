import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { cache } from '@/lib/redis';
import { UserRole } from '@/lib/prisma';

export const runtime = 'nodejs';
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

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Try cache first
    const cacheKey = `admin:analytics:${days}days`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get daily revenue and order data
    const orders = await db.order.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        totalAmount: true,
        status: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Get daily payments data
    const payments = await db.payment.findMany({
      where: {
        createdAt: { gte: startDate },
        status: 'COMPLETED',
      },
      select: {
        createdAt: true,
        amount: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const dailyData: Record<string, { revenue: number; orders: number; date: string }> = {};

    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { revenue: 0, orders: 0, date };
      }
      dailyData[date].orders += 1;
    });

    payments.forEach((payment) => {
      const date = payment.createdAt.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { revenue: 0, orders: 0, date };
      }
      dailyData[date].revenue += Number(payment.amount);
    });

    // Convert to array and sort by date
    const chartData = Object.values(dailyData).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // Get top products
    const topProducts = await db.product.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        orderCount: true,
        viewCount: true,
        price: true,
        _count: {
          select: { reviews: true },
        },
      },
      orderBy: { orderCount: 'desc' },
      take: 10,
    });

    // Get category distribution
    const categoryDistribution = await db.product.groupBy({
      by: ['categoryId'],
      _count: true,
      where: { isActive: true },
    });

    const categoriesWithNames = await Promise.all(
      categoryDistribution.map(async (item) => {
        const category = await db.category.findUnique({
          where: { id: item.categoryId },
          select: { name: true },
        });
        return {
          category: category?.name || 'Unknown',
          count: item._count,
        };
      })
    );

    const analytics = {
      chartData,
      topProducts,
      categoryDistribution: categoriesWithNames,
    };

    // Cache for 15 minutes
    await cache.set(cacheKey, analytics, 900);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;

    if (userRole !== 'VENDOR') {
      return NextResponse.json({ error: 'Only vendors can access analytics' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '12m':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Fetch orders
    const orders = await db.order.findMany({
      where: {
        items: {
          some: {
            product: {
              vendorId: session.user.id!,
            },
          },
        },
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                category: true,
                vendorId: true,
              },
            },
          },
        },
      },
    });

    // Filter items for this vendor only
    const vendorOrders = orders.map((order) => ({
      ...order,
      items: order.items.filter((item) => item.product.vendorId === session.user.id!),
    }));

    // Calculate total revenue and orders
    const totalRevenue = vendorOrders.reduce(
      (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.price * item.quantity, 0),
      0
    );
    const totalOrders = vendorOrders.length;

    // Get analytics records
    const analyticsRecords = await db.vendorAnalytics.findMany({
      where: {
        vendorId: session.user.id!,
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    const totalVisitors = analyticsRecords.reduce((sum, record) => sum + record.views, 0);

    // Get ad campaigns
    const adCampaigns = await db.adCampaign.findMany({
      where: {
        vendorId: session.user.id!,
        startDate: {
          gte: startDate,
        },
      },
    });

    // Mock previous period data for growth calculations
    const prevTotalRevenue = totalRevenue * 0.9; // Mock: assume 10% growth
    const prevTotalOrders = totalOrders * 0.92;
    const prevTotalVisitors = totalVisitors * 0.85;

    const revenueChange = totalRevenue > 0 ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 : 0;
    const ordersChange = totalOrders > 0 ? ((totalOrders - prevTotalOrders) / prevTotalOrders) * 100 : 0;
    const visitorsChange = totalVisitors > 0 ? ((totalVisitors - prevTotalVisitors) / prevTotalVisitors) * 100 : 0;

    const conversionRate = totalVisitors > 0 ? (totalOrders / totalVisitors) * 100 : 0;
    const prevConversionRate = conversionRate * 0.95; // Mock: assume slight improvement
    const conversionChange = conversionRate > 0 ? ((conversionRate - prevConversionRate) / prevConversionRate) * 100 : 0;

    // Prepare sales data
    const salesData = analyticsRecords.map((record) => {
      const dayOrders = vendorOrders.filter(
        (order) => order.createdAt.toDateString() === record.date.toDateString()
      );
      const dayRevenue = dayOrders.reduce(
        (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.price * item.quantity, 0),
        0
      );

      return {
        date: record.date.toISOString().split('T')[0],
        revenue: dayRevenue,
        orders: dayOrders.length,
      };
    });

    // Prepare visitor data
    const visitorData = analyticsRecords.map((record) => ({
      date: record.date.toISOString().split('T')[0],
      visitors: record.views,
      uniqueVisitors: Math.floor(record.views * 0.7), // Mock: 70% unique
    }));

    // Get top products
    const productStats: { [key: string]: { name: string; sales: number; revenue: number } } = {};

    vendorOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!productStats[item.productId]) {
          productStats[item.productId] = {
            name: item.product.name,
            sales: 0,
            revenue: 0,
          };
        }
        productStats[item.productId].sales += item.quantity;
        productStats[item.productId].revenue += item.price * item.quantity;
      });
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Category breakdown
    const categoryStats: { [key: string]: number } = {};

    vendorOrders.forEach((order) => {
      order.items.forEach((item) => {
        const category = item.product.category;
        if (!categoryStats[category]) {
          categoryStats[category] = 0;
        }
        categoryStats[category] += item.price * item.quantity;
      });
    });

    const categoryBreakdown = Object.entries(categoryStats).map(([name, value]) => ({
      name,
      value,
    }));

    // Ad performance
    const adPerformance = adCampaigns.map((campaign) => ({
      campaign: campaign.title,
      impressions: campaign.impressions,
      clicks: campaign.clicks,
      ctr: campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0,
    }));

    return NextResponse.json({
      overview: {
        totalRevenue,
        revenueChange,
        totalOrders,
        ordersChange,
        totalVisitors,
        visitorsChange,
        conversionRate,
        conversionChange,
      },
      salesData,
      visitorData,
      topProducts,
      categoryBreakdown,
      adPerformance,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

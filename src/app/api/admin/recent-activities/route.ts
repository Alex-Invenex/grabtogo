import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
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
    const limit = parseInt(searchParams.get('limit') || '20');

    // Fetch recent vendor registrations
    const vendorRegistrations = await db.vendorRegistrationRequest.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Fetch recent orders
    const recentOrders = await db.order.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      include: {
        customer: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Fetch recent payments
    const recentPayments = await db.payment.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
        status: 'COMPLETED',
      },
      include: {
        order: {
          include: {
            vendor: {
              select: {
                name: true,
                vendorProfile: {
                  select: { storeName: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Fetch recent vendor approvals
    const recentApprovals = await db.vendorRegistrationRequest.findMany({
      where: {
        status: 'approved',
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 3,
    });

    // Combine and format activities
    const activities = [
      // Vendor registrations
      ...vendorRegistrations.map((reg) => ({
        id: `vendor-reg-${reg.id}`,
        type: 'vendor' as const,
        title: 'New Vendor Registration',
        description: `${reg.companyName} submitted application for approval`,
        timestamp: reg.createdAt.toISOString(),
        color: 'blue',
        priority: 'high' as const,
        username: reg.companyName,
      })),

      // Recent orders
      ...recentOrders.map((order) => ({
        id: `order-${order.id}`,
        type: 'order' as const,
        title: 'New Order Processed',
        description: `Order #${order.id.substring(0, 8)} worth ₹${order.totalAmount.toLocaleString()} - ${order.status}`,
        timestamp: order.createdAt.toISOString(),
        color: 'green',
        priority: order.totalAmount > 10000 ? ('high' as const) : ('medium' as const),
        username: order.customer?.name || 'Customer',
      })),

      // Recent payments
      ...recentPayments.map((payment) => ({
        id: `payment-${payment.id}`,
        type: 'payment' as const,
        title: 'Payment Received',
        description: `Payment of ₹${payment.amount.toLocaleString()} received from ${payment.order?.vendor?.vendorProfile?.storeName || payment.order?.vendor?.name || 'vendor'}`,
        timestamp: payment.createdAt.toISOString(),
        color: 'purple',
        priority: 'low' as const,
        username: payment.order?.vendor?.vendorProfile?.storeName || payment.order?.vendor?.name,
      })),

      // Vendor approvals
      ...recentApprovals.map((reg) => ({
        id: `vendor-approved-${reg.id}`,
        type: 'vendor' as const,
        title: 'Vendor Approved',
        description: `${reg.companyName} has been approved and activated`,
        timestamp: reg.updatedAt.toISOString(),
        color: 'green',
        priority: 'medium' as const,
        username: reg.companyName,
      })),
    ];

    // Sort by timestamp and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      activities: sortedActivities,
      count: sortedActivities.length,
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent activities' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { UserRole } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user || (session.user as any).role !== UserRole.VENDOR) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch vendor subscription
    const subscription = await db.vendorSubscription.findFirst({
      where: { vendorId: userId! },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch products count
    const totalProducts = await db.product.count({
      where: { vendorId: userId! },
    });

    // Fetch orders statistics
    const [totalOrders, pendingOrders] = await Promise.all([
      db.order.count({
        where: {
          items: {
            some: {
              product: {
                vendorId: userId!,
              },
            },
          },
        },
      }),
      db.order.count({
        where: {
          items: {
            some: {
              product: {
                vendorId: userId!,
              },
            },
          },
          status: 'PENDING',
        },
      }),
    ]);

    // Fetch revenue
    const orders = await db.order.findMany({
      where: {
        items: {
          some: {
            product: {
              vendorId: userId!,
            },
          },
        },
        status: 'DELIVERED',
      },
      select: {
        total: true,
      },
    });

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);

    // Fetch customers count (unique users who ordered)
    const orderWithCustomers = await db.order.findMany({
      where: {
        items: {
          some: {
            product: {
              vendorId: userId!,
            },
          },
        },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    const totalCustomers = orderWithCustomers.length;

    // Fetch reviews statistics
    const reviews = await db.review.findMany({
      where: {
        product: {
          vendorId: userId!,
        },
      },
      select: {
        rating: true,
      },
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

    // Fetch story views
    const stories = await db.vendorStory.findMany({
      where: { vendorId: userId! },
      include: {
        views: true,
      },
    });

    const storyViews = stories.reduce((sum, story) => sum + story.views.length, 0);

    // Fetch unread messages
    const newMessages = await db.chatMessage.count({
      where: {
        chat: {
          participants: {
            some: {
              userId: userId,
            },
          },
        },
        userId: {
          not: userId,
        },
        read: false,
      },
    });

    return NextResponse.json({
      stats: {
        totalProducts,
        totalOrders,
        pendingOrders,
        totalRevenue,
        totalCustomers,
        averageRating: Number(averageRating.toFixed(1)),
        totalReviews,
        storyViews,
        newMessages,
      },
      subscription: subscription ? {
        planType: subscription.planType,
        status: subscription.status,
        currentPeriodEnd: subscription.endDate,
        maxProducts: subscription.maxProducts,
        maxOrders: subscription.maxOrders,
        usedProducts: totalProducts,
        usedOrders: totalOrders,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching vendor stats:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}

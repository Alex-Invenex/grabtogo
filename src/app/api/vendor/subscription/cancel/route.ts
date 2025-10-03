import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;

    if (userRole !== 'VENDOR') {
      return NextResponse.json({ error: 'Only vendors can cancel subscription' }, { status: 403 });
    }

    // Get active subscription
    const subscription = await db.vendorSubscription.findFirst({
      where: {
        vendorId: session.user.id!,
        status: 'ACTIVE',
      },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // Update subscription to grace period
    const updated = await db.vendorSubscription.update({
      where: { id: subscription.id },
      data: {
        status: 'GRACE_PERIOD',
        autoRenew: false,
        cancelledAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Subscription cancelled successfully',
      subscription: updated,
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}

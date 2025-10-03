import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import crypto from 'crypto';

const PLAN_PRICES: { [key: string]: number } = {
  BASIC: 99,
  PROFESSIONAL: 199,
  PREMIUM: 299,
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;

    if (userRole !== 'VENDOR') {
      return NextResponse.json({ error: 'Only vendors can verify payments' }, { status: 403 });
    }

    const body = await request.json();
    const { orderId, paymentId, signature, tier } = body;

    if (!orderId || !paymentId || !signature || !tier) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (generatedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    const price = PLAN_PRICES[tier];

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // Check if vendor has existing subscription
    const existingSubscription = await db.vendorSubscription.findFirst({
      where: { vendorId: session.user.id! },
      orderBy: { createdAt: 'desc' },
    });

    // If exists and is active/grace period, update it
    if (existingSubscription && (existingSubscription.status === 'ACTIVE' || existingSubscription.status === 'GRACE_PERIOD')) {
      await db.vendorSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          tier,
          status: 'ACTIVE',
          startDate,
          endDate,
          autoRenew: true,
          cancelledAt: null,
        },
      });
    } else {
      // Create new subscription
      await db.vendorSubscription.create({
        data: {
          vendorId: session.user.id!,
          tier,
          status: 'ACTIVE',
          startDate,
          endDate,
          autoRenew: true,
        },
      });
    }

    // Create payment record
    await db.payment.create({
      data: {
        userId: session.user.id!,
        amount: price,
        currency: 'INR',
        status: 'COMPLETED',
        method: 'RAZORPAY',
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
      },
    });

    return NextResponse.json({
      message: 'Payment verified and subscription updated successfully',
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const PLAN_PRICES: { [key: string]: number } = {
  BASIC: 99,
  PROFESSIONAL: 199,
  PREMIUM: 299,
};

const upgradeSchema = z.object({
  tier: z.enum(['BASIC', 'PROFESSIONAL', 'PREMIUM']),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;

    if (userRole !== 'VENDOR') {
      return NextResponse.json({ error: 'Only vendors can upgrade subscription' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = upgradeSchema.parse(body);

    // Get vendor profile
    const vendorProfile = await db.vendorProfile.findUnique({
      where: { userId: session.user.id! },
    });

    if (!vendorProfile) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    const price = PLAN_PRICES[validatedData.tier];

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(price * 100), // Convert to paise
      currency: 'INR',
      receipt: `sub_${Date.now()}`,
      notes: {
        vendorId: vendorProfile.id,
        tier: validatedData.tier,
      },
    });

    return NextResponse.json({
      message: 'Order created successfully',
      orderId: razorpayOrder.id,
      amount: price,
    });
  } catch (error) {
    console.error('Error creating upgrade order:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create upgrade order' },
      { status: 500 }
    );
  }
}

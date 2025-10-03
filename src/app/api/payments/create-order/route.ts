import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { RazorpayService } from '@/lib/razorpay';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createOrderSchema = z.object({
  orderId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId } = createOrderSchema.parse(body);

    // Get order details from database
    const order = await db.order.findUnique({
      where: {
        id: orderId,
        userId: session.user.id!,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Create Razorpay order
    const razorpayAmount = RazorpayService.convertToRazorpayAmount(
      parseFloat(order.totalAmount.toString())
    );

    const razorpayOrder = await RazorpayService.createOrder({
      amount: razorpayAmount,
      currency: 'INR',
      receipt: RazorpayService.generateReceiptId('order'),
      notes: {
        orderId: order.id,
        userId: session.user.id!,
      },
    });

    if (!razorpayOrder.success) {
      return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
    }

    // Create payment record in database
    await db.payment.create({
      data: {
        orderId: order.id,
        razorpayOrderId: razorpayOrder.order!.id,
        amount: order.totalAmount,
        currency: 'INR',
        status: 'PENDING',
        gateway: 'razorpay',
      },
    });

    return NextResponse.json({
      orderId: razorpayOrder.order!.id,
      amount: razorpayOrder.order!.amount,
      currency: razorpayOrder.order!.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

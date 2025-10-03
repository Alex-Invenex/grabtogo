import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import crypto from 'crypto';

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
    const { campaignId, orderId, paymentId, signature } = body;

    if (!campaignId || !orderId || !paymentId || !signature) {
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

    // Verify campaign belongs to vendor
    const campaign = await db.adCampaign.findFirst({
      where: {
        id: campaignId,
        vendorId: session.user.id!,
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Update campaign status to ACTIVE
    await db.adCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'ACTIVE',
      },
    });

    // Create payment record
    await db.payment.create({
      data: {
        userId: session.user.id!,
        amount: campaign.budget,
        currency: 'INR',
        status: 'COMPLETED',
        method: 'RAZORPAY',
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
      },
    });

    return NextResponse.json({
      message: 'Payment verified successfully',
      campaign: {
        id: campaign.id,
        status: 'ACTIVE',
      },
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}

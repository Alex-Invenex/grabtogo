import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const campaignSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  adType: z.enum(['HOMEPAGE_BANNER', 'SEARCH_AD', 'POPUP']),
  targetUrl: z.string().url(),
  imageUrl: z.string().url(),
  budget: z.number().positive(),
  dailyBudget: z.number().positive(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

// GET - Fetch vendor's ad campaigns
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;

    if (userRole !== 'VENDOR') {
      return NextResponse.json({ error: 'Only vendors can access campaigns' }, { status: 403 });
    }

    // Fetch campaigns
    const campaigns = await db.adCampaign.findMany({
      where: { vendorId: session.user.id! },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// POST - Create new ad campaign
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;

    if (userRole !== 'VENDOR') {
      return NextResponse.json({ error: 'Only vendors can create campaigns' }, { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const validatedData = campaignSchema.parse(body);

    // Validate dates
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(validatedData.budget * 100), // Convert to paise
      currency: 'INR',
      receipt: `ad_${Date.now()}`,
      notes: {
        vendorId: session.user.id!,
        adType: validatedData.adType,
      },
    });

    // Create campaign with PENDING_PAYMENT status
    const campaign = await db.adCampaign.create({
      data: {
        vendorId: session.user.id!,
        title: validatedData.title,
        description: validatedData.description,
        adType: validatedData.adType,
        targetUrl: validatedData.targetUrl,
        imageUrl: validatedData.imageUrl,
        budget: validatedData.budget,
        dailyBudget: validatedData.dailyBudget,
        spent: 0,
        startDate,
        endDate,
        status: 'PENDING_PAYMENT',
        impressions: 0,
        clicks: 0,
      },
    });

    return NextResponse.json({
      message: 'Campaign created successfully',
      campaignId: campaign.id,
      orderId: razorpayOrder.id,
      amount: validatedData.budget,
    });
  } catch (error) {
    console.error('Error creating campaign:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}

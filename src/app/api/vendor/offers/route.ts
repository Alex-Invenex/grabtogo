import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const offerSchema = z.object({
  productId: z.string().min(1),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  stockLimit: z.number().int().positive(),
});

// GET - Fetch vendor's offers
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;

    if (userRole !== 'VENDOR') {
      return NextResponse.json({ error: 'Only vendors can access offers' }, { status: 403 });
    }

    // Fetch offers
    const offers = await db.offer.findMany({
      where: { vendorId: session.user.id! },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            images: {
              take: 1,
              orderBy: { order: 'asc' },
              select: { url: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ offers });
  } catch (error) {
    console.error('Error fetching offers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offers' },
      { status: 500 }
    );
  }
}

// POST - Create new offer
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;

    if (userRole !== 'VENDOR') {
      return NextResponse.json({ error: 'Only vendors can create offers' }, { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const validatedData = offerSchema.parse(body);

    // Verify product belongs to vendor
    const product = await db.product.findFirst({
      where: {
        id: validatedData.productId,
        vendorId: session.user.id!,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found or does not belong to you' }, { status: 404 });
    }

    // Validate stock limit
    if (validatedData.stockLimit > product.stockQuantity) {
      return NextResponse.json(
        { error: 'Stock limit cannot exceed available stock' },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Validate discount value
    if (validatedData.discountType === 'percentage' && validatedData.discountValue > 100) {
      return NextResponse.json(
        { error: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      );
    }

    if (validatedData.discountType === 'fixed' && validatedData.discountValue >= product.price) {
      return NextResponse.json(
        { error: 'Fixed discount cannot be equal to or greater than product price' },
        { status: 400 }
      );
    }

    // Check for overlapping offers
    const overlappingOffer = await db.offer.findFirst({
      where: {
        productId: validatedData.productId,
        isActive: true,
        OR: [
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: startDate } },
            ],
          },
        ],
      },
    });

    if (overlappingOffer) {
      return NextResponse.json(
        { error: 'An active offer already exists for this product in the selected time period' },
        { status: 400 }
      );
    }

    // Create offer
    const offer = await db.offer.create({
      data: {
        vendorId: session.user.id!,
        productId: validatedData.productId,
        discountType: validatedData.discountType,
        discountValue: validatedData.discountValue,
        startDate,
        endDate,
        stockLimit: validatedData.stockLimit,
        stockSold: 0,
        isActive: true,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            images: {
              take: 1,
              orderBy: { order: 'asc' },
              select: { url: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Offer created successfully',
      offer,
    });
  } catch (error) {
    console.error('Error creating offer:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create offer' },
      { status: 500 }
    );
  }
}

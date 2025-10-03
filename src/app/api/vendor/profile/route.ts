import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const profileUpdateSchema = z.object({
  storeName: z.string().min(2),
  tagline: z.string().max(100).optional(),
  description: z.string().optional(),
  phone: z.string(),
  email: z.string().email(),
  website: z.string().optional(),

  // Address
  addressLine1: z.string(),
  addressLine2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  pinCode: z.string(),
  landmark: z.string().optional(),

  // Location
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  deliveryRadius: z.number(),

  // Media
  logoUrl: z.string().optional(),
  bannerUrl: z.string().optional(),

  // Business hours and social links (stored as JSON)
  businessHours: z.string().optional(),
  socialLinks: z.string().optional(),
});

// GET - Fetch vendor profile
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'VENDOR') {
      return NextResponse.json({ error: 'Only vendors can access this endpoint' }, { status: 403 });
    }

    // Get vendor profile
    const vendorProfile = await db.vendorProfile.findUnique({
      where: { userId: session.user.id! },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!vendorProfile) {
      // Return empty profile if not exists
      return NextResponse.json({
        profile: null,
        message: 'No profile found. Please complete your profile.',
      });
    }

    // Transform database fields to match frontend expectations
    const addressParts = vendorProfile.address?.split(',').map(p => p.trim()) || [];
    const transformedProfile = {
      ...vendorProfile,
      // Map database fields to frontend field names
      tagline: vendorProfile.description || '',
      phone: vendorProfile.user.phone || '',
      email: vendorProfile.user.email || '',
      addressLine1: addressParts[0] || '',
      addressLine2: addressParts.slice(1).join(', ') || '',
      pinCode: vendorProfile.zipCode || '',
      landmark: '', // Not stored in database
      businessHours: null, // Not stored in database
      socialLinks: null, // Not stored in database
    };

    return NextResponse.json({
      profile: transformedProfile,
    });
  } catch (error) {
    console.error('Get vendor profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update vendor profile
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'VENDOR') {
      return NextResponse.json({ error: 'Only vendors can update profile' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = profileUpdateSchema.parse(body);

    // Transform frontend fields to database schema
    const fullAddress = [
      validatedData.addressLine1,
      validatedData.addressLine2,
    ]
      .filter(Boolean)
      .join(', ');

    // Check if vendor profile exists
    const existingProfile = await db.vendorProfile.findUnique({
      where: { userId: session.user.id! },
    });

    let profile;

    const profileData = {
      storeName: validatedData.storeName,
      storeSlug: validatedData.storeName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
      description: validatedData.tagline || validatedData.description || null,

      // Address (combine addressLine1 + addressLine2 into single address field)
      address: fullAddress,
      city: validatedData.city,
      state: validatedData.state,
      zipCode: validatedData.pinCode, // pinCode → zipCode

      // Location
      latitude: validatedData.latitude,
      longitude: validatedData.longitude,
      deliveryRadius: validatedData.deliveryRadius,

      // Media
      logoUrl: validatedData.logoUrl,
      bannerUrl: validatedData.bannerUrl,

      // Note: Fields not saved (don't exist in schema):
      // - landmark, phone, email (stored in user table)
      // - businessHours, socialLinks (not in current schema)
    };

    if (existingProfile) {
      // Update existing profile
      profile = await db.vendorProfile.update({
        where: { userId: session.user.id! },
        data: {
          ...profileData,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new profile
      profile = await db.vendorProfile.create({
        data: {
          userId: session.user.id!,
          ...profileData,
          // Default values
          isVerified: false,
          isActive: true,
        },
      });
    }

    // Update user's name, phone, and email
    await db.user.update({
      where: { id: session.user.id! },
      data: {
        name: validatedData.storeName,
        phone: validatedData.phone,
        email: validatedData.email,
      },
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Update vendor profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { cache } from '@/lib/redis';
import { UserRole } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateVendorSchema = z.object({
  vendorId: z.string(),
  action: z.enum(['activate', 'suspend', 'verify', 'unverify']),
});

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // all, ACTIVE, PENDING, SUSPENDED, INACTIVE
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause for vendors
    const where: any = {
      role: UserRole.VENDOR,
    };

    // Apply status filter
    if (status && status !== 'all') {
      if (status === 'ACTIVE') {
        where.vendorProfile = { isActive: true, isVerified: true };
      } else if (status === 'PENDING') {
        where.vendorProfile = { isVerified: false };
      } else if (status === 'SUSPENDED') {
        where.vendorProfile = { isActive: false };
      } else if (status === 'INACTIVE') {
        where.vendorProfile = { isActive: true, isVerified: false };
      }
    }

    // Apply search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        {
          vendorProfile: {
            storeName: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    // Get vendors with pagination
    const [vendors, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          isActive: true,
          createdAt: true,
          vendorProfile: {
            select: {
              id: true,
              storeName: true,
              storeSlug: true,
              description: true,
              logoUrl: true,
              isVerified: true,
              isActive: true,
              city: true,
              state: true,
            },
          },
          vendorSubscription: {
            select: {
              planType: true,
              status: true,
              endDate: true,
            },
          },
          _count: {
            select: {
              products: true,
              orders: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      vendors,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Admin vendors list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { vendorId, action } = updateVendorSchema.parse(body);

    // Get vendor
    const vendor = await db.user.findUnique({
      where: { id: vendorId, role: UserRole.VENDOR },
      include: { vendorProfile: true },
    });

    if (!vendor || !vendor.vendorProfile) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Perform action
    let updateData: any = {};
    let message = '';

    switch (action) {
      case 'activate':
        updateData = { isActive: true };
        message = 'Vendor activated successfully';
        break;
      case 'suspend':
        updateData = { isActive: false };
        message = 'Vendor suspended successfully';
        break;
      case 'verify':
        updateData = { isVerified: true };
        message = 'Vendor verified successfully';
        break;
      case 'unverify':
        updateData = { isVerified: false };
        message = 'Vendor unverified successfully';
        break;
    }

    // Update vendor profile
    await db.vendorProfile.update({
      where: { id: vendor.vendorProfile.id },
      data: updateData,
    });

    // Clear cache
    await cache.del('admin:stats:dashboard');

    return NextResponse.json({ message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    console.error('Admin vendor update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

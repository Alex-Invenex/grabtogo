import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { cache } from '@/lib/redis';
import { UserRole } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const approveRegistrationSchema = z.object({
  requestId: z.string(),
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().optional(),
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
    const status = searchParams.get('status') || 'pending';

    const skip = (page - 1) * limit;

    const where: any = {};
    if (status !== 'all') {
      where.status = status;
    }

    const [requests, total] = await Promise.all([
      db.vendorRegistrationRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.vendorRegistrationRequest.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      requests,
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
    console.error('Admin registrations list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    const { requestId, action, rejectionReason } = approveRegistrationSchema.parse(body);

    // Get registration request
    const registrationRequest = await db.vendorRegistrationRequest.findUnique({
      where: { id: requestId },
    });

    if (!registrationRequest) {
      return NextResponse.json({ error: 'Registration request not found' }, { status: 404 });
    }

    if (registrationRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Request already processed' }, { status: 400 });
    }

    if (action === 'reject') {
      // Update request status to rejected
      await db.vendorRegistrationRequest.update({
        where: { id: requestId },
        data: {
          status: 'rejected',
          rejectionReason: rejectionReason || 'Not specified',
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
        },
      });

      // Clear cache
      await cache.del('admin:stats:dashboard');

      return NextResponse.json({ message: 'Registration rejected successfully' });
    }

    // Approve registration - create user and vendor profile
    const hashedPassword = await hashPassword(registrationRequest.password);

    // Check if user with email already exists
    const existingUser = await db.user.findUnique({
      where: { email: registrationRequest.email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Create user and vendor profile in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: registrationRequest.email,
          name: registrationRequest.fullName,
          password: hashedPassword,
          phone: registrationRequest.phone,
          role: UserRole.VENDOR,
          emailVerified: new Date(),
          isActive: true,
        },
      });

      // Create vendor profile
      const vendorProfile = await tx.vendorProfile.create({
        data: {
          userId: user.id,
          storeName: registrationRequest.companyName,
          storeSlug: registrationRequest.companyName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, ''),
          description: registrationRequest.businessType || '',
          isVerified: true,
          isActive: true,
          businessLicense: registrationRequest.gstNumber,
          address: registrationRequest.addressLine1,
          city: registrationRequest.city,
          state: registrationRequest.state,
          zipCode: registrationRequest.pinCode,
          country: 'India',
          latitude: registrationRequest.latitude,
          longitude: registrationRequest.longitude,
          deliveryRadius: registrationRequest.deliveryRadius || 10,
          logoUrl: registrationRequest.logo,
          bannerUrl: registrationRequest.banner,
        },
      });

      // Update registration request
      await tx.vendorRegistrationRequest.update({
        where: { id: requestId },
        data: {
          status: 'approved',
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
        },
      });

      return { user, vendorProfile };
    });

    // Clear cache
    await cache.del('admin:stats:dashboard');

    return NextResponse.json({
      message: 'Registration approved successfully',
      userId: result.user.id,
      vendorProfileId: result.vendorProfile.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    console.error('Admin registration approval error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

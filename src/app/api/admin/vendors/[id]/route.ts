import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { UserRole } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vendorId = params.id;

    // First, try to find in VendorRegistrationRequest (pending vendors)
    const registrationRequest = await db.vendorRegistrationRequest.findUnique({
      where: { id: vendorId },
    });

    if (registrationRequest) {
      return NextResponse.json({
        type: 'registration',
        data: registrationRequest,
      });
    }

    // If not found, try to find in approved vendors (User with VENDOR role)
    const vendor = await db.user.findFirst({
      where: {
        id: vendorId,
        role: UserRole.VENDOR,
      },
      include: {
        vendorProfile: true,
        vendorSubscription: {
          include: {
            plan: true,
          },
        },
        products: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            products: true,
            orders: true,
            reviews: true,
          },
        },
      },
    });

    if (vendor) {
      // Also try to find the original registration request
      const originalRequest = await db.vendorRegistrationRequest.findFirst({
        where: { email: vendor.email },
      });

      return NextResponse.json({
        type: 'vendor',
        data: vendor,
        originalRequest,
      });
    }

    return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching vendor details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

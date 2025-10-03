import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { UserRole } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user || (session.user as any).role !== UserRole.VENDOR) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || undefined;

    // Fetch vendor profile
    const vendorProfile = await db.vendorProfile.findUnique({
      where: { userId },
    });

    if (!vendorProfile) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    // Fetch orders
    const orders = await db.order.findMany({
      where: {
        items: {
          some: {
            product: {
              vendorId: vendorProfile.id,
            },
          },
        },
        ...(status && { status: status as any }),
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          where: {
            product: {
              vendorId: vendorProfile.id,
            },
          },
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching vendor orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

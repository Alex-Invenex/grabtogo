import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { UserRole } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();

    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch pending vendor registration requests
    const pendingRequests = await db.vendorRegistrationRequest.findMany({
      where: {
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ requests: pendingRequests });
  } catch (error) {
    console.error('Error fetching vendor approvals:', error);
    return NextResponse.json({ error: 'Failed to fetch vendor approvals' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { UserRole } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await auth();
    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    // Get all vendor registration requests
    const registrationRequests = await db.vendorRegistrationRequest.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      requests: registrationRequests,
    });
  } catch (error) {
    console.error('Error fetching vendor registration requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor registration requests' },
      { status: 500 }
    );
  }
}

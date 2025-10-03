import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { cache } from '@/lib/redis';
import { UserRole } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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

    // Clear all admin-related caches
    await Promise.all([
      cache.flushPattern('admin:*'),
      cache.flushPattern('notifications:*'),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Admin cache cleared successfully',
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}

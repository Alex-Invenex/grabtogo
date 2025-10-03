import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { UserRole } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all vendors
    const vendors = await db.user.findMany({
      where: { role: UserRole.VENDOR },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        vendorProfile: {
          select: {
            storeName: true,
          },
        },
      },
    });

    // Get all registration requests
    const registrations = await db.vendorRegistrationRequest.findMany({
      select: {
        id: true,
        companyName: true,
        fullName: true,
        email: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      vendors: {
        count: vendors.length,
        data: vendors,
      },
      registrations: {
        count: registrations.length,
        data: registrations,
      },
      message: 'To delete all test data, send a DELETE request to this endpoint',
    });
  } catch (error) {
    console.error('Error fetching test data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const confirm = searchParams.get('confirm');

    if (confirm !== 'yes') {
      return NextResponse.json({
        error: 'Please add ?confirm=yes to the URL to confirm deletion of all vendor test data',
        warning: 'This will delete ALL vendors and registration requests (except admin users)',
      }, { status: 400 });
    }

    // Delete in correct order to avoid foreign key constraints
    const deletedData = {
      vendorAnalytics: 0,
      vendorStories: 0,
      vendorSubscriptions: 0,
      vendorProfiles: 0,
      products: 0,
      registrationRequests: 0,
      vendorUsers: 0,
    };

    // Delete vendor analytics
    deletedData.vendorAnalytics = (await db.vendorAnalytics.deleteMany({
      where: { vendor: { role: UserRole.VENDOR } },
    })).count;

    // Delete vendor stories
    deletedData.vendorStories = (await db.vendorStory.deleteMany({
      where: { vendor: { role: UserRole.VENDOR } },
    })).count;

    // Delete vendor subscriptions
    deletedData.vendorSubscriptions = (await db.vendorSubscription.deleteMany({
      where: { user: { role: UserRole.VENDOR } },
    })).count;

    // Delete products
    deletedData.products = (await db.product.deleteMany({
      where: { vendor: { role: UserRole.VENDOR } },
    })).count;

    // Delete vendor profiles
    deletedData.vendorProfiles = (await db.vendorProfile.deleteMany({
      where: { user: { role: UserRole.VENDOR } },
    })).count;

    // Delete vendor users
    deletedData.vendorUsers = (await db.user.deleteMany({
      where: { role: UserRole.VENDOR },
    })).count;

    // Delete all registration requests
    deletedData.registrationRequests = (await db.vendorRegistrationRequest.deleteMany()).count;

    return NextResponse.json({
      message: 'All vendor test data has been deleted successfully',
      deleted: deletedData,
      totalDeleted: Object.values(deletedData).reduce((a, b) => a + b, 0),
    });
  } catch (error) {
    console.error('Error deleting test data:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

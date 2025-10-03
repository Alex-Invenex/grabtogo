import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

// PATCH - Update campaign status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;

    if (userRole !== 'VENDOR') {
      return NextResponse.json({ error: 'Only vendors can update campaigns' }, { status: 403 });
    }

    const resolvedParams = await params;
    const body = await request.json();
    const { status } = body;

    if (!['ACTIVE', 'PAUSED', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Verify campaign belongs to vendor
    const campaign = await db.adCampaign.findFirst({
      where: {
        id: resolvedParams.id,
        vendorId: session.user.id!,
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Update campaign
    const updated = await db.adCampaign.update({
      where: { id: resolvedParams.id },
      data: { status },
    });

    return NextResponse.json({
      message: 'Campaign updated successfully',
      campaign: updated,
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

// DELETE - Delete campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;

    if (userRole !== 'VENDOR') {
      return NextResponse.json({ error: 'Only vendors can delete campaigns' }, { status: 403 });
    }

    const resolvedParams = await params;

    // Verify campaign belongs to vendor
    const campaign = await db.adCampaign.findFirst({
      where: {
        id: resolvedParams.id,
        vendorId: session.user.id!,
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Delete campaign
    await db.adCampaign.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json({
      message: 'Campaign deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}

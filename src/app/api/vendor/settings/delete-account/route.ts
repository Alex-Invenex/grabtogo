import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;

    if (userRole !== 'VENDOR') {
      return NextResponse.json({ error: 'Only vendors can delete their account' }, { status: 403 });
    }

    // Delete vendor-related data in transaction
    await db.$transaction(async (tx) => {
      // Delete vendor stories
      await tx.vendorStory.deleteMany({
        where: { vendorId: session.user.id! },
      });

      // Delete vendor analytics
      await tx.vendorAnalytics.deleteMany({
        where: { vendorId: session.user.id! },
      });

      // Delete vendor subscriptions
      await tx.vendorSubscription.deleteMany({
        where: { vendorId: session.user.id! },
      });

      // Delete ad campaigns
      await tx.adCampaign.deleteMany({
        where: { vendorId: session.user.id! },
      });

      // Delete offers
      await tx.offer.deleteMany({
        where: { vendorId: session.user.id! },
      });

      // Delete support tickets and messages
      const tickets = await tx.supportTicket.findMany({
        where: { vendorId: session.user.id! },
        select: { id: true },
      });

      for (const ticket of tickets) {
        await tx.supportMessage.deleteMany({
          where: { ticketId: ticket.id },
        });
      }

      await tx.supportTicket.deleteMany({
        where: { vendorId: session.user.id! },
      });

      // Delete products (this will cascade to product images, variants, etc.)
      await tx.product.deleteMany({
        where: { vendorId: session.user.id! },
      });

      // Delete vendor profile
      await tx.vendorProfile.delete({
        where: { userId: session.user.id! },
      });

      // Delete user
      await tx.user.delete({
        where: { id: session.user.id! },
      });
    });

    return NextResponse.json({
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}

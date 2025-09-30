import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { cache } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { notificationId } = await params;

    // Verify notification belongs to user
    const notification = await db.notification.findFirst({
      where: {
        id: notificationId,
        userId: session.user.id!,
      },
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Mark as read
    const updatedNotification = await db.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Clear user's notifications cache
    await cache.flushPattern(`notifications:user:${session.user.id}:*`);

    return NextResponse.json({
      message: 'Notification marked as read',
      notification: {
        ...updatedNotification,
        data: updatedNotification.data ? JSON.parse(updatedNotification.data) : null,
      },
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { notificationId } = await params;

    // Verify notification belongs to user
    const notification = await db.notification.findFirst({
      where: {
        id: notificationId,
        userId: session.user.id!,
      },
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Delete notification
    await db.notification.delete({
      where: { id: notificationId },
    });

    // Clear user's notifications cache
    await cache.flushPattern(`notifications:user:${session.user.id}:*`);

    return NextResponse.json({
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

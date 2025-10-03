import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const notificationsSchema = z.object({
  emailOrders: z.boolean(),
  emailMessages: z.boolean(),
  emailMarketing: z.boolean(),
  pushOrders: z.boolean(),
  pushMessages: z.boolean(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = notificationsSchema.parse(body);

    // In a real app, you would store these settings in a database table
    // For now, we'll just validate and return success
    // You can create a NotificationSettings table and store these preferences

    return NextResponse.json({
      message: 'Notification preferences updated successfully',
    });
  } catch (error) {
    console.error('Error updating notifications:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}

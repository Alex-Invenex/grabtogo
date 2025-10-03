import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const messageSchema = z.object({
  content: z.string().min(1),
});

export async function POST(
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
      return NextResponse.json({ error: 'Only vendors can send messages' }, { status: 403 });
    }

    const resolvedParams = await params;
    const body = await request.json();
    const validatedData = messageSchema.parse(body);

    // Verify ticket belongs to vendor
    const ticket = await db.supportTicket.findFirst({
      where: {
        id: resolvedParams.id,
        vendorId: session.user.id!,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Create message
    const message = await db.supportMessage.create({
      data: {
        ticketId: resolvedParams.id,
        content: validatedData.content,
        senderRole: 'VENDOR',
      },
    });

    // Update ticket updatedAt
    await db.supportTicket.update({
      where: { id: resolvedParams.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      message,
    });
  } catch (error) {
    console.error('Error sending message:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

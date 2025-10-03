import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const ticketSchema = z.object({
  subject: z.string().min(1).max(200),
  category: z.enum(['TECHNICAL', 'BILLING', 'ACCOUNT', 'PRODUCT', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  description: z.string().min(1),
});

// GET - Fetch vendor's support tickets
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;

    if (userRole !== 'VENDOR') {
      return NextResponse.json({ error: 'Only vendors can access support tickets' }, { status: 403 });
    }

    // Fetch tickets with messages
    const tickets = await db.supportTicket.findMany({
      where: { vendorId: session.user.id! },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support tickets' },
      { status: 500 }
    );
  }
}

// POST - Create new support ticket
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;

    if (userRole !== 'VENDOR') {
      return NextResponse.json({ error: 'Only vendors can create support tickets' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = ticketSchema.parse(body);

    // Create ticket
    const ticket = await db.supportTicket.create({
      data: {
        vendorId: session.user.id!,
        subject: validatedData.subject,
        category: validatedData.category,
        priority: validatedData.priority,
        status: 'OPEN',
      },
      include: {
        messages: true,
      },
    });

    // Create initial message with description
    const message = await db.supportMessage.create({
      data: {
        ticketId: ticket.id,
        content: validatedData.description,
        senderRole: 'VENDOR',
      },
    });

    const ticketWithMessages = {
      ...ticket,
      messages: [message],
    };

    return NextResponse.json({
      message: 'Support ticket created successfully',
      ticket: ticketWithMessages,
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}

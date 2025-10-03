import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { cache } from '@/lib/redis';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createChatSchema = z.object({
  type: z.enum(['private', 'group', 'support']).default('private'),
  title: z.string().optional(),
  participantIds: z.array(z.string()).min(1),
});

const getChatSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  type: z.enum(['private', 'group', 'support']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createChatSchema.parse(body);

    // Check if private chat already exists between users
    if (validatedData.type === 'private' && validatedData.participantIds.length === 1) {
      const existingChat = await db.chat.findFirst({
        where: {
          type: 'private',
          AND: [
            {
              participants: {
                some: {
                  userId: session.user.id!,
                },
              },
            },
            {
              participants: {
                some: {
                  userId: validatedData.participantIds[0],
                },
              },
            },
          ],
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  role: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      if (existingChat) {
        return NextResponse.json({
          message: 'Chat already exists',
          chat: existingChat,
        });
      }
    }

    // Create new chat
    const chat = await db.chat.create({
      data: {
        type: validatedData.type,
        title: validatedData.title,
        createdBy: session.user.id!,
        participants: {
          create: [
            {
              userId: session.user.id!,
              role: 'admin',
            },
            ...validatedData.participantIds.map((userId) => ({
              userId,
              role: 'member',
            })),
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                role: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    // Clear user's chat cache
    await cache.flushPattern(`chats:user:${session.user.id}:*`);

    return NextResponse.json(
      {
        message: 'Chat created successfully',
        chat,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Create chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const validatedParams = getChatSchema.parse(params);

    const page = parseInt(validatedParams.page || '1');
    const limit = parseInt(validatedParams.limit || '20');
    const skip = (page - 1) * limit;

    // Create cache key
    const cacheKey = `chats:user:${session.user.id}:${JSON.stringify({
      page,
      limit,
      type: validatedParams.type,
    })}`;

    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Build where clause
    const where: any = {
      participants: {
        some: {
          userId: session.user.id!,
        },
      },
    };

    if (validatedParams.type) {
      where.type = validatedParams.type;
    }

    // Get user's chats
    const [chats, total] = await Promise.all([
      db.chat.findMany({
        where,
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  role: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
          _count: {
            select: {
              messages: {
                where: {
                  receiverId: session.user.id!,
                  status: { in: ['sent', 'delivered'] },
                },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      db.chat.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const result = {
      data: chats.map((chat) => ({
        ...chat,
        unreadCount: chat._count.messages,
        _count: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    };

    // Cache for 2 minutes
    await cache.set(cacheKey, result, 120);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Get chats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

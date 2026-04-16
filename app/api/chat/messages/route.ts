import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    await requireAuth();

    const messages = await prisma.chatMessage.findMany({
      include: {
        player: {
          select: {
            id: true,
            name: true,
            photoUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const message = await prisma.chatMessage.create({
      data: {
        playerId: session.playerId,
        content: content.trim(),
      },
      include: {
        player: {
          select: {
            id: true,
            name: true,
            photoUrl: true,
          },
        },
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('Post message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

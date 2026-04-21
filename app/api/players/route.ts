import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAuth();

    const players = await prisma.player.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        handicap: true,
        photoUrl: true,
        inviteSent: true,
        nickname: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(players);
  } catch (error) {
    console.error('Get players error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

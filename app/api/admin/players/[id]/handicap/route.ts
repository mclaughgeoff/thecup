import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const { handicap } = await request.json();
    const parsed = typeof handicap === 'number' ? handicap : parseFloat(handicap);

    if (Number.isNaN(parsed)) {
      return NextResponse.json(
        { error: 'Invalid handicap' },
        { status: 400 }
      );
    }

    const player = await prisma.player.update({
      where: { id: params.id },
      data: { handicap: parsed },
    });

    return NextResponse.json(player);
  } catch (error) {
    console.error('Update handicap error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' || message === 'Admin access required' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

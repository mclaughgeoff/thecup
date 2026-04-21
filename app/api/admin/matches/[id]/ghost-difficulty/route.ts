import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const ALLOWED = ['AUTO', 'EASY', 'STANDARD', 'TOUGH'] as const;

/**
 * PATCH /api/admin/matches/[id]/ghost-difficulty
 * Body: { difficulty: 'AUTO' | 'EASY' | 'STANDARD' | 'TOUGH' }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdmin();
    const body = (await request.json()) as { difficulty?: string };
    const difficulty = body.difficulty;
    if (!difficulty || !ALLOWED.includes(difficulty as (typeof ALLOWED)[number])) {
      return NextResponse.json(
        { error: `difficulty must be one of ${ALLOWED.join(', ')}` },
        { status: 400 },
      );
    }

    await prisma.match.update({
      where: { id: params.id },
      data: { ghostDifficulty: difficulty },
    });

    return NextResponse.json({ success: true, ghostDifficulty: difficulty });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    const status =
      msg === 'Unauthorized' ? 401 : msg === 'Admin access required' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

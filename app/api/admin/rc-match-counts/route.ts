import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    const counts = await prisma.match.groupBy({
      by: ['roundId'],
      _count: { _all: true },
    });
    const out: Record<string, number> = {};
    for (const c of counts) out[c.roundId] = c._count._all;
    return NextResponse.json(out);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status =
      message === 'Unauthorized' ? 401 : message === 'Admin access required' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

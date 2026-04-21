import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    const [rounds, courses, formats] = await Promise.all([
      prisma.round.findMany({
        orderBy: { date: 'asc' },
        include: {
          courseRef: { include: { teeBoxes: true } },
          formatRef: true,
        },
      }),
      prisma.course.findMany({
        orderBy: { name: 'asc' },
        include: { teeBoxes: { orderBy: { name: 'asc' } } },
      }),
      prisma.format.findMany({
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
    ]);
    return NextResponse.json({ rounds, courses, formats });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status =
      message === 'Unauthorized' ? 401 : message === 'Admin access required' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

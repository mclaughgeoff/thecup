import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAuth();

    const reservations = await prisma.mealReservation.findMany({
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error('List meal reservations error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

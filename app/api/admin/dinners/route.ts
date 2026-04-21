import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    await requireAdmin();

    const reservations = await prisma.mealReservation.findMany({
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error('Admin list meal reservations error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status =
      message === 'Unauthorized' || message === 'Admin access required' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();

    if (!body.date || !body.dayOfWeek || !body.mealType || !body.time || !body.restaurant) {
      return NextResponse.json(
        { error: 'Missing required fields: date, dayOfWeek, mealType, time, restaurant' },
        { status: 400 }
      );
    }

    if (body.mealType !== 'lunch' && body.mealType !== 'dinner') {
      return NextResponse.json(
        { error: 'mealType must be "lunch" or "dinner"' },
        { status: 400 }
      );
    }

    const reservation = await prisma.mealReservation.create({
      data: {
        date: new Date(body.date),
        dayOfWeek: body.dayOfWeek,
        mealType: body.mealType,
        time: body.time,
        restaurant: body.restaurant,
        address: body.address ?? null,
        notes: body.notes ?? null,
        headcount: body.headcount ?? null,
        confirmed: body.confirmed ?? false,
      },
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    console.error('Create meal reservation error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status =
      message === 'Unauthorized' || message === 'Admin access required' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

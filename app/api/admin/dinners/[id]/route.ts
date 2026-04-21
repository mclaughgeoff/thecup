import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const body = await request.json();

    if (body.mealType && body.mealType !== 'lunch' && body.mealType !== 'dinner') {
      return NextResponse.json(
        { error: 'mealType must be "lunch" or "dinner"' },
        { status: 400 }
      );
    }

    const reservation = await prisma.mealReservation.update({
      where: { id: params.id },
      data: {
        date: body.date !== undefined ? new Date(body.date) : undefined,
        dayOfWeek: body.dayOfWeek ?? undefined,
        mealType: body.mealType ?? undefined,
        time: body.time ?? undefined,
        restaurant: body.restaurant ?? undefined,
        address: body.address !== undefined ? body.address : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
        headcount: body.headcount !== undefined ? body.headcount : undefined,
        confirmed: body.confirmed !== undefined ? body.confirmed : undefined,
      },
    });

    return NextResponse.json(reservation);
  } catch (error) {
    console.error('Update meal reservation error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status =
      message === 'Unauthorized' || message === 'Admin access required' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    await prisma.mealReservation.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete meal reservation error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status =
      message === 'Unauthorized' || message === 'Admin access required' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

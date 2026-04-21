import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const body = await request.json();

    const data: Record<string, unknown> = {};
    if (body.course !== undefined)       data.course = body.course;
    if (body.teeTime !== undefined)      data.teeTime = body.teeTime;
    if (body.format !== undefined)       data.format = body.format;
    if (body.isRyderCup !== undefined)   data.isRyderCup = Boolean(body.isRyderCup);
    if (body.activeTeeBox !== undefined) data.activeTeeBox = body.activeTeeBox || null;
    if (body.courseId !== undefined)     data.courseId = body.courseId || null;

    const round = await prisma.round.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(round);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status =
      message === 'Unauthorized' ? 401 : message === 'Admin access required' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

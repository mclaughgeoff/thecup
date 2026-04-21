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
    if (body.course !== undefined)            data.course = body.course;
    if (body.teeTime !== undefined)           data.teeTime = body.teeTime;
    if (body.teeSlots !== undefined) {
      if (!Array.isArray(body.teeSlots)) {
        return NextResponse.json({ error: 'teeSlots must be an array of strings' }, { status: 400 });
      }
      data.teeSlots = body.teeSlots.map((s: unknown) => String(s ?? '').trim()).filter((s: string) => s.length > 0);
    }
    if (body.format !== undefined)            data.format = body.format;
    if (body.isRyderCup !== undefined)        data.isRyderCup = Boolean(body.isRyderCup);
    if (body.activeTeeBox !== undefined)      data.activeTeeBox = body.activeTeeBox || null;
    if (body.courseId !== undefined)          data.courseId = body.courseId || null;
    if (body.formatId !== undefined)          data.formatId = body.formatId || null;
    if (body.handicapAllowance !== undefined) data.handicapAllowance = body.handicapAllowance === null || body.handicapAllowance === '' ? null : Number(body.handicapAllowance);
    if (body.scoringType !== undefined)       data.scoringType = body.scoringType || null;

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

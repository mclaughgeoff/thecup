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
    if (body.name !== undefined)  data.name = body.name;
    if (body.color !== undefined) data.color = body.color || null;

    const team = await prisma.ryderCupTeam.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(team);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status =
      message === 'Unauthorized' ? 401 : message === 'Admin access required' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

function authStatus(msg: string) {
  if (msg === 'Unauthorized') return 401;
  if (msg === 'Admin access required') return 403;
  return 500;
}

const WRITABLE = [
  'name', 'slug', 'description', 'teamSize',
  'scoringType', 'teamScoringMode', 'handicapCombine',
  'defaultAllowance', 'strokeEntryMode', 'sortOrder',
] as const;

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const body = await request.json();
    const data: Record<string, unknown> = {};
    for (const k of WRITABLE) {
      if (body[k] !== undefined) {
        if (k === 'teamSize' || k === 'defaultAllowance' || k === 'sortOrder') {
          data[k] = Number(body[k]);
        } else if (k === 'description') {
          data[k] = body[k] || null;
        } else {
          data[k] = body[k];
        }
      }
    }
    const format = await prisma.format.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(format);
  } catch (error) {
    const m = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: m }, { status: authStatus(m) });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const linked = await prisma.round.count({ where: { formatId: params.id } });
    if (linked > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${linked} round(s) reference this format` },
        { status: 409 }
      );
    }
    await prisma.format.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const m = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: m }, { status: authStatus(m) });
  }
}

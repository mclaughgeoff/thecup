import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

function authStatus(msg: string) {
  if (msg === 'Unauthorized') return 401;
  if (msg === 'Admin access required') return 403;
  return 500;
}

export async function GET() {
  try {
    await requireAdmin();
    const formats = await prisma.format.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json(formats);
  } catch (error) {
    const m = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: m }, { status: authStatus(m) });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();

    const required = ['name', 'slug', 'teamSize', 'scoringType', 'teamScoringMode', 'handicapCombine', 'defaultAllowance', 'strokeEntryMode'];
    for (const f of required) {
      if (body[f] === undefined || body[f] === null || body[f] === '') {
        return NextResponse.json({ error: `${f} is required` }, { status: 400 });
      }
    }

    const format = await prisma.format.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description ?? null,
        teamSize: Number(body.teamSize),
        scoringType: body.scoringType,
        teamScoringMode: body.teamScoringMode,
        handicapCombine: body.handicapCombine,
        defaultAllowance: Number(body.defaultAllowance),
        strokeEntryMode: body.strokeEntryMode,
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : 0,
      },
    });
    return NextResponse.json(format, { status: 201 });
  } catch (error) {
    const m = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: m }, { status: authStatus(m) });
  }
}

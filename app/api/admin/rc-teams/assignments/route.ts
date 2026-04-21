import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Assignment = { playerId: string; teamNumber: 1 | 2 | null };

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = (await request.json()) as { assignments?: Assignment[] };

    if (!Array.isArray(body.assignments)) {
      return NextResponse.json(
        { error: 'assignments must be an array' },
        { status: 400 }
      );
    }

    const teams = await prisma.ryderCupTeam.findMany();
    const byNumber = new Map(teams.map((t) => [t.teamNumber, t]));

    await prisma.$transaction(async (tx) => {
      for (const a of body.assignments!) {
        if (!a.playerId) continue;

        if (a.teamNumber === null || a.teamNumber === undefined) {
          await tx.ryderCupTeamMember.deleteMany({
            where: { playerId: a.playerId },
          });
          continue;
        }

        const team = byNumber.get(a.teamNumber);
        if (!team) continue;

        await tx.ryderCupTeamMember.upsert({
          where: { playerId: a.playerId },
          create: { playerId: a.playerId, teamId: team.id },
          update: { teamId: team.id },
        });
      }
    });

    const refreshed = await prisma.ryderCupTeam.findMany({
      orderBy: { teamNumber: 'asc' },
      include: { members: { include: { player: true } } },
    });

    return NextResponse.json(refreshed);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status =
      message === 'Unauthorized' ? 401 : message === 'Admin access required' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

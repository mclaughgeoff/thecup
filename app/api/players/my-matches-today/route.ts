import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Returns the authed player's matches whose round.date falls on "today" in local
 * time (server local), each with its per-slot tee time and match id. Used by the
 * dashboard banner + today-matches section.
 */
export async function GET() {
  try {
    const session = await requireAuth();

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    const matches = await prisma.match.findMany({
      where: {
        players: { some: { playerId: session.playerId } },
        round: { date: { gte: start, lt: end } },
      },
      orderBy: [{ round: { date: 'asc' } }, { matchNumber: 'asc' }],
      include: {
        teamA: true,
        teamB: true,
        players: { include: { player: true } },
        round: true,
      },
    });

    const rows = matches.map((m) => {
      const teeTime = m.round.teeSlots?.[m.teeSlotIndex ?? 0] ?? m.round.teeTime;
      const sideA = m.players.filter((p) => p.side === 'A').map((p) => p.player.name);
      const sideB = m.players.filter((p) => p.side === 'B').map((p) => p.player.name);
      const mySide = m.players.find((p) => p.playerId === session.playerId)?.side ?? null;
      return {
        matchId: m.id,
        roundId: m.round.id,
        roundNumber: m.round.roundNumber,
        roundLabel: `${m.round.dayOfWeek} · ${m.round.course}`,
        format: m.round.format,
        teeTime,
        roundDate: m.round.date.toISOString(),
        mySide,
        teamA: { name: m.teamA.name, color: m.teamA.color ?? '#C41E3A', players: sideA },
        teamB: { name: m.teamB.name, color: m.teamB.color ?? '#003DA5', players: sideB },
      };
    });

    return NextResponse.json(
      { matches: rows },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    const status = msg === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

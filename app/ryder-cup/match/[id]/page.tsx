import { requireAuth } from '@/lib/auth';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/BottomTabBar';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import {
  computeMatchState,
  resolveRoundFormat,
  type HoleInfo,
  type PlayerInfo,
  type ScoreRow,
  type Side,
} from '@/lib/scoring';

export const dynamic = 'force-dynamic';

export default async function RyderCupMatchPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireAuth();
  const player = await prisma.player.findUnique({ where: { id: session.playerId } });

  const match = await prisma.match.findUnique({
    where: { id: params.id },
    include: {
      teamA: true,
      teamB: true,
      scores: true,
      players: { include: { player: true } },
      round: {
        include: {
          formatRef: true,
          handicapOverrides: true,
          courseRef: {
            include: {
              teeBoxes: true,
              holes: { orderBy: { holeNumber: 'asc' } },
            },
          },
        },
      },
    },
  });

  if (!match) notFound();

  const resolved = resolveRoundFormat(match.round);

  // Build scoring input (only if we have a linked format + course)
  let state: ReturnType<typeof computeMatchState> | null = null;
  let holes: HoleInfo[] = [];
  let slope: number | null = null;

  if (resolved && match.round.courseRef) {
    holes = match.round.courseRef.holes.map((h) => ({
      holeNumber: h.holeNumber,
      par: h.par,
      handicapIndex: h.handicapIndex,
    }));
    const teeBox = match.round.courseRef.teeBoxes.find(
      (t) => t.name === match.round.activeTeeBox,
    );
    slope = teeBox?.slope ?? null;

    const players: PlayerInfo[] = match.players.map((mp) => ({
      playerId: mp.playerId,
      name: mp.player.name,
      handicap: mp.player.handicap,
      side: mp.side as Side,
    }));
    const scores: ScoreRow[] = match.scores.map((s) => ({
      hole: s.hole,
      side: s.side as Side,
      playerId: s.playerId,
      strokes: s.strokes,
    }));

    const playerOverrides: Record<string, number> = {};
    for (const o of match.round.handicapOverrides ?? []) {
      playerOverrides[o.playerId] = o.playingHandicap;
    }

    state = computeMatchState({
      format: resolved.format,
      allowance: resolved.allowance,
      slope,
      holes,
      players,
      scores,
      playerOverrides,
    });
  }

  const teamA = match.teamA;
  const teamB = match.teamB;
  const teamAColor = teamA.color ?? '#C41E3A';
  const teamBColor = teamB.color ?? '#003DA5';

  const sideAPlayers = match.players.filter((p) => p.side === 'A');
  const sideBPlayers = match.players.filter((p) => p.side === 'B');

  const frontHoles = holes.slice(0, 9);
  const backHoles = holes.slice(9);

  const isPerSide = resolved?.format.strokeEntryMode === 'per_side';

  return (
    <>
      <AppHeader title={`Match ${match.matchNumber}`} backHref="/ryder-cup" />
      <main className="bg-ink-0 pb-nav">
        {/* Header / status */}
        <section className="px-4 pt-4">
          <div className="card-elevated">
            <p className="text-[10px] uppercase tracking-widest text-fg-3 text-center">
              Round {match.round.roundNumber} · {match.round.dayOfWeek} ·{' '}
              {match.round.formatRef?.name ?? match.round.format}
            </p>
            <p className="text-center text-sm text-fg-2 mt-1">
              {match.round.course} · {match.round.teeTime}
              {match.round.activeTeeBox ? ` · ${match.round.activeTeeBox} tees` : ''}
            </p>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mt-5">
              <div>
                <div className="h-1 w-8 rounded-full mb-1" style={{ backgroundColor: teamAColor }} />
                <p
                  className="text-[10px] uppercase tracking-wider font-semibold"
                  style={{ color: teamAColor }}
                >
                  {teamA.name}
                </p>
                <p className="mt-1 text-sm">
                  {sideAPlayers.map((mp) => mp.player.name).join(' & ')}
                </p>
              </div>
              <span className="text-fg-3 font-light">vs</span>
              <div className="text-right">
                <div className="h-1 w-8 rounded-full mb-1 ml-auto" style={{ backgroundColor: teamBColor }} />
                <p
                  className="text-[10px] uppercase tracking-wider font-semibold"
                  style={{ color: teamBColor }}
                >
                  {teamB.name}
                </p>
                <p className="mt-1 text-sm">
                  {sideBPlayers.map((mp) => mp.player.name).join(' & ')}
                </p>
              </div>
            </div>

            {state ? (
              <div className="mt-5 pt-4 border-t border-ink-3 text-center">
                <p className="text-[10px] uppercase tracking-widest text-fg-3 mb-1">
                  {state.matchStatus.final ? 'Final' : 'Live'}
                </p>
                <p className="text-3xl font-bold tracking-tight text-masters-glow">
                  {state.matchStatus.label}
                </p>
                {state.points.a != null && state.points.b != null ? (
                  <p className="text-xs text-fg-2 mt-2 font-mono">
                    {state.points.a} – {state.points.b} pts
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="mt-5 pt-4 border-t border-ink-3 text-center">
                <p className="text-xs text-fg-2">
                  No scoring format linked to this round.
                  {player?.isAdmin ? ' Configure in Admin → Rounds.' : ''}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* CTAs */}
        {state ? (
          <section className="px-4 pt-4 grid grid-cols-2 gap-2">
            <Link href={`/ryder-cup/match/${match.id}/score`} className="btn-ghost text-center">
              Enter scores
            </Link>
            <Link href={`/live/${match.id}`} className="btn-primary text-center">
              Live scoring →
            </Link>
          </section>
        ) : null}

        {/* Team handicap summary */}
        {state ? (
          <section className="px-4 pt-4">
            <div className="card">
              <h2 className="label mb-2">Handicaps ({resolved!.allowance}% allowance)</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: teamAColor }}>
                    {teamA.name}
                  </p>
                  <ul className="mt-1 space-y-0.5 text-fg-2">
                    {state.perPlayer.filter((p) => p.side === 'A').map((p) => (
                      <li key={p.playerId}>
                        {p.name}: {p.handicap.toFixed(1)} → PH {p.playingHandicap}
                      </li>
                    ))}
                  </ul>
                  {isPerSide ? (
                    <p className="text-xs font-mono text-masters-glow mt-2">
                      Team PH {state.teamPlayingHandicap.A}
                    </p>
                  ) : null}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: teamBColor }}>
                    {teamB.name}
                  </p>
                  <ul className="mt-1 space-y-0.5 text-fg-2">
                    {state.perPlayer.filter((p) => p.side === 'B').map((p) => (
                      <li key={p.playerId}>
                        {p.name}: {p.handicap.toFixed(1)} → PH {p.playingHandicap}
                      </li>
                    ))}
                  </ul>
                  {isPerSide ? (
                    <p className="text-xs font-mono text-masters-glow mt-2">
                      Team PH {state.teamPlayingHandicap.B}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* Scorecard grid */}
        {state && holes.length > 0 ? (
          <section className="px-4 pt-4 space-y-3">
            <h2 className="label">Scorecard</h2>

            {frontHoles.length > 0 ? (
              <ScorecardNine
                holes={frontHoles}
                state={state}
                teamAColor={teamAColor}
                teamBColor={teamBColor}
                teamAName={teamA.name}
                teamBName={teamB.name}
                label="Front 9"
              />
            ) : null}

            {backHoles.length > 0 ? (
              <ScorecardNine
                holes={backHoles}
                state={state}
                teamAColor={teamAColor}
                teamBColor={teamBColor}
                teamAName={teamA.name}
                teamBName={teamB.name}
                label="Back 9"
              />
            ) : null}

            {/* Totals */}
            <div className="card">
              <h3 className="label mb-2">Totals</h3>
              <div className="grid grid-cols-3 gap-2 text-sm font-mono tabular-nums">
                <div />
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wider text-fg-3 font-sans">Gross</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wider text-fg-3 font-sans">Net</p>
                </div>

                <div className="font-semibold" style={{ color: teamAColor }}>
                  {teamA.name}
                </div>
                <div className="text-center">{state.totals.sideA.gross || '—'}</div>
                <div className="text-center text-masters-glow font-semibold">
                  {state.totals.sideA.net || '—'}
                </div>

                <div className="font-semibold" style={{ color: teamBColor }}>
                  {teamB.name}
                </div>
                <div className="text-center">{state.totals.sideB.gross || '—'}</div>
                <div className="text-center text-masters-glow font-semibold">
                  {state.totals.sideB.net || '—'}
                </div>
              </div>

              {resolved!.format.scoringType === 'stableford' ? (
                <div className="mt-3 pt-3 border-t border-ink-3 grid grid-cols-3 gap-2 text-sm font-mono tabular-nums">
                  <div className="text-[10px] uppercase tracking-wider text-fg-3 font-sans">Stableford</div>
                  <div className="text-center">{state.totals.sideA.stableford}</div>
                  <div className="text-center">{state.totals.sideB.stableford}</div>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </main>
      <BottomTabBar isAdmin={player?.isAdmin} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────

function ScorecardNine({
  holes,
  state,
  teamAColor,
  teamBColor,
  teamAName,
  teamBName,
  label,
}: {
  holes: HoleInfo[];
  state: NonNullable<ReturnType<typeof computeMatchState>>;
  teamAColor: string;
  teamBColor: string;
  teamAName: string;
  teamBName: string;
  label: string;
}) {
  const perHoleMap = new Map(state.perHole.map((h) => [h.hole, h]));

  return (
    <div className="card overflow-x-auto scrollbar-none">
      <p className="text-[10px] uppercase tracking-wider text-fg-3 mb-2">{label}</p>
      <table className="min-w-full text-xs">
        <thead>
          <tr className="text-fg-3">
            <th className="px-2 py-1.5 text-left font-sans font-semibold">Hole</th>
            {holes.map((h) => (
              <th key={h.holeNumber} className="px-2 py-1.5 font-mono tabular-nums">
                {h.holeNumber}
              </th>
            ))}
            <th className="px-2 py-1.5 font-sans">Tot</th>
          </tr>
          <tr className="text-fg-3">
            <th className="px-2 py-1 text-left font-sans">Par</th>
            {holes.map((h) => (
              <th key={h.holeNumber} className="px-2 py-1 font-mono tabular-nums">
                {h.par}
              </th>
            ))}
            <th className="px-2 py-1 font-mono tabular-nums">
              {holes.reduce((s, h) => s + h.par, 0)}
            </th>
          </tr>
          <tr className="text-fg-3">
            <th className="px-2 py-1 text-left font-sans">HCP</th>
            {holes.map((h) => (
              <th key={h.holeNumber} className="px-2 py-1 font-mono tabular-nums">
                {h.handicapIndex}
              </th>
            ))}
            <th />
          </tr>
        </thead>
        <tbody>
          <TeamRow
            color={teamAColor}
            name={teamAName}
            holes={holes}
            perHoleMap={perHoleMap}
            which="A"
          />
          <TeamRow
            color={teamBColor}
            name={teamBName}
            holes={holes}
            perHoleMap={perHoleMap}
            which="B"
          />
          {/* Hole-by-hole match result (dots) */}
          <tr className="text-fg-3 border-t border-ink-3">
            <td className="px-2 py-1 text-left text-[10px] uppercase tracking-wider font-sans">
              Hole
            </td>
            {holes.map((h) => {
              const ph = perHoleMap.get(h.holeNumber);
              let dot = '—';
              let cls = 'text-fg-3';
              if (ph?.matchResult === 'A') { dot = 'A'; cls = ''; }
              else if (ph?.matchResult === 'B') { dot = 'B'; cls = ''; }
              else if (ph?.matchResult === 'halve') { dot = '½'; cls = 'text-fg-2'; }
              return (
                <td key={h.holeNumber} className={`px-2 py-1 text-center font-mono ${cls}`}>
                  <span
                    style={
                      ph?.matchResult === 'A'
                        ? { color: teamAColor }
                        : ph?.matchResult === 'B'
                        ? { color: teamBColor }
                        : {}
                    }
                  >
                    {dot}
                  </span>
                </td>
              );
            })}
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function TeamRow({
  color,
  name,
  holes,
  perHoleMap,
  which,
}: {
  color: string;
  name: string;
  holes: HoleInfo[];
  perHoleMap: Map<number, NonNullable<ReturnType<typeof computeMatchState>>['perHole'][0]>;
  which: 'A' | 'B';
}) {
  let grossTot = 0;
  let netTot = 0;

  return (
    <tr className="border-t border-ink-3">
      <td
        className="px-2 py-1.5 text-left text-[11px] font-semibold whitespace-nowrap"
        style={{ color }}
      >
        {name}
      </td>
      {holes.map((h) => {
        const ph = perHoleMap.get(h.holeNumber);
        const gross = which === 'A' ? ph?.grossA : ph?.grossB;
        const net = which === 'A' ? ph?.netA : ph?.netB;
        const strokes = which === 'A' ? ph?.strokesA : ph?.strokesB;
        if (gross != null) grossTot += gross;
        if (net != null) netTot += net;
        const hasStroke = (strokes ?? 0) > 0;

        return (
          <td key={h.holeNumber} className="px-2 py-1.5 text-center align-middle">
            {gross == null ? (
              <span className="text-fg-3 font-mono">—</span>
            ) : (
              <div className="relative inline-flex flex-col items-center leading-tight">
                {hasStroke ? (
                  <span
                    className="absolute -top-1 -right-2 w-1.5 h-1.5 rounded-full bg-masters-glow"
                    aria-label={`${strokes} stroke${strokes === 1 ? '' : 's'}`}
                  />
                ) : null}
                <span className="font-mono tabular-nums font-semibold">{gross}</span>
                <span className="text-[9px] text-fg-3 font-mono">
                  {net}
                </span>
              </div>
            )}
          </td>
        );
      })}
      <td className="px-2 py-1.5 text-center font-mono tabular-nums">
        <div className="leading-tight">
          <div className="font-semibold">{grossTot || '—'}</div>
          <div className="text-[9px] text-fg-3">{netTot || '—'}</div>
        </div>
      </td>
    </tr>
  );
}

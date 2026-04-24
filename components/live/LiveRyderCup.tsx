'use client';

import { useEffect, useMemo, useState } from 'react';
import { fmtPts } from '@/lib/utils';

interface SidePlayer {
  name: string;
  absent: boolean;
}

interface Side {
  label: string;
  color: string;
  players: SidePlayer[];
}

interface MatchRow {
  id: string;
  roundId: string;
  roundNumber: number;
  roundLabel: string;
  teeTime: string;
  matchNumber: number;
  sideA: Side;
  sideB: Side;
  status: string;
  thru: number;
  upBy: number;
  final: boolean;
  points: { a: number; b: number };
  projected: { a: number; b: number };
  hasAbsent?: boolean;
  override?: { pointsA: number; pointsB: number; label: string | null } | null;
}

interface Overview {
  teams: {
    1: { id: string; name: string; color: string } | null;
    2: { id: string; name: string; color: string } | null;
  };
  actual: { a: number; b: number };
  projected: { a: number; b: number };
  matches: MatchRow[];
}

function formatPlayers(players: SidePlayer[]): string {
  if (players.length === 0) return '—';
  return players.map((p) => (p.absent ? `👻 ${p.name}` : p.name)).join(' & ');
}

export default function LiveRyderCup() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const fetchData = async () => {
      try {
        const r = await fetch('/api/scoring/live-overview', { cache: 'no-store' });
        if (!r.ok) throw new Error('Failed to load');
        const json = (await r.json()) as Overview;
        if (!cancelled) {
          setData(json);
          setError(null);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Error');
          setLoading(false);
        }
      }
    };

    const start = () => {
      if (timer) return;
      void fetchData();
      timer = setInterval(() => {
        if (document.visibilityState === 'visible') void fetchData();
      }, 15000);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    const onVis = () => {
      if (document.visibilityState === 'visible') start();
      else stop();
    };

    start();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      stop();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const grouped = useMemo(() => {
    if (!data) return { previous: [], current: [] as MatchRow[], currentRoundLabel: '' };
    const byRound = new Map<string, { roundNumber: number; roundLabel: string; matches: MatchRow[] }>();
    for (const m of data.matches) {
      const g = byRound.get(m.roundId) ?? {
        roundNumber: m.roundNumber,
        roundLabel: m.roundLabel,
        matches: [],
      };
      g.matches.push(m);
      byRound.set(m.roundId, g);
    }
    const rounds = [...byRound.values()].sort((a, b) => a.roundNumber - b.roundNumber);

    // Previous sessions: all matches final, at least one match existed.
    const previous = rounds
      .filter((r) => r.matches.length > 0 && r.matches.every((m) => m.final))
      .map((r) => ({
        roundNumber: r.roundNumber,
        roundLabel: r.roundLabel,
        a: r.matches.reduce((s, m) => s + m.points.a, 0),
        b: r.matches.reduce((s, m) => s + m.points.b, 0),
      }));

    // Current session: the first round that is not fully final.
    const currentRound = rounds.find(
      (r) => r.matches.length > 0 && !r.matches.every((m) => m.final),
    );

    return {
      previous,
      current: currentRound?.matches ?? [],
      currentRoundLabel: currentRound
        ? `Round ${currentRound.roundNumber} · ${currentRound.roundLabel}`
        : '',
    };
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-masters border-t-transparent" />
      </div>
    );
  }
  if (error || !data) {
    return <p className="px-4 pt-6 text-sm text-danger">{error ?? 'No data'}</p>;
  }

  const teamA = data.teams[1];
  const teamB = data.teams[2];
  const colorA = teamA?.color ?? '#C41E3A';
  const colorB = teamB?.color ?? '#003DA5';

  return (
    <div className="px-4 pt-3 pb-4 space-y-3">
      {/* Hero: actual + projected side-by-side */}
      <section className="rounded-3xl px-4 py-3 bg-gradient-to-br from-masters/10 via-white to-masters/5 shadow-card">
        <div className="grid grid-cols-2 gap-3">
          <ScoreBlock
            label="Actual"
            a={data.actual.a}
            b={data.actual.b}
            colorA={colorA}
            colorB={colorB}
            teamAName={teamA?.name ?? 'A'}
            teamBName={teamB?.name ?? 'B'}
            emphasize
          />
          <ScoreBlock
            label="Projected"
            a={data.projected.a}
            b={data.projected.b}
            colorA={colorA}
            colorB={colorB}
            teamAName={teamA?.name ?? 'A'}
            teamBName={teamB?.name ?? 'B'}
          />
        </div>
      </section>

      {/* Previous sessions — condensed rollup */}
      {grouped.previous.length > 0 ? (
        <section>
          <h2 className="text-[10px] uppercase tracking-widest text-fg-3 mb-1.5 px-1">
            Previous sessions
          </h2>
          <div className="rounded-xl border border-ink-3 bg-white divide-y divide-ink-3/60">
            {grouped.previous.map((p) => (
              <div key={p.roundNumber} className="flex items-center justify-between px-3 py-2">
                <p className="text-xs text-fg-2 truncate">
                  <span className="font-semibold text-fg-1">R{p.roundNumber}</span> · {p.roundLabel}
                </p>
                <p className="font-mono text-xs tabular-nums text-fg-1 shrink-0">
                  <span style={{ color: colorA }}>{fmtPts(p.a)}</span>
                  <span className="text-fg-3"> – </span>
                  <span style={{ color: colorB }}>{fmtPts(p.b)}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Current session matches */}
      {grouped.current.length > 0 ? (
        <section>
          <h2 className="text-[10px] uppercase tracking-widest text-fg-3 mb-1.5 px-1">
            {grouped.currentRoundLabel}
          </h2>
          <div className="space-y-2">
            {grouped.current.map((m) => (
              <MatchupRow key={m.id} m={m} />
            ))}
          </div>
        </section>
      ) : null}

      {data.matches.length === 0 ? (
        <div className="bg-ink-2 border border-ink-3 rounded-2xl p-4 text-sm text-fg-3">
          No matches configured yet.
        </div>
      ) : null}
    </div>
  );
}

function ScoreBlock({
  label,
  a,
  b,
  colorA,
  colorB,
  teamAName,
  teamBName,
  emphasize = false,
}: {
  label: string;
  a: number;
  b: number;
  colorA: string;
  colorB: string;
  teamAName: string;
  teamBName: string;
  emphasize?: boolean;
}) {
  return (
    <div className="text-center">
      <p className="text-[9px] uppercase tracking-[0.2em] text-fg-3 mb-1">{label}</p>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
        <div>
          <p
            className={`${emphasize ? 'text-4xl' : 'text-3xl'} font-bold tabular-nums leading-none`}
            style={{ color: colorA }}
          >
            {fmtPts(a)}
          </p>
          <p className="text-[9px] uppercase tracking-wider text-fg-3 mt-1 truncate">{teamAName}</p>
        </div>
        <span className="text-fg-3 text-base font-light">–</span>
        <div>
          <p
            className={`${emphasize ? 'text-4xl' : 'text-3xl'} font-bold tabular-nums leading-none`}
            style={{ color: colorB }}
          >
            {fmtPts(b)}
          </p>
          <p className="text-[9px] uppercase tracking-wider text-fg-3 mt-1 truncate">{teamBName}</p>
        </div>
      </div>
    </div>
  );
}

function MatchupRow({ m }: { m: MatchRow }) {
  const isOverride = !!m.override;
  const leading = isOverride
    ? m.override!.pointsA > m.override!.pointsB
      ? 'A'
      : m.override!.pointsB > m.override!.pointsA
        ? 'B'
        : null
    : m.upBy > 0
      ? 'A'
      : m.upBy < 0
        ? 'B'
        : null;
  const leaderColor = leading === 'A' ? m.sideA.color : leading === 'B' ? m.sideB.color : '#E5E7EB';

  return (
    <div className="rounded-xl p-2.5 bg-white shadow-card border border-ink-3 flex items-stretch gap-2.5">
      <div className="w-1 rounded-full flex-shrink-0" style={{ backgroundColor: leaderColor }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-[10px] uppercase tracking-wider text-fg-3 truncate">
            M{m.matchNumber} · {m.teeTime}
          </p>
          <span
            className={`text-[10px] font-semibold rounded-full px-2 py-0.5 shrink-0 ${
              m.final ? 'bg-masters/10 text-masters' : 'bg-ink-2 text-fg-1'
            }`}
          >
            {m.status}
          </span>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2 items-center">
          <p className="text-xs text-fg-2 truncate" style={{ color: m.sideA.color }}>
            {formatPlayers(m.sideA.players)}
          </p>
          <span className="text-fg-3 text-[10px]">vs</span>
          <p className="text-xs text-fg-2 truncate text-right" style={{ color: m.sideB.color }}>
            {formatPlayers(m.sideB.players)}
          </p>
        </div>
      </div>
    </div>
  );
}

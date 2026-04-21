'use client';

import { useEffect, useState } from 'react';

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

function formatPlayers(players: SidePlayer[]): string {
  if (players.length === 0) return '—';
  return players.map((p) => (p.absent ? `👻 ${p.name}` : p.name)).join(' & ');
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

function fmtPts(n: number): string {
  if (n === 0) return '0';
  const whole = Math.floor(n);
  const frac = n - whole;
  if (frac === 0.5) return whole === 0 ? '½' : `${whole}½`;
  return String(n);
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

  const deltaA = data.projected.a - data.actual.a;
  const deltaB = data.projected.b - data.actual.b;

  return (
    <div className="px-4 pt-4 space-y-5">
      {/* Hero: actual score */}
      <section className="rounded-3xl p-6 bg-gradient-to-br from-masters/10 via-white to-masters/5 shadow-card">
        <p className="text-[10px] uppercase tracking-[0.25em] text-fg-3 text-center mb-3">Actual</p>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="text-center">
            <div className="h-1.5 w-12 rounded-full mx-auto mb-2" style={{ backgroundColor: teamA?.color ?? '#C41E3A' }} />
            <p className="text-xs uppercase tracking-wider font-semibold text-fg-2">{teamA?.name ?? 'Team A'}</p>
            <p className="mt-2 text-7xl font-bold tracking-tighter tabular-nums text-fg-1">
              {fmtPts(data.actual.a)}
            </p>
          </div>
          <span className="text-fg-3 text-2xl font-light">–</span>
          <div className="text-center">
            <div className="h-1.5 w-12 rounded-full mx-auto mb-2" style={{ backgroundColor: teamB?.color ?? '#003DA5' }} />
            <p className="text-xs uppercase tracking-wider font-semibold text-fg-2">{teamB?.name ?? 'Team B'}</p>
            <p className="mt-2 text-7xl font-bold tracking-tighter tabular-nums text-fg-1">
              {fmtPts(data.actual.b)}
            </p>
          </div>
        </div>
      </section>

      {/* Matchups */}
      <section>
        <h2 className="text-[10px] uppercase tracking-widest text-fg-3 mb-2 px-1">Matchups</h2>
        <div className="space-y-2">
          {data.matches.length === 0 ? (
            <div className="bg-ink-2 border border-ink-3 rounded-2xl p-4 text-sm text-fg-3">
              No matches configured yet.
            </div>
          ) : (
            data.matches.map((m) => <MatchupRow key={m.id} m={m} />)
          )}
        </div>
      </section>

      {/* Projected */}
      <section className="bg-white rounded-2xl p-4 shadow-elev border border-ink-3">
        <p className="text-[10px] uppercase tracking-widest text-fg-3 mb-3">Projected if called now</p>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <ProjectedSide name={teamA?.name ?? 'Team A'} color={teamA?.color ?? '#C41E3A'} score={data.projected.a} delta={deltaA} />
          <span className="text-fg-3 text-lg font-light">–</span>
          <ProjectedSide name={teamB?.name ?? 'Team B'} color={teamB?.color ?? '#003DA5'} score={data.projected.b} delta={deltaB} align="right" />
        </div>
      </section>
    </div>
  );
}

function ProjectedSide({ name, color, score, delta, align = 'left' }: { name: string; color: string; score: number; delta: number; align?: 'left' | 'right' }) {
  return (
    <div className={align === 'right' ? 'text-right' : ''}>
      <p className="text-[10px] uppercase tracking-wider text-fg-3">{name}</p>
      <p className="mt-1 text-4xl font-bold tracking-tighter tabular-nums text-fg-1">{fmtPts(score)}</p>
      {delta > 0 ? (
        <span
          className="inline-block mt-1 text-[10px] font-semibold bg-masters/10 text-masters px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${color}15`, color }}
        >
          +{fmtPts(delta)} in play
        </span>
      ) : null}
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
    <div
      className="rounded-2xl p-3 bg-white shadow-card border border-ink-3 flex items-stretch gap-3"
    >
      <div className="w-1 rounded-full flex-shrink-0" style={{ backgroundColor: leaderColor }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <p className="text-[10px] uppercase tracking-widest text-fg-3">
            R{m.roundNumber} · M{m.matchNumber} · {m.teeTime}
          </p>
          <div className="flex items-center gap-1">
            {isOverride ? (
              <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-warning/10 text-warning">
                ADMIN CALL
              </span>
            ) : null}
            <span
              className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${
                m.final ? 'bg-masters/10 text-masters' : 'bg-ink-2 text-fg-1'
              }`}
            >
              {m.status}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-semibold truncate" style={{ color: m.sideA.color }}>
              {m.sideA.label}
            </p>
            <p className="text-xs text-fg-2 truncate">{formatPlayers(m.sideA.players)}</p>
          </div>
          <span className="text-fg-3 text-[10px]">vs</span>
          <div className="min-w-0 text-right">
            <p className="text-[10px] uppercase tracking-wider font-semibold truncate" style={{ color: m.sideB.color }}>
              {m.sideB.label}
            </p>
            <p className="text-xs text-fg-2 truncate">{formatPlayers(m.sideB.players)}</p>
          </div>
        </div>
        {m.final ? (
          <p className="text-[10px] font-mono text-fg-2 text-center mt-1.5">
            {fmtPts(m.points.a)} – {fmtPts(m.points.b)}
          </p>
        ) : null}
      </div>
    </div>
  );
}

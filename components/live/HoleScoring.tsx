'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export interface HoleInfo {
  holeNumber: number;
  par: number;
  handicapIndex: number;
  yards?: number | null;
}

export interface PerPlayer {
  playerId: string;
  name: string;
  side: 'A' | 'B';
  handicap: number;
  playingHandicap: number;
  strokesByHole: Record<number, number>;
  absent?: boolean;
}

export interface GhostPerHole {
  hole: number;
  par: number;
  strokes: number;
  gross: number;
  net: number;
}

export interface GhostScorecard {
  playerId: string;
  playerName: string;
  side: 'A' | 'B';
  handicap: number;
  difficultyUsed: 'AUTO' | 'EASY' | 'STANDARD' | 'TOUGH';
  perHole: GhostPerHole[];
}

export interface PerHole {
  hole: number;
  grossA: number | null;
  grossB: number | null;
  netA: number | null;
  netB: number | null;
  strokesA: number;
  strokesB: number;
}

export interface MatchStateResp {
  match: {
    id: string;
    matchNumber: number;
    teamA: { id: string; name: string; color: string | null };
    teamB: { id: string; name: string; color: string | null };
    override?: {
      pointsA: number;
      pointsB: number;
      label: string | null;
      note: string | null;
      overriddenBy: { id: string; name: string } | null;
    } | null;
  };
  round: {
    id: string;
    roundNumber: number;
    dayOfWeek: string;
    course: string;
    course_name: string;
    teeTime: string;
    activeTeeBox: string | null;
  };
  format: {
    name: string;
    slug: string | null;
    scoringType: 'match' | 'stroke' | 'stableford';
    teamScoringMode: string;
    strokeEntryMode: 'per_player' | 'per_side';
  };
  allowance: number;
  holes: HoleInfo[];
  state: {
    perPlayer: PerPlayer[];
    teamStrokesByHole: Record<'A' | 'B', Record<number, number>>;
    perHole: PerHole[];
    matchStatus: { label: string; final: boolean };
    ghosts?: GhostScorecard[];
  };
}

interface ViewerInfo {
  playerId: string;
  side: 'A' | 'B' | null;
  isAdmin: boolean;
}

interface Props {
  matchId: string;
  data: MatchStateResp;
  reload: () => Promise<void>;
  currentHole: number;
  setHole: (h: number) => void;
  /** Switch to the Card view from outside this component. */
  onOpenCard: () => void;
  viewer: ViewerInfo;
}

export default function HoleScoring({ matchId, data, reload, currentHole, setHole, onOpenCard, viewer }: Props) {
  const hole = useMemo(() => data.holes.find((h) => h.holeNumber === currentHole) ?? null, [data, currentHole]);
  const perHole = useMemo(() => data.state.perHole.find((h) => h.hole === currentHole) ?? null, [data, currentHole]);
  const isPerSide = data.format.strokeEntryMode === 'per_side';
  const teamA = data.match.teamA;
  const teamB = data.match.teamB;
  const sideAPlayers = data.state.perPlayer.filter((p) => p.side === 'A');
  const sideBPlayers = data.state.perPlayer.filter((p) => p.side === 'B');
  const totalHoles = data.holes.length;
  const ghostByKey = useMemo(() => {
    const m = new Map<string, GhostPerHole>();
    for (const g of data.state.ghosts ?? []) {
      for (const h of g.perHole) m.set(`${g.playerId}:${h.hole}`, h);
    }
    return m;
  }, [data.state.ghosts]);

  const override = data.match.override ?? null;
  if (override) {
    return (
      <div className="px-4 pt-8">
        <div className="card-elevated text-center">
          <p className="text-[10px] uppercase tracking-widest text-fg-3 mb-2">Admin call</p>
          <p className="text-4xl font-bold tracking-tight text-masters-glow">
            {override.pointsA} – {override.pointsB}
          </p>
          {override.label ? (
            <p className="mt-2 text-sm font-semibold text-fg-1">{override.label}</p>
          ) : null}
          <p className="mt-4 text-xs text-fg-2">
            This match has been called
            {override.overriddenBy ? ` by ${override.overriddenBy.name}` : ''}. Live scoring is
            locked.
          </p>
          <a
            href={`/ryder-cup/match/${matchId}`}
            className="inline-block mt-4 text-xs font-semibold text-masters"
          >
            View override details →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 space-y-4">
      {/* Top toggle: Hole ⇄ Card */}
      <div className="bg-ink-2 rounded-full p-1 flex max-w-xs mx-auto">
        <button className="flex-1 py-1.5 rounded-full text-xs font-semibold bg-white shadow-card text-fg-1">
          Hole
        </button>
        <button
          onClick={onOpenCard}
          className="flex-1 py-1.5 rounded-full text-xs text-fg-2 tap-highlight-none"
        >
          Card
        </button>
      </div>

      {/* Status */}
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-[0.25em] text-fg-3">{data.format.name}</p>
        <p className="text-lg font-semibold mt-0.5">{data.state.matchStatus.label}</p>
      </div>

      {/* Hole header */}
      <div className="text-center">
        <p className="text-xs uppercase tracking-widest text-fg-3">Hole</p>
        <p className="text-[72px] leading-none font-bold tracking-tighter tabular-nums">
          {currentHole}
        </p>
        <p className="text-sm text-fg-2 mt-1">
          Par {hole?.par ?? '—'} · HCP {hole?.handicapIndex ?? '—'}
          {hole?.yards ? ` · ${hole.yards}y` : ''}
        </p>
      </div>

      {/* Entry — non-admin viewers can only edit their own team's side. */}
      {viewer.side === null && !viewer.isAdmin ? (
        <div className="card text-center text-sm text-fg-2">
          You're not playing in this match — scores are view-only.
        </div>
      ) : null}
      {viewer.isAdmin && viewer.side === null ? (
        <div className="pill border-gold/40 text-gold bg-gold/5 mx-auto block w-fit">
          Admin — entering for both teams
        </div>
      ) : null}

      {isPerSide ? (
        <div className="grid grid-cols-2 gap-3">
          <TeamStepper
            label={teamA.name}
            color={teamA.color ?? '#C41E3A'}
            strokes={data.state.teamStrokesByHole.A[currentHole] ?? 0}
            gross={perHole?.grossA ?? null}
            onSave={(strokes) => saveTeam(matchId, currentHole, 'A', strokes, reload)}
            readOnly={!viewer.isAdmin && viewer.side !== 'A'}
          />
          <TeamStepper
            label={teamB.name}
            color={teamB.color ?? '#003DA5'}
            strokes={data.state.teamStrokesByHole.B[currentHole] ?? 0}
            gross={perHole?.grossB ?? null}
            onSave={(strokes) => saveTeam(matchId, currentHole, 'B', strokes, reload)}
            readOnly={!viewer.isAdmin && viewer.side !== 'B'}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <SideBlock
            label={teamA.name}
            color={teamA.color ?? '#C41E3A'}
            players={sideAPlayers}
            ghostByKey={ghostByKey}
            hole={currentHole}
            matchId={matchId}
            reload={reload}
            readOnly={!viewer.isAdmin && viewer.side !== 'A'}
          />
          <SideBlock
            label={teamB.name}
            color={teamB.color ?? '#003DA5'}
            players={sideBPlayers}
            ghostByKey={ghostByKey}
            hole={currentHole}
            matchId={matchId}
            reload={reload}
            readOnly={!viewer.isAdmin && viewer.side !== 'B'}
          />
        </div>
      )}

      {/* Prev / Next */}
      <div className="flex items-center justify-between pt-2">
        <button
          aria-label="Previous hole"
          disabled={currentHole <= 1}
          onClick={() => setHole(currentHole - 1)}
          className="w-12 h-12 rounded-full bg-ink-2 flex items-center justify-center active:scale-95 disabled:opacity-40 transition tap-highlight-none"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <p className="text-xs text-fg-3 tabular-nums">
          {currentHole} / {totalHoles}
        </p>
        <button
          aria-label="Next hole"
          disabled={currentHole >= totalHoles}
          onClick={() => setHole(currentHole + 1)}
          className="w-12 h-12 rounded-full bg-ink-2 flex items-center justify-center active:scale-95 disabled:opacity-40 transition tap-highlight-none"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Hole pad */}
      <div>
        <h2 className="text-[10px] uppercase tracking-widest text-fg-3 mb-2">Jump to hole</h2>
        <div className="grid grid-cols-9 gap-1.5">
          {data.holes.map((h) => {
            const done =
              (data.state.perHole.find((x) => x.hole === h.holeNumber)?.netA ?? null) != null &&
              (data.state.perHole.find((x) => x.hole === h.holeNumber)?.netB ?? null) != null;
            return (
              <button
                key={h.holeNumber}
                onClick={() => setHole(h.holeNumber)}
                className={`aspect-square rounded-lg text-xs font-semibold border transition tap-highlight-none ${
                  h.holeNumber === currentHole
                    ? 'bg-masters text-white border-masters'
                    : done
                    ? 'bg-masters/10 border-masters/40 text-masters-glow'
                    : 'bg-ink-2 border-ink-3 text-fg-2'
                }`}
              >
                {h.holeNumber}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────── subcomponents ───────────

async function saveTeam(matchId: string, hole: number, side: 'A' | 'B', strokes: number | null, reload: () => Promise<void>) {
  if (strokes == null) {
    await fetch(`/api/scoring/match/${matchId}/hole/${hole}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ side, playerId: null }),
    });
  } else {
    await fetch(`/api/scoring/match/${matchId}/hole/${hole}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ side, playerId: null, strokes }),
    });
  }
  await reload();
}

function TeamStepper({
  label,
  color,
  strokes,
  gross,
  onSave,
  readOnly = false,
}: {
  label: string;
  color: string;
  strokes: number;
  gross: number | null;
  onSave: (strokes: number | null) => Promise<void>;
  readOnly?: boolean;
}) {
  const [val, setVal] = useState<number | null>(gross);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setVal(gross);
  }, [gross]);

  const commit = useCallback(async (next: number | null) => {
    setPending(true);
    try {
      await onSave(next);
    } finally {
      setPending(false);
    }
  }, [onSave]);

  const bump = (delta: number) => {
    if (readOnly) return;
    const base = val ?? 4;
    const next = Math.max(1, Math.min(15, base + delta));
    setVal(next);
    void commit(next);
  };

  return (
    <div className={`bg-ink-1 border border-ink-3 rounded-2xl p-3 shadow-card ${readOnly ? 'opacity-70' : ''}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="h-1 w-6 rounded-full" style={{ backgroundColor: color }} />
        <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color }}>
          {label}
        </p>
      </div>
      {readOnly ? (
        <div className="flex items-center justify-center py-3">
          <span className="text-4xl font-bold font-mono tabular-nums text-fg-1">
            {val ?? '—'}
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <button
            aria-label="Decrease"
            onClick={() => bump(-1)}
            disabled={pending}
            className="w-14 h-14 rounded-full bg-ink-2 active:scale-95 flex items-center justify-center text-2xl font-semibold text-fg-1 disabled:opacity-50 transition tap-highlight-none"
          >
            −
          </button>
          <span className="text-4xl font-bold font-mono tabular-nums text-fg-1">
            {val ?? '—'}
          </span>
          <button
            aria-label="Increase"
            onClick={() => bump(1)}
            disabled={pending}
            className="w-14 h-14 rounded-full bg-ink-2 active:scale-95 flex items-center justify-center text-2xl font-semibold text-fg-1 disabled:opacity-50 transition tap-highlight-none"
          >
            +
          </button>
        </div>
      )}
      {strokes > 0 ? (
        <div className="mt-2 flex justify-center">
          <span className="text-[10px] font-semibold bg-masters/10 text-masters px-2 py-0.5 rounded-full">
            +{strokes} stroke{strokes > 1 ? 's' : ''}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function SideBlock({
  label,
  color,
  players,
  ghostByKey,
  hole,
  matchId,
  reload,
  readOnly = false,
}: {
  label: string;
  color: string;
  players: PerPlayer[];
  ghostByKey: Map<string, GhostPerHole>;
  hole: number;
  matchId: string;
  reload: () => Promise<void>;
  readOnly?: boolean;
}) {
  return (
    <div className={`bg-ink-1 border border-ink-3 rounded-2xl p-3 shadow-card ${readOnly ? 'opacity-70' : ''}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="h-1 w-6 rounded-full" style={{ backgroundColor: color }} />
        <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color }}>
          {label}
        </p>
      </div>
      <div className="space-y-2">
        {players.map((p) => {
          if (p.absent) {
            const g = ghostByKey.get(`${p.playerId}:${hole}`);
            return (
              <div key={p.playerId} className="flex items-center gap-2 opacity-80">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    <span className="mr-1">👻</span>
                    {p.name}
                  </p>
                  <p className="text-[10px] text-fg-3 italic">
                    Ghost: {g ? `gross ${g.gross} · net ${g.net}` : '—'}
                  </p>
                </div>
                <span className="w-10 text-center text-2xl font-bold font-mono tabular-nums text-fg-3 italic">
                  {g?.gross ?? '—'}
                </span>
              </div>
            );
          }
          return (
            <PlayerStepper key={p.playerId} player={p} hole={hole} matchId={matchId} reload={reload} readOnly={readOnly} />
          );
        })}
      </div>
    </div>
  );
}

function PlayerStepper({
  player,
  hole,
  matchId,
  reload,
  readOnly = false,
}: {
  player: PerPlayer;
  hole: number;
  matchId: string;
  reload: () => Promise<void>;
  readOnly?: boolean;
}) {
  const [val, setVal] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const strokes = player.strokesByHole[hole] ?? 0;

  const commit = async (next: number | null) => {
    setPending(true);
    try {
      if (next == null) {
        await fetch(`/api/scoring/match/${matchId}/hole/${hole}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ side: player.side, playerId: player.playerId }),
        });
      } else {
        await fetch(`/api/scoring/match/${matchId}/hole/${hole}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ side: player.side, playerId: player.playerId, strokes: next }),
        });
      }
      await reload();
    } finally {
      setPending(false);
    }
  };

  const bump = (delta: number) => {
    if (readOnly) return;
    const base = val ?? 4;
    const next = Math.max(1, Math.min(15, base + delta));
    setVal(next);
    void commit(next);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{player.name}</p>
        {strokes > 0 ? (
          <span className="inline-block text-[10px] font-semibold bg-masters/10 text-masters px-1.5 py-0.5 rounded-full mt-0.5">
            +{strokes} stroke{strokes > 1 ? 's' : ''}
          </span>
        ) : (
          <p className="text-[10px] text-fg-3">PH {player.playingHandicap}</p>
        )}
      </div>
      {readOnly ? (
        <span className="w-10 text-center text-2xl font-bold font-mono tabular-nums">
          {val ?? '—'}
        </span>
      ) : (
        <>
          <button
            onClick={() => bump(-1)}
            disabled={pending}
            aria-label={`Decrease ${player.name}`}
            className="w-10 h-10 rounded-full bg-ink-2 active:scale-95 flex items-center justify-center text-xl font-semibold disabled:opacity-50 transition tap-highlight-none"
          >
            −
          </button>
          <span className="w-10 text-center text-2xl font-bold font-mono tabular-nums">
            {val ?? '—'}
          </span>
          <button
            onClick={() => bump(1)}
            disabled={pending}
            aria-label={`Increase ${player.name}`}
            className="w-10 h-10 rounded-full bg-ink-2 active:scale-95 flex items-center justify-center text-xl font-semibold disabled:opacity-50 transition tap-highlight-none"
          >
            +
          </button>
        </>
      )}
    </div>
  );
}

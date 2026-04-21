'use client';

import { useCallback, useEffect, useState } from 'react';
import AbsentPlayerToggle from './AbsentPlayerToggle';
import GhostDifficultySelector from './GhostDifficultySelector';
import AdminOverridePanel, { type OverrideState } from './AdminOverridePanel';
import type { AbsenceSource, GhostDifficulty } from '@/lib/scoring';

interface Ghost {
  playerId: string;
  playerName: string;
  handicap: number;
  difficultyUsed: GhostDifficulty;
  perHole: Array<{ hole: number; par: number; gross: number; net: number; strokes: number }>;
}

interface PlayerRow {
  id: string;       // MatchPlayer.id
  playerId: string;
  name: string;
  side: 'A' | 'B';
  absentOverride: boolean | null;
  resolvedAbsent: boolean;
  source: AbsenceSource;
}

interface Props {
  matchId: string;
  teamAName: string;
  teamBName: string;
}

interface Loaded {
  players: PlayerRow[];
  ghostDifficulty: GhostDifficulty;
  ghosts: Ghost[];
  override: OverrideState | null;
}

export default function MatchAdjustments({ matchId, teamAName, teamBName }: Props) {
  const [data, setData] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingPlayerId, setSavingPlayerId] = useState<string | null>(null);
  const [savingDifficulty, setSavingDifficulty] = useState(false);
  const [openGhostIds, setOpenGhostIds] = useState<Record<string, boolean>>({});

  const reload = useCallback(async () => {
    try {
      const res = await fetch(`/api/scoring/match/${matchId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const absenceByPlayer: Record<
        string,
        { absent: boolean; source: AbsenceSource; absentOverride: boolean | null }
      > = json.absenceByPlayer ?? {};

      const players: PlayerRow[] = (json.state?.perPlayer ?? []).map(
        (p: { playerId: string; name: string; side: 'A' | 'B' }) => {
          const info = absenceByPlayer[p.playerId];
          return {
            id: p.playerId,
            playerId: p.playerId,
            name: p.name,
            side: p.side,
            absentOverride: info?.absentOverride ?? null,
            resolvedAbsent: info?.absent ?? false,
            source: info?.source ?? 'DEFAULT',
          };
        },
      );

      setData({
        players,
        ghostDifficulty: (json.match?.ghostDifficulty ?? 'AUTO') as GhostDifficulty,
        ghosts: json.state?.ghosts ?? [],
        override: json.match?.override ?? null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load match');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const saveAbsent = async (playerId: string, value: boolean | null) => {
    setSavingPlayerId(playerId);
    try {
      const res = await fetch(`/api/admin/matches/${matchId}/absent`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, absentOverride: value }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSavingPlayerId(null);
    }
  };

  const saveDifficulty = async (value: GhostDifficulty) => {
    setSavingDifficulty(true);
    try {
      const res = await fetch(`/api/admin/matches/${matchId}/ghost-difficulty`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty: value }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSavingDifficulty(false);
    }
  };

  if (loading) {
    return <div className="card"><div className="h-20 skeleton" /></div>;
  }
  if (error || !data) {
    return (
      <div className="card">
        <p className="text-sm text-danger">{error || 'Failed to load match.'}</p>
      </div>
    );
  }

  const anyAbsent = data.players.some((p) => p.resolvedAbsent);

  return (
    <div className="space-y-4">
      {/* 1. Absent players */}
      <section className="card space-y-2">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-fg-1">Absent players</h3>
        </div>
        <p className="text-[11px] text-fg-3">
          Auto inherits from each player's availability for this round.
          Force Absent/Present overrides the inferred state.
        </p>
        <div className="divide-y divide-ink-3">
          {data.players.map((p) => (
            <AbsentPlayerToggle
              key={p.playerId}
              name={`${p.name}  ·  Side ${p.side}`}
              absentOverride={p.absentOverride}
              resolvedAbsent={p.resolvedAbsent}
              source={p.source}
              disabled={savingPlayerId === p.playerId}
              onChange={(next) => saveAbsent(p.playerId, next)}
            />
          ))}
        </div>
        {data.ghosts.length > 0 ? (
          <div className="mt-3 space-y-2 pt-3 border-t border-ink-3">
            {data.ghosts.map((g) => {
              const open = openGhostIds[g.playerId] === true;
              const bogey = g.difficultyUsed === 'STANDARD'
                ? 'net bogey'
                : g.difficultyUsed === 'EASY'
                ? 'net par'
                : g.difficultyUsed === 'TOUGH'
                ? 'net double bogey'
                : 'handicap-scaled';
              return (
                <div key={g.playerId} className="rounded-xl border border-ink-3 bg-ink-2 p-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-fg-1">
                        <span className="mr-1">👻</span>
                        Ghost: {g.playerName}
                      </p>
                      <p className="text-xs text-fg-3">
                        HCP {g.handicap} · playing as {bogey}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-xs font-semibold text-masters"
                      onClick={() =>
                        setOpenGhostIds((prev) => ({
                          ...prev,
                          [g.playerId]: !open,
                        }))
                      }
                    >
                      {open ? 'Hide' : 'Show'} scorecard
                    </button>
                  </div>
                  {open ? (
                    <div className="mt-2 grid grid-cols-9 gap-1 text-[10px] font-mono">
                      {g.perHole.map((h) => (
                        <div
                          key={h.hole}
                          className="rounded bg-white border border-ink-3 p-1 text-center"
                        >
                          <div className="text-fg-3">{h.hole}</div>
                          <div className="text-fg-1 font-semibold">{h.gross}</div>
                          <div className="text-fg-3">{h.net}n</div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}
      </section>

      {/* 2. Ghost difficulty (only if any absent) */}
      {anyAbsent ? (
        <section className="card">
          <h3 className="text-sm font-semibold text-fg-1 mb-3">Ghost difficulty</h3>
          <GhostDifficultySelector
            value={data.ghostDifficulty}
            disabled={savingDifficulty}
            onChange={saveDifficulty}
          />
        </section>
      ) : null}

      {/* 3. Admin override — always visible */}
      <section className="card">
        <h3 className="text-sm font-semibold text-fg-1 mb-3">Admin override</h3>
        <AdminOverridePanel
          matchId={matchId}
          teamAName={teamAName}
          teamBName={teamBName}
          initial={
            data.override ?? {
              pointsA: null,
              pointsB: null,
              label: null,
              note: null,
              overriddenBy: null,
              overriddenAt: null,
            }
          }
          onSaved={() => { reload(); }}
        />
      </section>
    </div>
  );
}

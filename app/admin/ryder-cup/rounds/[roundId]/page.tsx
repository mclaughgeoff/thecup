'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/BottomTabBar';
import PlayerAvatar from '@/components/PlayerAvatar';

interface PlayerLite {
  id: string;
  name: string;
  handicap: number;
  photoUrl: string | null;
}

interface RcTeam {
  id: string;
  name: string;
  teamNumber: number;
  color: string | null;
  members: Array<{ playerId: string; player: PlayerLite }>;
}

interface Match {
  id: string;
  matchNumber: number;
  teeSlotIndex: number | null;
  teamAId: string;
  teamBId: string;
  result: string | null;
  pointsA: number | null;
  pointsB: number | null;
  players: Array<{ id: string; playerId: string; side: 'A' | 'B'; player: PlayerLite }>;
}

interface RoundInfo {
  id: string;
  roundNumber: number;
  dayOfWeek: string;
  course: string;
  teeTime: string;
  teeSlots: string[];
  format: string;
  formatRef?: { teamSize: number; strokeEntryMode: string } | null;
}

// A "cell" = the editor for one match slot (one match in the round).
// For teamSize 2 formats, cellsPerTeeSlot = 1.
// For teamSize 1 (singles), cellsPerTeeSlot = 2 — two 1v1 matches share the same tee time.
interface CellDraft {
  matchNumber: number;     // 1..N, unique in round
  teeSlotIndex: number;    // which tee time this belongs to
  existingId: string | null;
  sideA: string[];
  sideB: string[];
  result: string;
  pointsA: string;
  pointsB: string;
}

const emptyCell = (matchNumber: number, teeSlotIndex: number): CellDraft => ({
  matchNumber,
  teeSlotIndex,
  existingId: null,
  sideA: [],
  sideB: [],
  result: '',
  pointsA: '',
  pointsB: '',
});

export default function AdminRoundMatchesPage() {
  const params = useParams<{ roundId: string }>();
  const roundId = params.roundId;
  const router = useRouter();

  const [me, setMe] = useState<{ id: string; isAdmin: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [round, setRound] = useState<RoundInfo | null>(null);
  const [teams, setTeams] = useState<RcTeam[]>([]);
  // existing matches are carried in each cell's `existingId`; no need for a separate matches list
  const [cells, setCells] = useState<CellDraft[]>([]);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const load = async () => {
    const [rRes, tRes] = await Promise.all([
      fetch('/api/admin/rounds'),
      fetch('/api/admin/rc-teams'),
    ]);
    const { rounds } = await rRes.json();
    const r = rounds.find((x: RoundInfo) => x.id === roundId);
    if (!r) return;
    setRound(r);

    const ts = (await tRes.json()) as RcTeam[];
    setTeams(ts);

    const mRes = await fetch(`/api/admin/matches?roundId=${roundId}`);
    if (!mRes.ok) return;
    const ms = (await mRes.json()) as Match[];

    // Build cells: one per tee slot × (cellsPerSlot). teamSize 1 → 2 cells per slot.
    const teamSize = r.formatRef?.teamSize ?? 2;
    const cellsPerSlot = teamSize === 1 ? 2 : 1;
    const slotCount = r.teeSlots?.length ?? 0;

    const next: CellDraft[] = [];
    for (let slot = 0; slot < slotCount; slot++) {
      for (let c = 0; c < cellsPerSlot; c++) {
        const matchNumber = slot * cellsPerSlot + c + 1;
        // Prefer a match matching (teeSlotIndex, position) — use matchNumber sort within the slot.
        const existing =
          ms.find((m) => m.teeSlotIndex === slot && m.matchNumber === matchNumber) ??
          // fallback: any match with matching teeSlotIndex, picked in order
          ms.filter((m) => m.teeSlotIndex === slot).sort((a, b) => a.matchNumber - b.matchNumber)[c];
        next.push(
          existing
            ? {
                matchNumber,
                teeSlotIndex: slot,
                existingId: existing.id,
                sideA: existing.players.filter((p) => p.side === 'A').map((p) => p.playerId),
                sideB: existing.players.filter((p) => p.side === 'B').map((p) => p.playerId),
                result: existing.result ?? '',
                pointsA: existing.pointsA !== null ? String(existing.pointsA) : '',
                pointsB: existing.pointsB !== null ? String(existing.pointsB) : '',
              }
            : emptyCell(matchNumber, slot),
        );
      }
    }
    setCells(next);
  };

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/auth/me');
        if (!r.ok) throw new Error();
        const p = await r.json();
        if (!p.isAdmin) throw new Error();
        setMe(p);
        await load();
      } catch {
        router.push('/auth/request-link');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, roundId]);

  const teamA = teams.find((t) => t.teamNumber === 1);
  const teamB = teams.find((t) => t.teamNumber === 2);

  // Map of playerId → matchNumber where they're drafted in this round (for greying out).
  const playerUsage = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of cells) {
      for (const pid of [...c.sideA, ...c.sideB]) {
        if (!map.has(pid)) map.set(pid, c.matchNumber);
      }
    }
    return map;
  }, [cells]);

  const setCellField = (idx: number, patch: Partial<CellDraft>) =>
    setCells((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));

  const togglePlayer = (idx: number, side: 'A' | 'B', pid: string) => {
    setCells((prev) => {
      const cell = prev[idx];
      const key = side === 'A' ? 'sideA' : 'sideB';
      if (cell[key].includes(pid)) {
        return prev.map((c, i) =>
          i === idx ? { ...c, [key]: c[key].filter((x) => x !== pid) } : c,
        );
      }
      // If used elsewhere in this round, refuse.
      const usedIn = playerUsage.get(pid);
      if (usedIn && usedIn !== cell.matchNumber) return prev;
      return prev.map((c, i) => (i === idx ? { ...c, [key]: [...c[key], pid] } : c));
    });
  };

  const buildBody = (c: CellDraft) => ({
    matchNumber: c.matchNumber,
    teeSlotIndex: c.teeSlotIndex,
    players: [
      ...c.sideA.map((playerId) => ({ playerId, side: 'A' as const })),
      ...c.sideB.map((playerId) => ({ playerId, side: 'B' as const })),
    ],
    result: c.result || null,
    pointsA: c.pointsA === '' ? null : parseFloat(c.pointsA),
    pointsB: c.pointsB === '' ? null : parseFloat(c.pointsB),
  });

  const saveCell = async (idx: number) => {
    if (!teamA || !teamB) return;
    const c = cells[idx];
    const key = `${c.matchNumber}`;
    setSavingKey(key);
    setMessage(null);
    try {
      const res = c.existingId
        ? await fetch(`/api/admin/matches/${c.existingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildBody(c)),
          })
        : await fetch('/api/admin/matches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roundId,
              teamAId: teamA.id,
              teamBId: teamB.id,
              ...buildBody(c),
            }),
          });
      if (!res.ok) throw new Error('Save failed');
      await load();
      setMessage({ type: 'success', text: `Match ${c.matchNumber} saved.` });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error' });
    } finally {
      setSavingKey(null);
    }
  };

  const clearCell = async (idx: number) => {
    const c = cells[idx];
    if (!c.existingId) {
      setCellField(idx, { sideA: [], sideB: [], result: '', pointsA: '', pointsB: '' });
      return;
    }
    if (!confirm(`Delete match ${c.matchNumber}?`)) return;
    setSavingKey(String(c.matchNumber));
    try {
      const res = await fetch(`/api/admin/matches/${c.existingId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await load();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error' });
    } finally {
      setSavingKey(null);
    }
  };

  if (loading || !round) {
    return (
      <>
        <AppHeader title="Matches" backHref="/admin/ryder-cup" />
        <main className="min-h-[50vh] flex items-center justify-center bg-ink-0">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-masters border-t-transparent" />
        </main>
        <BottomTabBar />
      </>
    );
  }

  const teamSize = round.formatRef?.teamSize ?? 2;
  const cellsPerSlot = teamSize === 1 ? 2 : 1;
  const slotCount = round.teeSlots?.length ?? 0;

  const renderSide = (idx: number, team: RcTeam | undefined, side: 'A' | 'B') => {
    const cell = cells[idx];
    if (!cell) return null;
    const mine = side === 'A' ? cell.sideA : cell.sideB;
    // How many players max per side in this cell
    const sideCap = teamSize; // 1 for singles, 2 for 2-man formats

    return (
      <div>
        <p
          className="text-[10px] uppercase tracking-wider font-semibold mb-2"
          style={team?.color ? { color: team.color } : undefined}
        >
          {team?.name ?? (side === 'A' ? 'Team A' : 'Team B')}
          <span className="text-fg-3 font-normal ml-1">
            {mine.length}/{sideCap}
          </span>
        </p>
        <div className="space-y-1 max-h-56 overflow-y-auto scrollbar-none">
          {team?.members.length === 0 ? (
            <p className="text-xs text-fg-3 italic">Roster empty</p>
          ) : null}
          {team?.members.map((m) => {
            const selected = mine.includes(m.playerId);
            const usedIn = playerUsage.get(m.playerId);
            const lockedElsewhere = !!usedIn && usedIn !== cell.matchNumber;
            const wouldExceedCap = !selected && mine.length >= sideCap;
            const disabled = (!selected && lockedElsewhere) || wouldExceedCap;
            return (
              <button
                key={m.playerId}
                type="button"
                disabled={disabled}
                onClick={() => togglePlayer(idx, side, m.playerId)}
                className={`w-full text-left text-sm px-2.5 py-1.5 rounded-lg border transition flex items-center gap-2 ${
                  selected
                    ? 'border-masters bg-masters/15 text-fg-1'
                    : disabled
                    ? 'border-ink-3 bg-ink-2/50 text-fg-3 opacity-50 cursor-not-allowed'
                    : 'border-ink-3 bg-ink-2 text-fg-2 hover:border-fg-3'
                }`}
                title={lockedElsewhere ? `Already assigned to match ${usedIn}` : wouldExceedCap ? `Side is full (${sideCap})` : undefined}
              >
                <PlayerAvatar name={m.player.name} photoUrl={m.player.photoUrl} size="sm" />
                <span className="flex-1 truncate">{m.player.name}</span>
                <span className="text-[10px] text-fg-3 tabular-nums">{m.player.handicap}</span>
                {lockedElsewhere ? (
                  <span className="text-[9px] text-fg-3 uppercase">M{usedIn}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <AppHeader title={`Round ${round.roundNumber} matches`} backHref="/admin/ryder-cup" />
      <main className="bg-ink-0 pb-nav">
        <p className="px-4 pt-4 text-xs text-fg-3">
          {round.dayOfWeek} · {round.course} · {round.format} · {round.teeTime}
          {cellsPerSlot === 2 ? (
            <span className="text-masters-glow"> · 2 matches per tee time</span>
          ) : null}
        </p>

        {slotCount === 0 ? (
          <div className="mx-4 mt-4 p-3 rounded-xl border border-danger/30 bg-danger/10 text-sm text-danger">
            No tee slots configured for this round. Add individual tee times in{' '}
            <a href="/admin/rounds" className="underline">Round setup</a> first.
          </div>
        ) : null}

        <section className="px-4 pt-4 space-y-5">
          {Array.from({ length: slotCount }).map((_, slot) => {
            const teeTime = round.teeSlots[slot];
            const slotCells = cells
              .map((c, i) => ({ c, i }))
              .filter(({ c }) => c.teeSlotIndex === slot);
            return (
              <div key={slot} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[10px] uppercase tracking-widest text-fg-3">
                    Tee time {slot + 1}
                  </p>
                  <p className="text-sm font-mono">{teeTime}</p>
                </div>
                {slotCells.map(({ c, i }) => (
                  <div key={c.matchNumber} className="card">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] uppercase tracking-widest text-fg-3">
                        Match {c.matchNumber}
                      </p>
                      {c.existingId ? (
                        <span className="pill border-ink-3">Saved</span>
                      ) : (
                        <span className="pill border-ink-3 text-fg-3">Empty</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {renderSide(i, teamA, 'A')}
                      {renderSide(i, teamB, 'B')}
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-4">
                      <div className="col-span-3 sm:col-span-1">
                        <label className="label">Result</label>
                        <input
                          type="text"
                          placeholder="2&1, AS, 3UP"
                          value={c.result}
                          onChange={(e) => setCellField(i, { result: e.target.value })}
                          className="input py-2"
                        />
                      </div>
                      <div>
                        <label className="label">Pts A</label>
                        <input
                          type="number"
                          step="0.5"
                          value={c.pointsA}
                          onChange={(e) => setCellField(i, { pointsA: e.target.value })}
                          className="input py-2"
                        />
                      </div>
                      <div>
                        <label className="label">Pts B</label>
                        <input
                          type="number"
                          step="0.5"
                          value={c.pointsB}
                          onChange={(e) => setCellField(i, { pointsB: e.target.value })}
                          className="input py-2"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <button
                        onClick={() => clearCell(i)}
                        disabled={savingKey === String(c.matchNumber)}
                        className="btn-ghost text-xs py-2"
                      >
                        {c.existingId ? 'Delete' : 'Clear'}
                      </button>
                      <button
                        onClick={() => saveCell(i)}
                        disabled={savingKey === String(c.matchNumber) || !teamA || !teamB}
                        className="btn-primary text-xs py-2"
                      >
                        {savingKey === String(c.matchNumber)
                          ? 'Saving…'
                          : c.existingId
                          ? 'Save'
                          : 'Create'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </section>

        {message ? (
          <div className="px-4 pt-3">
            <div
              className={`p-3 rounded-xl text-sm border ${
                message.type === 'success'
                  ? 'bg-success/10 border-success/30 text-success'
                  : 'bg-danger/10 border-danger/30 text-danger'
              }`}
            >
              {message.text}
            </div>
          </div>
        ) : null}
      </main>
      <BottomTabBar isAdmin={me?.isAdmin} />
    </>
  );
}

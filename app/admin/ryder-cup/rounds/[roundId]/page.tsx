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
  formatOverrideId: string | null;
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
  isRyderCup: boolean;
  formatId: string | null;
  formatRef?: { teamSize: number; strokeEntryMode: string } | null;
}

interface FormatLite {
  id: string;
  name: string;
  slug: string;
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
  /** Admin format override for this match. Empty string = inherit round format. */
  formatOverrideId: string;
  // Results + points are surfaced read-only here. Edits happen on the
  // Match adjustments page (admin/matches/[id]), which also handles the
  // override / ghost / absent-player logic. Keeping the display-only
  // values in state avoids another fetch for the saved-badge summary.
  result: string | null;
  pointsA: number | null;
  pointsB: number | null;
}

const emptyCell = (matchNumber: number, teeSlotIndex: number): CellDraft => ({
  matchNumber,
  teeSlotIndex,
  existingId: null,
  sideA: [],
  sideB: [],
  formatOverrideId: '',
  result: null,
  pointsA: null,
  pointsB: null,
});

export default function AdminRoundMatchesPage() {
  const params = useParams<{ roundId: string }>();
  const roundId = params.roundId;
  const router = useRouter();

  const [me, setMe] = useState<{ id: string; isAdmin: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [round, setRound] = useState<RoundInfo | null>(null);
  const [teams, setTeams] = useState<RcTeam[]>([]);
  const [formats, setFormats] = useState<FormatLite[]>([]);
  // existing matches are carried in each cell's `existingId`; no need for a separate matches list
  const [cells, setCells] = useState<CellDraft[]>([]);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [allPlayers, setAllPlayers] = useState<PlayerLite[]>([]);
  /** Map of playerId → available(true/false) for THIS round. Missing = available. */
  const [unavailable, setUnavailable] = useState<Set<string>>(new Set());

  const load = async () => {
    const [rRes, tRes, aRes] = await Promise.all([
      fetch('/api/admin/rounds'),
      fetch('/api/admin/rc-teams'),
      fetch('/api/admin/availability'),
    ]);
    const { rounds, formats: fs } = (await rRes.json()) as {
      rounds: RoundInfo[];
      formats?: FormatLite[];
    };
    const r = rounds.find((x: RoundInfo) => x.id === roundId);
    if (!r) return;
    setRound(r);
    setFormats(fs ?? []);

    const ts = (await tRes.json()) as RcTeam[];
    setTeams(ts);

    // Availability + full player list (used for the casual-round flat picker).
    // availability is keyed "<playerId>:<roundId>" → available (bool).
    if (aRes.ok) {
      const { players: ps, availability } = (await aRes.json()) as {
        players: PlayerLite[];
        availability: Record<string, boolean>;
      };
      setAllPlayers(ps);
      const out = new Set<string>();
      for (const [key, available] of Object.entries(availability)) {
        if (!key.endsWith(`:${roundId}`)) continue;
        if (available === false) out.add(key.split(':')[0]);
      }
      setUnavailable(out);
    }

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
                formatOverrideId: existing.formatOverrideId ?? '',
                result: existing.result,
                pointsA: existing.pointsA,
                pointsB: existing.pointsB,
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

  // Roster-only save. Result + points are managed on the per-match
  // Adjust page; we omit them here so they're left untouched by the PUT.
  const buildBody = (c: CellDraft) => ({
    matchNumber: c.matchNumber,
    teeSlotIndex: c.teeSlotIndex,
    formatOverrideId: c.formatOverrideId || null,
    players: [
      ...c.sideA.map((playerId) => ({ playerId, side: 'A' as const })),
      ...c.sideB.map((playerId) => ({ playerId, side: 'B' as const })),
    ],
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

  const clearAll = async () => {
    const existing = cells.filter((c) => c.existingId);
    if (existing.length === 0) {
      // Nothing saved — just blank the drafts.
      setCells((prev) => prev.map((c) => ({ ...c, sideA: [], sideB: [], result: null, pointsA: null, pointsB: null })));
      return;
    }
    if (!confirm(`Delete all ${existing.length} saved matches in this round?`)) return;
    setSavingKey('__all__');
    setMessage(null);
    try {
      const results = await Promise.all(
        existing.map((c) =>
          fetch(`/api/admin/matches/${c.existingId}`, { method: 'DELETE' }).then((r) => r.ok),
        ),
      );
      const failed = results.filter((ok) => !ok).length;
      await load();
      if (failed > 0) {
        setMessage({ type: 'error', text: `${failed} of ${existing.length} deletes failed.` });
      } else {
        setMessage({ type: 'success', text: `Cleared ${existing.length} matches.` });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error' });
    } finally {
      setSavingKey(null);
    }
  };

  const clearCell = async (idx: number) => {
    const c = cells[idx];
    if (!c.existingId) {
      setCellField(idx, { sideA: [], sideB: [], result: null, pointsA: null, pointsB: null });
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
        <AppHeader title="Loading…" backHref="/admin/rounds" />
        <main className="min-h-[50vh] flex items-center justify-center bg-ink-0">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-masters border-t-transparent" />
        </main>
        <BottomTabBar />
      </>
    );
  }

  const isCasual = !round.isRyderCup;
  const unitLabel = isCasual ? 'Group' : 'Match';
  const backHref = isCasual ? '/admin/rounds' : '/admin/ryder-cup';

  const teamSize = round.formatRef?.teamSize ?? 2;
  const cellsPerSlot = teamSize === 1 ? 2 : 1;
  const slotCount = round.teeSlots?.length ?? 0;

  /**
   * Casual-round picker: a single flat list of all players with a 4-slot cap.
   * Selections are stored on side A so we satisfy the DB's teamA/teamB constraint
   * without pretending this is a team match. Unavailable players are disabled.
   */
  const renderCasualGroup = (idx: number) => {
    const cell = cells[idx];
    if (!cell) return null;
    const picked = cell.sideA;
    const cap = 4;

    return (
      <div>
        <p className="text-[10px] uppercase tracking-wider font-semibold text-fg-2 mb-2">
          Group
          <span className="text-fg-3 font-normal ml-1">
            {picked.length}/{cap}
          </span>
        </p>
        <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto scrollbar-none">
          {allPlayers.map((p) => {
            const selected = picked.includes(p.id);
            const usedIn = playerUsage.get(p.id);
            const lockedElsewhere = !!usedIn && usedIn !== cell.matchNumber;
            const isUnavailable = unavailable.has(p.id);
            const wouldExceedCap = !selected && picked.length >= cap;
            const disabled =
              (!selected && (lockedElsewhere || wouldExceedCap)) || isUnavailable;
            return (
              <button
                key={p.id}
                type="button"
                disabled={disabled}
                onClick={() => togglePlayer(idx, 'A', p.id)}
                className={`text-left text-sm px-2.5 py-1.5 rounded-lg border transition flex items-center gap-2 ${
                  selected
                    ? 'border-masters bg-masters/15 text-fg-1'
                    : disabled
                    ? 'border-ink-3 bg-ink-2/50 text-fg-3 opacity-50 cursor-not-allowed'
                    : 'border-ink-3 bg-ink-2 text-fg-2 hover:border-fg-3'
                }`}
                title={
                  isUnavailable
                    ? 'Marked unavailable for this round'
                    : lockedElsewhere
                    ? `Already assigned to match ${usedIn}`
                    : wouldExceedCap
                    ? `Group is full (${cap})`
                    : undefined
                }
              >
                <PlayerAvatar name={p.name} photoUrl={p.photoUrl} size="sm" />
                <span className="flex-1 truncate">{p.name}</span>
                {isUnavailable ? (
                  <span className="text-[10px] text-fg-3">out</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

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
      <AppHeader
        title={`Round ${round.roundNumber} ${isCasual ? 'groups' : 'matches'}`}
        backHref={backHref}
      />
      <main className="bg-ink-0 pb-nav">
        <div className="px-4 pt-4 flex items-start justify-between gap-3">
          <p className="text-xs text-fg-3">
            {round.dayOfWeek} · {round.course}
            {isCasual ? '' : ` · ${round.format}`} · {round.teeTime}
            {cellsPerSlot === 2 ? (
              <span className="text-masters-glow"> · 2 matches per tee time</span>
            ) : null}
          </p>
          {cells.some((c) => c.existingId) ? (
            <button
              onClick={clearAll}
              disabled={savingKey === '__all__'}
              className="btn-danger text-[11px] py-1.5 px-3 whitespace-nowrap"
            >
              {savingKey === '__all__' ? 'Clearing…' : 'Clear all'}
            </button>
          ) : null}
        </div>

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
                        {unitLabel} {c.matchNumber}
                      </p>
                      <div className="flex items-center gap-2">
                        {c.existingId && !isCasual ? (
                          <a
                            href={`/admin/matches/${c.existingId}`}
                            className="text-[11px] font-semibold text-masters"
                          >
                            Adjust →
                          </a>
                        ) : null}
                        {c.existingId ? (
                          <span className="pill border-ink-3">Saved</span>
                        ) : (
                          <span className="pill border-ink-3 text-fg-3">Empty</span>
                        )}
                      </div>
                    </div>

                    {!isCasual ? (
                      <div className="mb-3">
                        <label className="label">
                          Format
                          <span className="text-[10px] text-fg-3 font-normal ml-2 normal-case tracking-normal">
                            override · inherits round default
                          </span>
                        </label>
                        <select
                          value={c.formatOverrideId}
                          onChange={(e) => setCellField(i, { formatOverrideId: e.target.value })}
                          className="input"
                        >
                          <option value="">Inherit · {round.format}</option>
                          {formats.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}

                    {isCasual ? (
                      renderCasualGroup(i)
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {renderSide(i, teamA, 'A')}
                        {renderSide(i, teamB, 'B')}
                      </div>
                    )}

                    {!isCasual && c.existingId ? (
                      <div className="mt-4 flex items-center justify-between gap-3 p-3 rounded-xl bg-ink-2 border border-ink-3">
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-wider text-fg-3">
                            Current result
                          </p>
                          <p className="text-sm font-mono text-fg-1 truncate">
                            {c.result || '—'}
                            {c.pointsA != null && c.pointsB != null ? (
                              <span className="ml-2 text-fg-2">
                                {c.pointsA} – {c.pointsB}
                              </span>
                            ) : null}
                          </p>
                        </div>
                        <a
                          href={`/admin/matches/${c.existingId}`}
                          className="btn-ghost text-xs py-2 whitespace-nowrap"
                        >
                          Adjust →
                        </a>
                      </div>
                    ) : !isCasual ? (
                      <p className="mt-4 text-[11px] text-fg-3">
                        Save the roster first, then use <em>Adjust</em> to set results, overrides, or absent players.
                      </p>
                    ) : null}

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

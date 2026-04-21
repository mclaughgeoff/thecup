'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/BottomTabBar';

interface PlayerLite { id: string; name: string }

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
  format: string;
}

interface Draft {
  matchNumber: string;
  sideA: string[]; // playerIds
  sideB: string[];
  result: string;
  pointsA: string;
  pointsB: string;
}

export default function AdminRoundMatchesPage() {
  const params = useParams<{ roundId: string }>();
  const roundId = params.roundId;
  const router = useRouter();

  const [me, setMe] = useState<{ id: string; isAdmin: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [round, setRound] = useState<RoundInfo | null>(null);
  const [teams, setTeams] = useState<RcTeam[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newDraft, setNewDraft] = useState<Draft>({
    matchNumber: '1',
    sideA: [],
    sideB: [],
    result: '',
    pointsA: '',
    pointsB: '',
  });
  const [creating, setCreating] = useState(false);
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
    if (mRes.ok) {
      const ms = (await mRes.json()) as Match[];
      setMatches(ms);
      setDrafts(
        Object.fromEntries(
          ms.map((m) => [
            m.id,
            {
              matchNumber: String(m.matchNumber),
              sideA: m.players.filter((p) => p.side === 'A').map((p) => p.playerId),
              sideB: m.players.filter((p) => p.side === 'B').map((p) => p.playerId),
              result: m.result ?? '',
              pointsA: m.pointsA !== null ? String(m.pointsA) : '',
              pointsB: m.pointsB !== null ? String(m.pointsB) : '',
            } as Draft,
          ]),
        ),
      );
      setNewDraft((d) => ({ ...d, matchNumber: String(ms.length + 1) }));
    }
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

  const togglePlayer = (side: 'A' | 'B', pid: string, draft: Draft) => {
    const key = side === 'A' ? 'sideA' : 'sideB';
    const current = draft[key];
    return {
      ...draft,
      [key]: current.includes(pid) ? current.filter((x) => x !== pid) : [...current, pid],
    } as Draft;
  };

  const buildBody = (d: Draft) => ({
    matchNumber: parseInt(d.matchNumber, 10),
    players: [
      ...d.sideA.map((playerId) => ({ playerId, side: 'A' as const })),
      ...d.sideB.map((playerId) => ({ playerId, side: 'B' as const })),
    ],
    result: d.result || null,
    pointsA: d.pointsA === '' ? null : parseFloat(d.pointsA),
    pointsB: d.pointsB === '' ? null : parseFloat(d.pointsB),
  });

  const saveMatch = async (id: string) => {
    const d = drafts[id];
    if (!d) return;
    setSavingId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/matches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody(d)),
      });
      if (!res.ok) throw new Error('Save failed');
      await load();
      setMessage({ type: 'success', text: 'Match saved.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error' });
    } finally {
      setSavingId(null);
    }
  };

  const deleteMatch = async (id: string) => {
    if (!confirm('Delete this match?')) return;
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/matches/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await load();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error' });
    } finally {
      setSavingId(null);
    }
  };

  const createMatch = async () => {
    if (!teamA || !teamB) return;
    setCreating(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roundId,
          teamAId: teamA.id,
          teamBId: teamB.id,
          ...buildBody(newDraft),
        }),
      });
      if (!res.ok) throw new Error('Create failed');
      setNewDraft({
        matchNumber: String(matches.length + 2),
        sideA: [],
        sideB: [],
        result: '',
        pointsA: '',
        pointsB: '',
      });
      await load();
      setMessage({ type: 'success', text: 'Match created.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error' });
    } finally {
      setCreating(false);
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

  const renderSide = (
    draft: Draft,
    setDraft: (updater: (d: Draft) => Draft) => void,
    team: RcTeam | undefined,
    side: 'A' | 'B',
  ) => (
    <div>
      <p
        className="text-[10px] uppercase tracking-wider font-semibold mb-2"
        style={team?.color ? { color: team.color } : undefined}
      >
        {team?.name ?? (side === 'A' ? 'Team A' : 'Team B')}
      </p>
      <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-none">
        {team?.members.length === 0 ? (
          <p className="text-xs text-fg-3 italic">Roster empty</p>
        ) : null}
        {team?.members.map((m) => {
          const selected = (side === 'A' ? draft.sideA : draft.sideB).includes(m.playerId);
          return (
            <button
              key={m.playerId}
              type="button"
              onClick={() => setDraft((d) => togglePlayer(side, m.playerId, d))}
              className={`w-full text-left text-sm px-3 py-1.5 rounded-lg border transition ${
                selected
                  ? 'border-masters bg-masters/15 text-fg-1'
                  : 'border-ink-3 bg-ink-2 text-fg-2 hover:border-fg-3'
              }`}
            >
              {m.player.name}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <AppHeader title={`Round ${round.roundNumber} matches`} backHref="/admin/ryder-cup" />
      <main className="bg-ink-0 pb-nav">
        <p className="px-4 pt-4 text-xs text-fg-3">
          {round.dayOfWeek} · {round.course} · {round.format} · {round.teeTime}
        </p>

        {/* Existing matches */}
        <section className="px-4 pt-4 space-y-3">
          {matches.map((m) => {
            const d = drafts[m.id];
            if (!d) return null;
            return (
              <div key={m.id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] uppercase tracking-widest text-fg-3">
                    Match
                  </p>
                  <input
                    type="number"
                    value={d.matchNumber}
                    onChange={(e) =>
                      setDrafts((p) => ({ ...p, [m.id]: { ...p[m.id], matchNumber: e.target.value } }))
                    }
                    className="input w-20 py-1.5 text-center"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {renderSide(
                    d,
                    (updater) => setDrafts((p) => ({ ...p, [m.id]: updater(p[m.id]) })),
                    teamA,
                    'A',
                  )}
                  {renderSide(
                    d,
                    (updater) => setDrafts((p) => ({ ...p, [m.id]: updater(p[m.id]) })),
                    teamB,
                    'B',
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="col-span-3 sm:col-span-1">
                    <label className="label">Result</label>
                    <input
                      type="text"
                      placeholder="2&1, AS, 3UP"
                      value={d.result}
                      onChange={(e) =>
                        setDrafts((p) => ({ ...p, [m.id]: { ...p[m.id], result: e.target.value } }))
                      }
                      className="input py-2"
                    />
                  </div>
                  <div>
                    <label className="label">Pts A</label>
                    <input
                      type="number"
                      step="0.5"
                      value={d.pointsA}
                      onChange={(e) =>
                        setDrafts((p) => ({ ...p, [m.id]: { ...p[m.id], pointsA: e.target.value } }))
                      }
                      className="input py-2"
                    />
                  </div>
                  <div>
                    <label className="label">Pts B</label>
                    <input
                      type="number"
                      step="0.5"
                      value={d.pointsB}
                      onChange={(e) =>
                        setDrafts((p) => ({ ...p, [m.id]: { ...p[m.id], pointsB: e.target.value } }))
                      }
                      className="input py-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button
                    onClick={() => deleteMatch(m.id)}
                    disabled={savingId === m.id}
                    className="btn-danger text-xs py-2"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => saveMatch(m.id)}
                    disabled={savingId === m.id}
                    className="btn-primary text-xs py-2"
                  >
                    {savingId === m.id ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            );
          })}
        </section>

        {/* Create new */}
        <section className="px-4 pt-6">
          <h2 className="label mb-3">New match</h2>
          <div className="card">
            <div className="mb-3">
              <label className="label">Match #</label>
              <input
                type="number"
                value={newDraft.matchNumber}
                onChange={(e) => setNewDraft({ ...newDraft, matchNumber: e.target.value })}
                className="input w-20 py-1.5 text-center"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {renderSide(newDraft, (updater) => setNewDraft((d) => updater(d)), teamA, 'A')}
              {renderSide(newDraft, (updater) => setNewDraft((d) => updater(d)), teamB, 'B')}
            </div>

            <button
              onClick={createMatch}
              disabled={creating || !teamA || !teamB}
              className="btn-primary w-full mt-4"
            >
              {creating ? 'Creating…' : 'Create match'}
            </button>

            {!teamA || !teamB ? (
              <p className="text-xs text-fg-3 mt-2 text-center">
                Both Ryder Cup teams must exist before creating matches.
              </p>
            ) : null}
          </div>
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

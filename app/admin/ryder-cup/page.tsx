'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/BottomTabBar';
import PlayerAvatar from '@/components/PlayerAvatar';
import { ArrowRightIcon } from '@/components/icons';

interface PlayerLite {
  id: string;
  name: string;
  photoUrl: string | null;
}

interface RcTeam {
  id: string;
  name: string;
  teamNumber: number;
  color: string | null;
  members: Array<{ id: string; playerId: string; player: PlayerLite }>;
}

interface RcRound {
  id: string;
  roundNumber: number;
  dayOfWeek: string;
  course: string;
  teeTime: string;
  format: string;
  matchCount: number;
}

export default function AdminRyderCupPage() {
  const router = useRouter();
  const [me, setMe] = useState<{ id: string; isAdmin: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<RcTeam[]>([]);
  const [allPlayers, setAllPlayers] = useState<PlayerLite[]>([]);
  const [rounds, setRounds] = useState<RcRound[]>([]);
  const [teamDrafts, setTeamDrafts] = useState<Record<string, { name: string; color: string }>>({});
  const [assignments, setAssignments] = useState<Record<string, 1 | 2 | null>>({});
  const [savingTeamId, setSavingTeamId] = useState<string | null>(null);
  const [savingRoster, setSavingRoster] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const load = async () => {
    const [tRes, pRes, rRes] = await Promise.all([
      fetch('/api/admin/rc-teams'),
      fetch('/api/admin/players'),
      fetch('/api/admin/rounds'),
    ]);
    const ts = (await tRes.json()) as RcTeam[];
    const ps = (await pRes.json()) as PlayerLite[];
    const { rounds: rs } = await rRes.json();

    setTeams(ts);
    setAllPlayers(ps);
    setRounds(
      rs
        .filter((r: any) => r.isRyderCup)
        .map((r: any) => ({
          id: r.id,
          roundNumber: r.roundNumber,
          dayOfWeek: r.dayOfWeek,
          course: r.course,
          teeTime: r.teeTime,
          format: r.format,
          matchCount: 0, // fetched separately below
        })),
    );

    // Match counts per round
    const countsRes = await fetch('/api/admin/rc-match-counts');
    if (countsRes.ok) {
      const counts: Record<string, number> = await countsRes.json();
      setRounds((prev) => prev.map((r) => ({ ...r, matchCount: counts[r.id] ?? 0 })));
    }

    setTeamDrafts(
      Object.fromEntries(
        ts.map((t) => [t.id, { name: t.name, color: t.color ?? '' }]),
      ),
    );

    const assign: Record<string, 1 | 2 | null> = {};
    for (const p of ps) assign[p.id] = null;
    for (const t of ts) {
      for (const m of t.members) {
        assign[m.playerId] = t.teamNumber as 1 | 2;
      }
    }
    setAssignments(assign);
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
  }, [router]);

  const saveTeam = async (teamId: string) => {
    const d = teamDrafts[teamId];
    if (!d) return;
    setSavingTeamId(teamId);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/rc-teams/${teamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: d.name, color: d.color || null }),
      });
      if (!res.ok) throw new Error('Save failed');
      await load();
      setMessage({ type: 'success', text: 'Team saved.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error' });
    } finally {
      setSavingTeamId(null);
    }
  };

  const cycle = (id: string) => {
    setAssignments((prev) => {
      const cur = prev[id];
      const next = cur === null ? 1 : cur === 1 ? 2 : null;
      return { ...prev, [id]: next };
    });
  };

  const saveRoster = async () => {
    setSavingRoster(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/rc-teams/assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignments: Object.entries(assignments).map(([playerId, teamNumber]) => ({
            playerId,
            teamNumber,
          })),
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      await load();
      setMessage({ type: 'success', text: 'Rosters saved.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error' });
    } finally {
      setSavingRoster(false);
    }
  };

  if (loading) {
    return (
      <>
        <AppHeader title="Ryder Cup setup" backHref="/admin" />
        <main className="min-h-[50vh] flex items-center justify-center bg-ink-0">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-masters border-t-transparent" />
        </main>
        <BottomTabBar />
      </>
    );
  }

  const counts = {
    A: Object.values(assignments).filter((v) => v === 1).length,
    B: Object.values(assignments).filter((v) => v === 2).length,
  };

  return (
    <>
      <AppHeader title="Ryder Cup setup" backHref="/admin" />
      <main className="bg-ink-0 pb-nav">
        {/* Teams */}
        <section className="px-4 pt-4">
          <h2 className="label mb-3">Teams</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {teams.map((team) => {
              const d = teamDrafts[team.id];
              if (!d) return null;
              return (
                <div key={team.id} className="card">
                  <p className="text-[10px] uppercase tracking-widest text-fg-3">
                    Team {team.teamNumber}
                  </p>
                  <div className="grid grid-cols-[1fr_auto] gap-2 mt-1 mb-3 items-center">
                    <input
                      type="text"
                      value={d.name}
                      onChange={(e) =>
                        setTeamDrafts((p) => ({
                          ...p,
                          [team.id]: { ...p[team.id], name: e.target.value },
                        }))
                      }
                      className="input"
                    />
                    <input
                      type="color"
                      value={d.color || '#000000'}
                      onChange={(e) =>
                        setTeamDrafts((p) => ({
                          ...p,
                          [team.id]: { ...p[team.id], color: e.target.value },
                        }))
                      }
                      className="w-12 h-12 rounded-lg bg-ink-1 border border-ink-3 cursor-pointer"
                      aria-label="Team color"
                    />
                  </div>
                  <p className="text-xs text-fg-3">
                    {team.members.length}/8 assigned
                  </p>
                  <button
                    onClick={() => saveTeam(team.id)}
                    disabled={savingTeamId === team.id}
                    className="btn-primary w-full mt-3 text-xs py-2"
                  >
                    {savingTeamId === team.id ? 'Saving…' : 'Save team'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Roster picker */}
        <section className="px-4 pt-6">
          <div className="flex items-end justify-between mb-3">
            <h2 className="label">Roster</h2>
            <span className="text-xs text-fg-3">
              {counts.A} · {counts.B} · {allPlayers.length - counts.A - counts.B} unassigned
            </span>
          </div>
          <p className="text-xs text-fg-3 mb-3">Tap each tile to cycle: unassigned → Team 1 → Team 2.</p>
          <div className="grid grid-cols-3 gap-2">
            {allPlayers.map((p) => {
              const a = assignments[p.id];
              const teamColor =
                a === 1
                  ? teams.find((t) => t.teamNumber === 1)?.color ?? '#C41E3A'
                  : a === 2
                  ? teams.find((t) => t.teamNumber === 2)?.color ?? '#003DA5'
                  : null;
              const ringClass =
                a === null ? 'border-ink-3' : a === 1 ? 'border-teamA' : 'border-teamB';
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => cycle(p.id)}
                  className={`card ${ringClass} text-center p-2 tap-highlight-none active:scale-[0.98]`}
                >
                  <PlayerAvatar name={p.name} photoUrl={p.photoUrl} size="md" />
                  <p className="text-[11px] font-semibold mt-2 truncate">{p.name}</p>
                  <p
                    className="text-[10px] uppercase tracking-wider mt-1"
                    style={teamColor ? { color: teamColor } : undefined}
                  >
                    {a === 1
                      ? teams.find((t) => t.teamNumber === 1)?.name
                      : a === 2
                      ? teams.find((t) => t.teamNumber === 2)?.name
                      : 'Unassigned'}
                  </p>
                </button>
              );
            })}
          </div>
          <button
            onClick={saveRoster}
            disabled={savingRoster}
            className="btn-primary w-full mt-4"
          >
            {savingRoster ? 'Saving…' : 'Save rosters'}
          </button>
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

        {/* Round → matches */}
        <section className="px-4 pt-6">
          <h2 className="label mb-3">Matches by round</h2>
          <div className="space-y-2">
            {rounds.map((r) => (
              <Link
                key={r.id}
                href={`/admin/ryder-cup/rounds/${r.id}`}
                className="card flex items-center justify-between hover:border-fg-3 transition tap-highlight-none"
              >
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-fg-3">
                    Round {r.roundNumber} · {r.dayOfWeek}
                  </p>
                  <p className="font-semibold text-sm mt-0.5">{r.course}</p>
                  <p className="text-xs text-fg-3 mt-0.5">{r.format} · {r.teeTime}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="pill">{r.matchCount} matches</span>
                  <ArrowRightIcon size={18} className="text-fg-3" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <BottomTabBar isAdmin={me?.isAdmin} />
    </>
  );
}

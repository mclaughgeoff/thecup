'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/BottomTabBar';
import PlayerAvatar from '@/components/PlayerAvatar';
import { CheckIcon } from '@/components/icons';

interface PlayerLite {
  id: string;
  name: string;
  photoUrl: string | null;
}

interface RoundLite {
  id: string;
  roundNumber: number;
  dayOfWeek: string;
  timeSlot: string;
  course: string;
  teeTime: string;
  format: string;
  isRyderCup: boolean;
}

export default function AdminAvailabilityPage() {
  const router = useRouter();
  const [me, setMe] = useState<{ id: string; isAdmin: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<PlayerLite[]>([]);
  const [rounds, setRounds] = useState<RoundLite[]>([]);
  const [original, setOriginal] = useState<Record<string, boolean>>({});
  const [state, setState] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const key = (playerId: string, roundId: string) => `${playerId}:${roundId}`;

  const load = async () => {
    const r = await fetch('/api/admin/availability');
    if (!r.ok) return;
    const data = await r.json();
    setPlayers(data.players);
    setRounds(data.rounds);
    // Default missing cells to true (new players/rounds)
    const next: Record<string, boolean> = {};
    for (const p of data.players) {
      for (const r of data.rounds) {
        const k = key(p.id, r.id);
        next[k] = data.availability[k] ?? true;
      }
    }
    setOriginal(next);
    setState(next);
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

  const dirty = useMemo(() => {
    return Object.keys(state).filter((k) => state[k] !== original[k]);
  }, [state, original]);

  const toggle = (playerId: string, roundId: string) => {
    const k = key(playerId, roundId);
    setState((p) => ({ ...p, [k]: !p[k] }));
  };

  const save = async () => {
    if (dirty.length === 0) return;
    setSaving(true);
    setMessage(null);
    try {
      const entries = dirty.map((k) => {
        const [playerId, roundId] = k.split(':');
        return { playerId, roundId, available: state[k] };
      });
      const res = await fetch('/api/admin/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      });
      if (!res.ok) throw new Error('Save failed');
      setOriginal({ ...state });
      setMessage({ type: 'success', text: `Saved ${entries.length} change(s).` });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <AppHeader title="Availability" backHref="/admin" />
        <main className="min-h-[50vh] flex items-center justify-center bg-ink-0">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-masters border-t-transparent" />
        </main>
        <BottomTabBar />
      </>
    );
  }

  return (
    <>
      <AppHeader title="Availability" backHref="/admin" />
      <main className="bg-ink-0 pb-nav">
        <p className="px-4 pt-4 text-xs text-fg-3">
          Toggle which rounds each player is in. Rows are players, columns are rounds.
          Players can still self-edit on their profile — this overrides when they can't.
        </p>

        {/* Save bar */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <span className="text-xs text-fg-3">
            {dirty.length === 0 ? 'No unsaved changes' : `${dirty.length} pending`}
          </span>
          <button
            onClick={save}
            disabled={saving || dirty.length === 0}
            className="btn-primary text-xs py-2 px-3"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>

        {message ? (
          <div className="px-4 pb-3">
            <div
              className={`p-2.5 rounded-xl text-xs border ${
                message.type === 'success'
                  ? 'bg-success/10 border-success/30 text-success'
                  : 'bg-danger/10 border-danger/30 text-danger'
              }`}
            >
              {message.text}
            </div>
          </div>
        ) : null}

        {/* Grid — horizontal scroll on mobile */}
        <div className="overflow-x-auto scrollbar-none">
          <table className="min-w-full text-sm">
            <thead className="sticky top-14 z-10 bg-ink-0/95 backdrop-blur">
              <tr>
                <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-fg-3 font-semibold sticky left-0 bg-ink-0/95 backdrop-blur">
                  Player
                </th>
                {rounds.map((r) => (
                  <th key={r.id} className="px-2 py-2 text-[10px] uppercase tracking-wider text-fg-3 font-semibold">
                    <div>R{r.roundNumber}</div>
                    <div className="text-fg-2 font-medium normal-case tracking-normal">
                      {r.dayOfWeek} {r.timeSlot}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id} className="border-t border-ink-3">
                  <td className="px-3 py-2 sticky left-0 bg-ink-0/95 backdrop-blur">
                    <div className="flex items-center gap-2 min-w-[140px]">
                      <PlayerAvatar name={p.name} photoUrl={p.photoUrl} size="sm" />
                      <span className="font-semibold text-sm truncate">{p.name}</span>
                    </div>
                  </td>
                  {rounds.map((r) => {
                    const on = state[key(p.id, r.id)] ?? true;
                    const changed = on !== original[key(p.id, r.id)];
                    return (
                      <td key={r.id} className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => toggle(p.id, r.id)}
                          className={`w-10 h-10 rounded-lg border transition tap-highlight-none inline-flex items-center justify-center ${
                            on
                              ? 'bg-masters/15 border-masters/40 text-masters-glow'
                              : 'bg-ink-2 border-ink-3 text-fg-3'
                          } ${changed ? 'ring-2 ring-gold/50' : ''}`}
                          aria-label={`${p.name} Round ${r.roundNumber}: ${on ? 'in' : 'out'}`}
                        >
                          {on ? <CheckIcon size={16} /> : <span className="text-xs">Out</span>}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      <BottomTabBar isAdmin={me?.isAdmin} />
    </>
  );
}

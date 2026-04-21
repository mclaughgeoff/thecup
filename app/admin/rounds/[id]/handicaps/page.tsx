'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/BottomTabBar';
import PlayerAvatar from '@/components/PlayerAvatar';

interface RoundInfo {
  id: string;
  roundNumber: number;
  dayOfWeek: string;
  course: string;
  teeTime: string;
  formatName: string;
  allowance: number | null;
  slope: number | null;
  activeTeeBox: string | null;
}

interface PlayerRow {
  id: string;
  name: string;
  photoUrl: string | null;
  handicap: number;
  courseHandicap: number;
  computedPH: number | null;
  overridePH: number | null;
}

export default function AdminRoundHandicapsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [me, setMe] = useState<{ id: string; isAdmin: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [round, setRound] = useState<RoundInfo | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  // Draft state: playerId → string (empty = "use computed")
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = async () => {
    const r = await fetch(`/api/admin/rounds/${params.id}/handicaps`);
    if (!r.ok) return;
    const data = await r.json();
    setRound(data.round);
    setPlayers(data.players);
    setDrafts(
      Object.fromEntries(
        data.players.map((p: PlayerRow) => [
          p.id,
          p.overridePH != null ? String(p.overridePH) : '',
        ]),
      ),
    );
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
  }, [router, params.id]);

  const dirty = useMemo(() => {
    const changed: Array<{ playerId: string; playingHandicap: number | null }> = [];
    for (const p of players) {
      const current = drafts[p.id] ?? '';
      const originalStr = p.overridePH != null ? String(p.overridePH) : '';
      if (current === originalStr) continue;
      changed.push({
        playerId: p.id,
        playingHandicap: current === '' ? null : Number(current),
      });
    }
    return changed;
  }, [drafts, players]);

  const save = async () => {
    if (dirty.length === 0) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/rounds/${params.id}/handicaps`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overrides: dirty }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Save failed');
      }
      await load();
      setMessage({ type: 'success', text: `Saved ${dirty.length} change(s).` });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error' });
    } finally {
      setSaving(false);
    }
  };

  const clearAll = () => {
    setDrafts(Object.fromEntries(players.map((p) => [p.id, ''])));
  };

  if (loading || !round) {
    return (
      <>
        <AppHeader title="Handicap overrides" backHref="/admin/rounds" />
        <main className="min-h-[50vh] flex items-center justify-center bg-ink-0">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-masters border-t-transparent" />
        </main>
        <BottomTabBar />
      </>
    );
  }

  return (
    <>
      <AppHeader title="Handicap overrides" backHref="/admin/rounds" />
      <main className="bg-ink-0 pb-nav">
        {/* Round context card */}
        <section className="px-4 pt-4">
          <div className="card-elevated">
            <p className="text-[10px] uppercase tracking-widest text-fg-3 text-center">
              Round {round.roundNumber} · {round.dayOfWeek}
            </p>
            <p className="text-center text-sm text-fg-2 mt-1">
              {round.course}
              {round.activeTeeBox ? ` · ${round.activeTeeBox}` : ''} · {round.teeTime}
            </p>
            <p className="text-center text-[10px] uppercase tracking-wider text-fg-3 mt-2">
              {round.formatName}
              {round.allowance != null ? ` · ${round.allowance}% allowance` : ''}
              {round.slope != null ? ` · slope ${round.slope}` : ''}
            </p>
          </div>
        </section>

        {round.allowance == null ? (
          <div className="px-4 pt-4">
            <div className="card border-danger/40">
              <p className="text-sm text-danger">
                This round has no scoring format linked. Set one in Admin → Rounds before
                setting handicap overrides.
              </p>
            </div>
          </div>
        ) : null}

        {/* Save bar */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-3">
          <span className="text-xs text-fg-3">
            {dirty.length === 0 ? 'No unsaved changes' : `${dirty.length} pending`}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={clearAll}
              className="btn-ghost text-xs py-2 px-3"
            >
              Clear all
            </button>
            <button
              onClick={save}
              disabled={saving || dirty.length === 0}
              className="btn-primary text-xs py-2 px-3"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {message ? (
          <div className="px-4 pb-2">
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

        <p className="px-4 pt-2 text-[11px] text-fg-3 leading-relaxed">
          Leave blank to use the computed playing handicap. Set a number to override.
          For team formats (Foursomes, Scramble), the team's combined handicap is the
          sum of each partner's effective PH.
        </p>

        {/* Player list */}
        <section className="px-4 pt-3 space-y-2">
          {players.map((p) => {
            const current = drafts[p.id] ?? '';
            const originalStr = p.overridePH != null ? String(p.overridePH) : '';
            const changed = current !== originalStr;
            const effective =
              current === ''
                ? p.computedPH ?? null
                : Number(current);
            return (
              <div key={p.id} className="card">
                <div className="flex items-center gap-3">
                  <PlayerAvatar name={p.name} photoUrl={p.photoUrl} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{p.name}</p>
                    <p className="text-[10px] text-fg-3">
                      Index {p.handicap.toFixed(1)} · Course hcp {p.courseHandicap}
                      {p.computedPH != null ? ` · Computed PH ${p.computedPH}` : ''}
                    </p>
                  </div>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder={p.computedPH != null ? String(p.computedPH) : '—'}
                    value={current}
                    onChange={(e) =>
                      setDrafts((prev) => ({ ...prev, [p.id]: e.target.value }))
                    }
                    className={`input w-16 text-center py-2 ${
                      changed ? 'ring-2 ring-gold/50' : ''
                    }`}
                  />
                </div>
                {effective != null && current !== '' ? (
                  <p className="text-[10px] text-fg-3 mt-2 text-right">
                    Effective PH: <span className="text-masters-glow font-mono">{effective}</span>
                  </p>
                ) : null}
              </div>
            );
          })}
        </section>
      </main>
      <BottomTabBar isAdmin={me?.isAdmin} />
    </>
  );
}

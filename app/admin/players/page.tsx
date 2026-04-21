'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/BottomTabBar';
import PlayerAvatar from '@/components/PlayerAvatar';

interface Villa {
  id: string;
  name: string;
}

interface AdminPlayer {
  id: string;
  name: string;
  email: string;
  nickname: string | null;
  handicap: number;
  photoUrl: string | null;
  isAdmin: boolean;
  villaId: string | null;
  villa: Villa | null;
}

interface Draft {
  nickname: string;
  handicap: string;
  villaId: string;
  isAdmin: boolean;
}

export default function AdminPlayersPage() {
  const router = useRouter();
  const [me, setMe] = useState<{ id: string; isAdmin: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [villas, setVillas] = useState<Villa[]>([]);
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ id: string; text: string; type: 'success' | 'error' } | null>(null);

  const loadAll = async () => {
    const [playersRes, villasRes] = await Promise.all([
      fetch('/api/admin/players'),
      fetch('/api/admin/villas'),
    ]);
    if (playersRes.ok) {
      const ps = (await playersRes.json()) as AdminPlayer[];
      setPlayers(ps);
      setDrafts(Object.fromEntries(ps.map((p) => [p.id, toDraft(p)])));
    }
    if (villasRes.ok) {
      setVillas(await villasRes.json());
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
        await loadAll();
      } catch {
        router.push('/auth/request-link');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const updateDraft = (id: string, patch: Partial<Draft>) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const save = async (p: AdminPlayer) => {
    const d = drafts[p.id];
    if (!d) return;
    setSavingId(p.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/players/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: d.nickname || null,
          handicap: parseFloat(d.handicap),
          villaId: d.villaId || null,
          isAdmin: d.isAdmin,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Save failed');
      }
      const updated = await res.json();
      setPlayers((prev) => prev.map((x) => (x.id === p.id ? { ...x, ...updated, villa: villas.find((v) => v.id === updated.villaId) ?? null } : x)));
      setMessage({ id: p.id, type: 'success', text: 'Saved.' });
    } catch (err) {
      setMessage({ id: p.id, type: 'error', text: err instanceof Error ? err.message : 'Error' });
    } finally {
      setSavingId(null);
    }
  };

  const resendInvite = async (id: string) => {
    setSavingId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/players/${id}/resend-invite`, { method: 'POST' });
      if (!res.ok) throw new Error('Resend failed');
      setMessage({ id, type: 'success', text: 'Invite sent.' });
    } catch (err) {
      setMessage({ id, type: 'error', text: err instanceof Error ? err.message : 'Error' });
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <>
        <AppHeader title="Players" backHref="/admin" />
        <main className="min-h-[50vh] flex items-center justify-center bg-ink-0">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-masters border-t-transparent" />
        </main>
        <BottomTabBar />
      </>
    );
  }

  return (
    <>
      <AppHeader title="Players" backHref="/admin" />
      <main className="bg-ink-0 pb-nav">
        <p className="px-4 pt-4 text-xs text-fg-3">
          Edit nickname, handicap, villa, and admin flag. Handicap is admin-only — players can't change it.
        </p>

        <div className="px-4 pt-4 space-y-3">
          {players.map((p) => {
            const d = drafts[p.id];
            if (!d) return null;
            return (
              <div key={p.id} className="card">
                <div className="flex items-center gap-3 mb-4">
                  <PlayerAvatar name={p.name} photoUrl={p.photoUrl} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{p.name}</p>
                    <p className="text-xs text-fg-3 truncate">{p.email}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Nickname</label>
                      <input
                        type="text"
                        value={d.nickname}
                        onChange={(e) => updateDraft(p.id, { nickname: e.target.value })}
                        placeholder="Optional"
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Handicap</label>
                      <input
                        type="number"
                        step="0.1"
                        value={d.handicap}
                        onChange={(e) => updateDraft(p.id, { handicap: e.target.value })}
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Villa</label>
                      <select
                        value={d.villaId}
                        onChange={(e) => updateDraft(p.id, { villaId: e.target.value })}
                        className="input"
                      >
                        <option value="">Unassigned</option>
                        {villas.map((v) => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                    <label className="flex items-end gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={d.isAdmin}
                        onChange={(e) => updateDraft(p.id, { isAdmin: e.target.checked })}
                        className="w-4 h-4 accent-masters mb-2.5"
                      />
                      <span className="mb-2.5">Admin</span>
                    </label>
                  </div>
                </div>

                {message && message.id === p.id ? (
                  <div
                    className={`mt-3 p-2.5 rounded-xl text-xs border ${
                      message.type === 'success'
                        ? 'bg-success/10 border-success/30 text-success'
                        : 'bg-danger/10 border-danger/30 text-danger'
                    }`}
                  >
                    {message.text}
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button
                    onClick={() => resendInvite(p.id)}
                    disabled={savingId === p.id}
                    className="btn-ghost text-xs py-2"
                  >
                    Resend invite
                  </button>
                  <button
                    onClick={() => save(p)}
                    disabled={savingId === p.id}
                    className="btn-primary text-xs py-2"
                  >
                    {savingId === p.id ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <BottomTabBar isAdmin={me?.isAdmin} />
    </>
  );
}

function toDraft(p: AdminPlayer): Draft {
  return {
    nickname: p.nickname ?? '',
    handicap: String(p.handicap),
    villaId: p.villaId ?? '',
    isAdmin: p.isAdmin,
  };
}

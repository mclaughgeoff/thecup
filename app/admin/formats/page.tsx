'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/BottomTabBar';

interface Format {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  teamSize: number;
  scoringType: 'match' | 'stroke' | 'stableford';
  teamScoringMode: 'individual' | 'best_ball' | 'alternate_shot' | 'scramble';
  handicapCombine: 'per_player' | 'combined_sum';
  defaultAllowance: number;
  strokeEntryMode: 'per_player' | 'per_side';
  sortOrder: number;
}

type Draft = Omit<Format, 'id'> & { id?: string };

const EMPTY: Draft = {
  name: '',
  slug: '',
  description: '',
  teamSize: 2,
  scoringType: 'match',
  teamScoringMode: 'best_ball',
  handicapCombine: 'per_player',
  defaultAllowance: 100,
  strokeEntryMode: 'per_player',
  sortOrder: 100,
};

export default function AdminFormatsPage() {
  const router = useRouter();
  const [me, setMe] = useState<{ id: string; isAdmin: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [formats, setFormats] = useState<Format[]>([]);
  const [editing, setEditing] = useState<Draft>({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = async () => {
    const r = await fetch('/api/admin/formats');
    if (r.ok) setFormats(await r.json());
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

  const reset = () => setEditing({ ...EMPTY });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const url = editing.id ? `/api/admin/formats/${editing.id}` : '/api/admin/formats';
      const method = editing.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editing,
          teamSize: Number(editing.teamSize),
          defaultAllowance: Number(editing.defaultAllowance),
          sortOrder: Number(editing.sortOrder),
          description: editing.description || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Save failed');
      }
      reset();
      await load();
      setMessage({ type: 'success', text: editing.id ? 'Updated.' : 'Created.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this format?')) return;
    const res = await fetch(`/api/admin/formats/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Delete failed');
      return;
    }
    await load();
  };

  if (loading) {
    return (
      <>
        <AppHeader title="Formats" backHref="/admin" />
        <main className="min-h-[50vh] flex items-center justify-center bg-ink-0">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-masters border-t-transparent" />
        </main>
        <BottomTabBar />
      </>
    );
  }

  return (
    <>
      <AppHeader title="Formats" backHref="/admin" />
      <main className="bg-ink-0 pb-nav">
        <p className="px-4 pt-4 text-xs text-fg-3">
          Reusable scoring formats. Rounds pick one of these; the round inherits the
          format's default handicap allowance and scoring type unless overridden.
        </p>

        {/* Editor */}
        <form onSubmit={save} className="px-4 pt-4">
          <div className="card">
            <h2 className="label mb-3">{editing.id ? 'Edit format' : 'New format'}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Name</label>
                  <input
                    type="text" required value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Slug</label>
                  <input
                    type="text" required value={editing.slug}
                    onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                    placeholder="kebab-case"
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Description</label>
                <input
                  type="text" value={editing.description ?? ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Team size</label>
                  <select
                    value={editing.teamSize}
                    onChange={(e) => setEditing({ ...editing, teamSize: Number(e.target.value) })}
                    className="input"
                  >
                    <option value={1}>1 (Singles)</option>
                    <option value={2}>2 (Partners)</option>
                    <option value={4}>4 (Four-man)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Scoring</label>
                  <select
                    value={editing.scoringType}
                    onChange={(e) => setEditing({ ...editing, scoringType: e.target.value as Format['scoringType'] })}
                    className="input"
                  >
                    <option value="match">Match Play</option>
                    <option value="stroke">Stroke Play</option>
                    <option value="stableford">Stableford</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Team mode</label>
                  <select
                    value={editing.teamScoringMode}
                    onChange={(e) => setEditing({ ...editing, teamScoringMode: e.target.value as Format['teamScoringMode'] })}
                    className="input"
                  >
                    <option value="individual">Individual (1v1)</option>
                    <option value="best_ball">Best Ball</option>
                    <option value="alternate_shot">Alternate Shot</option>
                    <option value="scramble">Scramble</option>
                  </select>
                </div>
                <div>
                  <label className="label">Handicap combine</label>
                  <select
                    value={editing.handicapCombine}
                    onChange={(e) => setEditing({ ...editing, handicapCombine: e.target.value as Format['handicapCombine'] })}
                    className="input"
                  >
                    <option value="per_player">Per player</option>
                    <option value="combined_sum">Combined sum</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Entry mode</label>
                  <select
                    value={editing.strokeEntryMode}
                    onChange={(e) => setEditing({ ...editing, strokeEntryMode: e.target.value as Format['strokeEntryMode'] })}
                    className="input"
                  >
                    <option value="per_player">Per player</option>
                    <option value="per_side">Per side (team)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Allowance %</label>
                  <input
                    type="number" min={0} max={100} value={editing.defaultAllowance}
                    onChange={(e) => setEditing({ ...editing, defaultAllowance: Number(e.target.value) })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Sort order</label>
                <input
                  type="number" value={editing.sortOrder}
                  onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })}
                  className="input"
                />
              </div>
            </div>

            {message ? (
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

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button type="button" onClick={reset} className="btn-ghost">Reset</button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : editing.id ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </form>

        {/* List */}
        <section className="px-4 pt-6">
          <h2 className="label mb-3">Library ({formats.length})</h2>
          <div className="space-y-2">
            {formats.map((f) => (
              <div key={f.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-fg-3">
                      {f.slug}
                    </p>
                    <p className="font-semibold text-sm">{f.name}</p>
                    {f.description ? (
                      <p className="text-xs text-fg-2 mt-1">{f.description}</p>
                    ) : null}
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="pill">{f.scoringType}</span>
                      <span className="pill">{f.teamScoringMode}</span>
                      <span className="pill">{f.teamSize}-person</span>
                      <span className="pill">{f.defaultAllowance}% hcp</span>
                      <span className="pill">{f.strokeEntryMode === 'per_side' ? 'Team entry' : 'Player entry'}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    onClick={() => setEditing({ ...f, description: f.description ?? '' })}
                    className="btn-ghost text-xs py-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(f.id)}
                    className="btn-danger text-xs py-2"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <BottomTabBar isAdmin={me?.isAdmin} />
    </>
  );
}

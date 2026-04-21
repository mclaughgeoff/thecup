'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/BottomTabBar';
import PlayerAvatar from '@/components/PlayerAvatar';

interface Villa {
  id: string;
  name: string;
  capacity: number;
}

interface Row {
  id: string;
  name: string;
  photoUrl: string | null;
  villaId: string | null;
  draftVillaId: string;
  saving: boolean;
  status: 'idle' | 'saved' | 'error';
}

export default function AdminHousingPage() {
  const router = useRouter();
  const [me, setMe] = useState<{ id: string; isAdmin: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [villas, setVillas] = useState<Villa[]>([]);
  const [rows, setRows] = useState<Row[]>([]);

  const load = async () => {
    const [p, v] = await Promise.all([
      fetch('/api/admin/players').then((r) => r.json()),
      fetch('/api/admin/villas').then((r) => r.json()),
    ]);
    setVillas(v);
    setRows(
      p.map((x: any) => ({
        id: x.id,
        name: x.name,
        photoUrl: x.photoUrl,
        villaId: x.villaId,
        draftVillaId: x.villaId ?? '',
        saving: false,
        status: 'idle' as const,
      })),
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
  }, [router]);

  const setRow = (id: string, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const save = async (row: Row) => {
    setRow(row.id, { saving: true, status: 'idle' });
    try {
      const res = await fetch(`/api/admin/players/${row.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ villaId: row.draftVillaId || null }),
      });
      if (!res.ok) throw new Error('Save failed');
      setRow(row.id, { saving: false, status: 'saved', villaId: row.draftVillaId || null });
      setTimeout(() => setRow(row.id, { status: 'idle' }), 1500);
    } catch {
      setRow(row.id, { saving: false, status: 'error' });
    }
  };

  if (loading) {
    return (
      <>
        <AppHeader title="Housing" backHref="/admin" />
        <main className="min-h-[50vh] flex items-center justify-center bg-ink-0">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-masters border-t-transparent" />
        </main>
        <BottomTabBar />
      </>
    );
  }

  const counts = villas.map((v) => ({
    ...v,
    current: rows.filter((r) => r.villaId === v.id).length,
  }));

  return (
    <>
      <AppHeader title="Housing" backHref="/admin" />
      <main className="bg-ink-0 pb-nav">
        <section className="px-4 pt-4">
          <h2 className="label mb-3">Villa capacity</h2>
          <div className="grid grid-cols-2 gap-3">
            {counts.map((v) => (
              <div key={v.id} className="card text-center">
                <p className="font-semibold text-sm">{v.name}</p>
                <p className="text-2xl font-mono font-semibold text-masters-glow mt-1">
                  {v.current}/{v.capacity}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 pt-6">
          <h2 className="label mb-3">Assignments</h2>
          <div className="space-y-2">
            {rows.map((row) => {
              const changed = (row.draftVillaId || null) !== row.villaId;
              return (
                <div key={row.id} className="card">
                  <div className="flex items-center gap-3 mb-3">
                    <PlayerAvatar name={row.name} photoUrl={row.photoUrl} size="sm" />
                    <p className="flex-1 font-semibold text-sm truncate">{row.name}</p>
                    {row.status === 'saved' ? (
                      <span className="text-success text-[10px] uppercase tracking-wider">Saved</span>
                    ) : null}
                    {row.status === 'error' ? (
                      <span className="text-danger text-[10px] uppercase tracking-wider">Error</span>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={row.draftVillaId}
                      onChange={(e) => setRow(row.id, { draftVillaId: e.target.value })}
                      className="input flex-1 py-2"
                    >
                      <option value="">Unassigned</option>
                      {villas.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => save(row)}
                      disabled={!changed || row.saving}
                      className="btn-primary text-xs py-2 px-3"
                    >
                      {row.saving ? '…' : 'Save'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
      <BottomTabBar isAdmin={me?.isAdmin} />
    </>
  );
}

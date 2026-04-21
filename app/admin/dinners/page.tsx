'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/BottomTabBar';

interface Reservation {
  id: string;
  date: string;
  dayOfWeek: string;
  mealType: 'lunch' | 'dinner';
  time: string;
  restaurant: string;
  address: string | null;
  notes: string | null;
  headcount: number | null;
  confirmed: boolean;
}

const EMPTY: Omit<Reservation, 'id'> = {
  date: '',
  dayOfWeek: 'Thu',
  mealType: 'dinner',
  time: '',
  restaurant: '',
  address: '',
  notes: '',
  headcount: null,
  confirmed: true,
};

export default function AdminDinnersPage() {
  const router = useRouter();
  const [me, setMe] = useState<{ id: string; name: string; isAdmin: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [editing, setEditing] = useState<{ id?: string } & Omit<Reservation, 'id'>>({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = async () => {
    const res = await fetch('/api/admin/dinners');
    if (!res.ok) return;
    const data = (await res.json()) as Reservation[];
    setReservations(data);
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

  const resetForm = () => setEditing({ ...EMPTY });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const url = editing.id
        ? `/api/admin/dinners/${editing.id}`
        : '/api/admin/dinners';
      const method = editing.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editing,
          headcount: editing.headcount === null ? null : Number(editing.headcount),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Save failed');
      }
      resetForm();
      await load();
      setMessage({ type: 'success', text: editing.id ? 'Updated.' : 'Created.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this reservation?')) return;
    const res = await fetch(`/api/admin/dinners/${id}`, { method: 'DELETE' });
    if (res.ok) await load();
  };

  const beginEdit = (r: Reservation) => {
    setEditing({
      id: r.id,
      date: new Date(r.date).toISOString().slice(0, 10),
      dayOfWeek: r.dayOfWeek,
      mealType: r.mealType,
      time: r.time,
      restaurant: r.restaurant,
      address: r.address ?? '',
      notes: r.notes ?? '',
      headcount: r.headcount,
      confirmed: r.confirmed,
    });
  };

  if (loading) {
    return (
      <>
        <AppHeader title="Meals" backHref="/admin" />
        <main className="min-h-[50vh] flex items-center justify-center bg-ink-0">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-masters border-t-transparent" />
        </main>
        <BottomTabBar />
      </>
    );
  }

  return (
    <>
      <AppHeader title="Meals" backHref="/admin" />
      <main className="bg-ink-0 pb-nav">
        <form onSubmit={save} className="px-4 pt-4">
          <div className="card">
            <h2 className="label mb-3">{editing.id ? 'Edit reservation' : 'New reservation'}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    required
                    value={editing.date}
                    onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Day</label>
                  <select
                    value={editing.dayOfWeek}
                    onChange={(e) => setEditing({ ...editing, dayOfWeek: e.target.value })}
                    className="input"
                  >
                    {['Wed','Thu','Fri','Sat','Sun'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Meal</label>
                  <select
                    value={editing.mealType}
                    onChange={(e) => setEditing({ ...editing, mealType: e.target.value as 'lunch' | 'dinner' })}
                    className="input"
                  >
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                  </select>
                </div>
                <div>
                  <label className="label">Time</label>
                  <input
                    type="text"
                    required
                    placeholder="7:30 PM"
                    value={editing.time}
                    onChange={(e) => setEditing({ ...editing, time: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="label">Restaurant</label>
                <input
                  type="text"
                  required
                  value={editing.restaurant}
                  onChange={(e) => setEditing({ ...editing, restaurant: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Address</label>
                <input
                  type="text"
                  value={editing.address ?? ''}
                  onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                  className="input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Headcount</label>
                  <input
                    type="number"
                    min={0}
                    value={editing.headcount ?? ''}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        headcount: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                    className="input"
                  />
                </div>
                <label className="flex items-end gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editing.confirmed}
                    onChange={(e) => setEditing({ ...editing, confirmed: e.target.checked })}
                    className="w-4 h-4 accent-masters mb-2.5"
                  />
                  <span className="mb-2.5">Confirmed</span>
                </label>
              </div>
              <div>
                <label className="label">Notes</label>
                <input
                  type="text"
                  value={editing.notes ?? ''}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
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
              <button
                type="button"
                onClick={resetForm}
                className="btn-ghost"
              >
                Reset
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : editing.id ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </form>

        <section className="px-4 pt-6">
          <h2 className="label mb-3">All reservations ({reservations.length})</h2>
          <div className="space-y-2">
            {reservations.map((r) => (
              <div key={r.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-fg-3">
                      {r.dayOfWeek} · {r.mealType}
                    </p>
                    <p className="text-base font-semibold mt-0.5">{r.restaurant}</p>
                    <p className="text-xs text-fg-2 mt-0.5">{r.time}</p>
                  </div>
                  <span
                    className={`pill ${
                      r.confirmed
                        ? 'border-masters/60 text-masters-glow'
                        : 'border-ink-3 text-fg-2'
                    }`}
                  >
                    {r.confirmed ? 'Confirmed' : 'Tentative'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button onClick={() => beginEdit(r)} className="btn-ghost text-xs py-2">
                    Edit
                  </button>
                  <button onClick={() => remove(r.id)} className="btn-danger text-xs py-2">
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

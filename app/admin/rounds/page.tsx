'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/BottomTabBar';

interface TeeBox { id: string; name: string; totalYards: number }
interface Course { id: string; name: string; teeBoxes: TeeBox[] }
interface Round {
  id: string;
  roundNumber: number;
  dayOfWeek: string;
  date: string;
  course: string;
  teeTime: string;
  format: string;
  isRyderCup: boolean;
  activeTeeBox: string | null;
  courseId: string | null;
}

interface Draft {
  course: string;
  teeTime: string;
  format: string;
  isRyderCup: boolean;
  courseId: string;
  activeTeeBox: string;
  saving: boolean;
  status: 'idle' | 'saved' | 'error';
}

export default function AdminRoundsPage() {
  const router = useRouter();
  const [me, setMe] = useState<{ id: string; isAdmin: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  const load = async () => {
    const r = await fetch('/api/admin/rounds');
    if (!r.ok) return;
    const { rounds: rs, courses: cs } = await r.json();
    setRounds(rs);
    setCourses(cs);
    setDrafts(
      Object.fromEntries(
        rs.map((x: Round) => [
          x.id,
          {
            course: x.course,
            teeTime: x.teeTime,
            format: x.format,
            isRyderCup: x.isRyderCup,
            courseId: x.courseId ?? '',
            activeTeeBox: x.activeTeeBox ?? '',
            saving: false,
            status: 'idle',
          } as Draft,
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
  }, [router]);

  const setDraft = (id: string, patch: Partial<Draft>) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const save = async (id: string) => {
    const d = drafts[id];
    if (!d) return;
    setDraft(id, { saving: true, status: 'idle' });
    try {
      const res = await fetch(`/api/admin/rounds/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course: d.course,
          teeTime: d.teeTime,
          format: d.format,
          isRyderCup: d.isRyderCup,
          courseId: d.courseId || null,
          activeTeeBox: d.activeTeeBox || null,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      setDraft(id, { saving: false, status: 'saved' });
      setTimeout(() => setDraft(id, { status: 'idle' }), 1500);
    } catch {
      setDraft(id, { saving: false, status: 'error' });
    }
  };

  if (loading) {
    return (
      <>
        <AppHeader title="Round setup" backHref="/admin" />
        <main className="min-h-[50vh] flex items-center justify-center bg-ink-0">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-masters border-t-transparent" />
        </main>
        <BottomTabBar />
      </>
    );
  }

  return (
    <>
      <AppHeader title="Round setup" backHref="/admin" />
      <main className="bg-ink-0 pb-nav">
        <div className="px-4 pt-4 space-y-3">
          {rounds.map((round) => {
            const d = drafts[round.id];
            if (!d) return null;
            const linkedCourse = courses.find((c) => c.id === d.courseId);
            return (
              <section key={round.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-fg-3">
                      Round {round.roundNumber} · {round.dayOfWeek}
                    </p>
                    <p className="text-xs text-fg-3 mt-0.5">
                      {new Date(round.date).toLocaleDateString()}
                    </p>
                  </div>
                  {d.status === 'saved' ? (
                    <span className="text-success text-[10px] uppercase tracking-wider">Saved</span>
                  ) : d.status === 'error' ? (
                    <span className="text-danger text-[10px] uppercase tracking-wider">Error</span>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Course (display)</label>
                      <input
                        type="text"
                        value={d.course}
                        onChange={(e) => setDraft(round.id, { course: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Tee time</label>
                      <input
                        type="text"
                        value={d.teeTime}
                        onChange={(e) => setDraft(round.id, { teeTime: e.target.value })}
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Format</label>
                      <input
                        type="text"
                        value={d.format}
                        onChange={(e) => setDraft(round.id, { format: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Linked course</label>
                      <select
                        value={d.courseId}
                        onChange={(e) =>
                          setDraft(round.id, { courseId: e.target.value, activeTeeBox: '' })
                        }
                        className="input"
                      >
                        <option value="">None</option>
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="label">Tee box</label>
                    {linkedCourse ? (
                      <select
                        value={d.activeTeeBox}
                        onChange={(e) => setDraft(round.id, { activeTeeBox: e.target.value })}
                        className="input"
                      >
                        <option value="">None</option>
                        {linkedCourse.teeBoxes.map((tb) => (
                          <option key={tb.id} value={tb.name}>
                            {tb.name} · {tb.totalYards}y
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={d.activeTeeBox}
                        onChange={(e) => setDraft(round.id, { activeTeeBox: e.target.value })}
                        placeholder="Link a course first"
                        className="input"
                      />
                    )}
                  </div>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={d.isRyderCup}
                      onChange={(e) => setDraft(round.id, { isRyderCup: e.target.checked })}
                      className="w-4 h-4 accent-masters"
                    />
                    Ryder Cup round
                  </label>
                </div>

                <button
                  onClick={() => save(round.id)}
                  disabled={d.saving}
                  className="btn-primary w-full mt-4 text-sm py-2.5"
                >
                  {d.saving ? 'Saving…' : 'Save'}
                </button>
              </section>
            );
          })}
        </div>
      </main>
      <BottomTabBar isAdmin={me?.isAdmin} />
    </>
  );
}

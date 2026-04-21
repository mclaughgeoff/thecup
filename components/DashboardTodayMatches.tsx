'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface MyMatch {
  matchId: string;
  roundId: string;
  roundNumber: number;
  roundLabel: string;
  teeTime: string;
  mySide: 'A' | 'B' | null;
  teamA: { name: string; color: string; players: string[] };
  teamB: { name: string; color: string; players: string[] };
}

function parseClockToMinutes(s: string): number | null {
  const m = s.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return null;
  let h = Number(m[1]);
  const mm = Number(m[2]);
  const ampm = m[3].toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + mm;
}

export default function DashboardTodayMatches() {
  const [matches, setMatches] = useState<MyMatch[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await fetch('/api/players/my-matches-today', { cache: 'no-store' });
      if (!r.ok) return;
      const j = await r.json();
      if (!cancelled) setMatches(j.matches ?? []);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!matches || matches.length === 0) return null;

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  return (
    <section className="px-4 pb-6">
      <h2 className="label mb-3">Your matches today</h2>
      <div className="space-y-3">
        {matches.map((m) => {
          const mins = parseClockToMinutes(m.teeTime);
          const dMin = mins == null ? null : mins - nowMins;
          const isLive = dMin != null && dMin <= 0 && dMin >= -240; // 4h live window
          const mySide = m.mySide === 'A' ? m.teamA : m.mySide === 'B' ? m.teamB : null;
          const opponent = m.mySide === 'A' ? m.teamB : m.mySide === 'B' ? m.teamA : m.teamB;
          return (
            <div
              key={m.matchId}
              className="bg-ink-1 border border-ink-3 rounded-2xl p-4 shadow-card flex items-center gap-4"
            >
              <div className="flex-shrink-0 text-center">
                <p className="text-[10px] uppercase tracking-widest text-fg-3">Tee</p>
                <p className="text-2xl font-bold font-mono tabular-nums leading-tight">{m.teeTime}</p>
                {isLive ? (
                  <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-semibold text-emerald-600">
                    <span className="relative inline-flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                    LIVE
                  </span>
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-fg-3">
                  R{m.roundNumber} · {m.roundLabel}
                </p>
                {mySide ? (
                  <p className="text-sm font-semibold mt-0.5 truncate" style={{ color: mySide.color }}>
                    {mySide.players.join(' & ')}
                  </p>
                ) : null}
                <p className="text-xs text-fg-3 mt-0.5 truncate">
                  vs {opponent.players.join(' & ')} ({opponent.name})
                </p>
              </div>
              <Link
                href={`/live/${m.matchId}`}
                className="bg-masters text-white text-xs font-semibold rounded-full px-3 py-2 whitespace-nowrap tap-highlight-none active:scale-95 transition"
              >
                Enter
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

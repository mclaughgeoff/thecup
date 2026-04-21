'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface MyMatch {
  matchId: string;
  roundLabel: string;
  teeTime: string;
  roundDate: string;
}

interface Resp {
  matches: MyMatch[];
}

/** Parse "8:15 AM" → minutes-since-start-of-day. Returns null if unparseable. */
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

/** Minutes until the given match's tee time today. Negative if already passed. Null if unparseable. */
function minutesUntil(match: MyMatch, now: Date): number | null {
  const mins = parseClockToMinutes(match.teeTime);
  if (mins == null) return null;
  const nowMins = now.getHours() * 60 + now.getMinutes();
  return mins - nowMins;
}

export default function DashboardLiveBanner() {
  const [matches, setMatches] = useState<MyMatch[] | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await fetch('/api/players/my-matches-today', { cache: 'no-store' });
      if (!r.ok) return;
      const j = (await r.json()) as Resp;
      if (!cancelled) setMatches(j.matches);
    })();
    const int = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => { cancelled = true; clearInterval(int); };
  }, []);

  if (!matches || matches.length === 0) return null;

  const now = new Date();
  void tick; // ensure re-renders pick up time changes
  // Pick the match whose tee time is in [-240 min, +90 min] with the largest (most recent/soonest) window.
  let best: { m: MyMatch; dMin: number } | null = null;
  for (const m of matches) {
    const d = minutesUntil(m, now);
    if (d == null) continue;
    if (d > 90) continue; // too far out
    if (d < -240) continue; // more than 4 hours past
    if (!best || Math.abs(d) < Math.abs(best.dMin)) best = { m, dMin: d };
  }
  if (!best) return null;

  const { m, dMin } = best;
  const isLive = dMin <= 0;
  const label = isLive ? 'LIVE NOW' : `TEE TIME IN ${dMin} MIN`;

  return (
    <section className="px-4 pt-4">
      <Link
        href={`/live/${m.matchId}`}
        className="block rounded-2xl overflow-hidden bg-cream-light border border-masters/20 shadow-card tap-highlight-none active:scale-[0.99] transition hover:border-masters/40"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-[0.14em] uppercase ${
                isLive
                  ? 'bg-lighthouse text-white'
                  : 'bg-masters/10 text-masters-glow'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isLive ? 'bg-white animate-pulse-dot' : 'bg-masters-glow'
                }`}
              />
              {label}
            </span>
            <p className="text-sm font-semibold text-fg-1 truncate">
              {m.roundLabel} · {m.teeTime}
            </p>
          </div>
          <span className="bg-masters text-cream rounded-full px-3.5 py-1.5 font-semibold text-xs whitespace-nowrap shadow-sm">
            Enter live →
          </span>
        </div>
      </Link>
    </section>
  );
}

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
        className="block rounded-2xl overflow-hidden bg-gradient-to-r from-masters to-masters-glow text-white shadow-hero tap-highlight-none active:scale-[0.99] transition"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-white/80 opacity-60 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90">
                {label}
              </span>
            </div>
            <p className="text-sm font-semibold mt-1 truncate">
              {m.roundLabel} · {m.teeTime}
            </p>
          </div>
          <span className="bg-white/15 rounded-full px-4 py-2 font-semibold text-sm whitespace-nowrap">
            Enter live →
          </span>
        </div>
      </Link>
    </section>
  );
}

'use client';

import { useState, type ReactNode } from 'react';
import clsx from 'clsx';
import SectionCard from './SectionCard';
import { ChevronDownIcon } from './icons';
import { fmtPts } from '@/lib/utils';

export type SessionStatus = 'final' | 'live' | 'upcoming';

interface SessionLeaderboardCardProps {
  roundNumber: number;
  dayOfWeek: string;
  course: string;
  /** Session format label, e.g. "Four-Ball". */
  format: string;
  status: SessionStatus;
  /** Null = no points awarded yet (upcoming). */
  sessionPointsA: number | null;
  sessionPointsB: number | null;
  /** Running Cup total through this session (inclusive). */
  cumulativeA: number;
  cumulativeB: number;
  teamAColor: string;
  teamBColor: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

const STATUS_LABEL: Record<SessionStatus, string> = {
  final: 'Final',
  live: 'Live',
  upcoming: 'Upcoming',
};

export default function SessionLeaderboardCard({
  roundNumber,
  dayOfWeek,
  course,
  format,
  status,
  sessionPointsA,
  sessionPointsB,
  cumulativeA,
  cumulativeB,
  teamAColor,
  teamBColor,
  defaultOpen = false,
  children,
}: SessionLeaderboardCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = `session-${roundNumber}-body`;

  const hasPoints = sessionPointsA != null && sessionPointsB != null;

  return (
    <SectionCard
      as="section"
      tone={status === 'live' ? 'masters' : 'default'}
      className={clsx(
        '!p-0 overflow-hidden',
        status === 'live' && 'border-l-4 border-l-masters',
        status === 'upcoming' && 'border-dashed bg-cream-light/40',
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left p-4 tap-highlight-none active:bg-ink-2/40 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-widest text-fg-3">
              Round {roundNumber} · {dayOfWeek}
            </p>
            <h2 className="text-base font-semibold mt-0.5 truncate">{course}</h2>
            <p className="text-xs text-fg-3 mt-0.5">{format}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span
              className={clsx(
                'pill',
                status === 'final' && 'border-ink-3 text-fg-2',
                status === 'live' && 'border-masters/60 text-masters-glow bg-masters/5',
                status === 'upcoming' && 'border-ink-3 text-fg-3',
              )}
            >
              {STATUS_LABEL[status]}
            </span>
            <ChevronDownIcon
              size={18}
              className={clsx('text-fg-3 transition-transform duration-200', open && 'rotate-180')}
            />
          </div>
        </div>

        {/* Session score + running total */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-ink-2 border border-ink-3 p-2">
            <p className="text-[9px] uppercase tracking-widest text-fg-3">Session</p>
            <div className="flex items-baseline justify-between mt-1 gap-2">
              <span
                className="text-lg font-bold font-mono tabular-nums"
                style={{ color: teamAColor }}
              >
                {hasPoints ? fmtPts(sessionPointsA as number) : '—'}
              </span>
              <span className="text-fg-3 text-xs">–</span>
              <span
                className="text-lg font-bold font-mono tabular-nums"
                style={{ color: teamBColor }}
              >
                {hasPoints ? fmtPts(sessionPointsB as number) : '—'}
              </span>
            </div>
          </div>
          <div className="rounded-xl bg-ink-2 border border-ink-3 p-2">
            <p className="text-[9px] uppercase tracking-widest text-fg-3">Cup total</p>
            <div className="flex items-baseline justify-between mt-1 gap-2">
              <span
                className="text-lg font-bold font-mono tabular-nums"
                style={{ color: teamAColor }}
              >
                {fmtPts(cumulativeA)}
              </span>
              <span className="text-fg-3 text-xs">–</span>
              <span
                className="text-lg font-bold font-mono tabular-nums"
                style={{ color: teamBColor }}
              >
                {fmtPts(cumulativeB)}
              </span>
            </div>
          </div>
        </div>
      </button>

      {open ? (
        <div id={bodyId} className="px-4 pb-4 pt-1 border-t border-ink-3/50">
          {children}
        </div>
      ) : null}
    </SectionCard>
  );
}

'use client';

import { useState, type ReactNode } from 'react';
import clsx from 'clsx';
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

  // Winner determination for completed sessions colors the left accent bar.
  const winner: 'A' | 'B' | 'draw' | null =
    status === 'final' && hasPoints
      ? sessionPointsA! > sessionPointsB!
        ? 'A'
        : sessionPointsB! > sessionPointsA!
          ? 'B'
          : 'draw'
      : null;

  const accentColor =
    status === 'live'
      ? '#10B981' // live-500
      : status === 'upcoming'
        ? '#D1D5DB' // ink-3
        : winner === 'A'
          ? teamAColor
          : winner === 'B'
            ? teamBColor
            : '#9CA3AF'; // draw / fg-3

  return (
    <section
      className={clsx(
        'relative bg-white rounded-[14px] border border-ink-3 overflow-hidden transition-all duration-200',
        status === 'live' && 'shadow-elev',
        status === 'upcoming' && 'opacity-90',
        status !== 'upcoming' && 'shadow-card',
      )}
    >
      {/* Colored left accent bar */}
      <span
        aria-hidden="true"
        className={clsx(
          'absolute left-0 top-0 bottom-0 w-1.5',
          status === 'live' && 'animate-live-glow',
        )}
        style={{ backgroundColor: accentColor }}
      />

      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left pl-5 pr-4 py-4 tap-highlight-none active:bg-ink-2/40 transition-colors"
      >
        {/* Top row: round chip + title + status pill */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="inline-block text-[10px] font-semibold uppercase tracking-widest bg-ink-2 text-fg-2 px-2 py-0.5 rounded-full">
              Round {roundNumber} · {dayOfWeek}
            </span>
            <h2
              className={clsx(
                'text-[20px] leading-tight font-bold mt-2 truncate',
                status === 'upcoming' ? 'text-fg-2' : 'text-fg-1',
              )}
            >
              {course}
            </h2>
            <p
              className={clsx(
                'text-[13px] font-medium mt-0.5 truncate',
                status === 'upcoming' ? 'text-fg-3/80' : 'text-fg-3',
              )}
            >
              {format}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <StatusPill status={status} label={STATUS_LABEL[status]} />
            <ChevronDownIcon
              size={18}
              className={clsx('text-fg-3 transition-transform duration-200', open && 'rotate-180')}
            />
          </div>
        </div>

        {/* Single horizontal score strip: red — VS — blue, with Cup total underneath */}
        <div className="mt-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <ScoreSide
              value={hasPoints ? sessionPointsA! : null}
              color={teamAColor}
              align="right"
              dim={status === 'upcoming'}
            />
            <span className="text-fg-3 text-[11px] font-semibold tracking-widest uppercase">
              vs
            </span>
            <ScoreSide
              value={hasPoints ? sessionPointsB! : null}
              color={teamBColor}
              align="left"
              dim={status === 'upcoming'}
            />
          </div>
          <p
            className={clsx(
              'text-center mt-1.5 text-[11px] font-medium uppercase tracking-widest',
              status === 'upcoming' ? 'text-fg-3/70' : 'text-fg-3',
            )}
          >
            Cup{' '}
            <span className="font-mono tabular-nums" style={{ color: teamAColor }}>
              {fmtPts(cumulativeA)}
            </span>
            <span className="text-fg-3"> – </span>
            <span className="font-mono tabular-nums" style={{ color: teamBColor }}>
              {fmtPts(cumulativeB)}
            </span>
          </p>
        </div>
      </button>

      {open ? (
        <div
          id={bodyId}
          className="pl-5 pr-4 pb-4 pt-1 border-t border-ink-3/60 animate-fade-in"
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}

function StatusPill({ status, label }: { status: SessionStatus; label: string }) {
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-live-50 text-live-600 border border-live-200">
        <span className="relative flex h-2 w-2">
          <span className="absolute inset-0 rounded-full bg-live-500 animate-pulse-dot" />
          <span className="relative h-2 w-2 rounded-full bg-live-500" />
        </span>
        {label}
      </span>
    );
  }
  if (status === 'upcoming') {
    return (
      <span className="inline-flex items-center text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-ink-2 text-fg-3 border border-ink-3">
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-fg-1 text-white">
      {label}
    </span>
  );
}

function ScoreSide({
  value,
  color,
  align,
  dim,
}: {
  value: number | null;
  color: string;
  align: 'left' | 'right';
  dim?: boolean;
}) {
  if (value == null) {
    return (
      <div className={align === 'right' ? 'text-right' : 'text-left'}>
        <span
          aria-hidden="true"
          className={clsx(
            'inline-block h-1 w-8 rounded-full',
            dim ? 'bg-ink-3/60' : 'bg-ink-3',
          )}
        />
      </div>
    );
  }
  return (
    <div className={align === 'right' ? 'text-right' : 'text-left'}>
      <span
        className="text-[28px] font-bold font-mono tabular-nums leading-none"
        style={{ color }}
      >
        {fmtPts(value)}
      </span>
    </div>
  );
}

'use client';

import { useState, type ReactNode } from 'react';
import clsx from 'clsx';
import SectionCard from './SectionCard';
import { ChevronDownIcon } from './icons';

interface RoundScheduleCardProps {
  anchorId: string;
  roundNumber: number;
  dayOfWeek: string;
  course: string;
  teeTime: string;
  isRyderCup: boolean;
  playing: number;
  totalPlayers: number;
  defaultOpen?: boolean;
  /** Expanded body — tee slots / matchups. */
  children: ReactNode;
}

export default function RoundScheduleCard({
  anchorId,
  roundNumber,
  dayOfWeek,
  course,
  teeTime,
  isRyderCup,
  playing,
  totalPlayers,
  defaultOpen = false,
  children,
}: RoundScheduleCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const isShort = playing < totalPlayers;
  const bodyId = `${anchorId}-body`;

  return (
    <SectionCard
      id={anchorId}
      as="section"
      tone={isRyderCup ? 'masters' : 'default'}
      className={clsx(
        'scroll-mt-32 !p-0 overflow-hidden',
        isRyderCup
          ? 'border-l-4 border-l-masters'
          : 'border-dashed bg-cream-light/40',
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
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-widest text-fg-3">
              Round {roundNumber} · {dayOfWeek}
            </p>
            <h2 className="text-lg font-semibold mt-0.5 truncate">{course}</h2>
            <p className="text-sm text-fg-2 mt-0.5">{teeTime}</p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span
              className={`pill ${
                isRyderCup
                  ? 'border-masters/60 text-masters-glow bg-masters/5'
                  : 'border-ink-3 text-fg-3 bg-transparent'
              }`}
            >
              {isRyderCup ? 'Ryder Cup' : 'Logistics'}
            </span>
            <ChevronDownIcon
              size={20}
              className={clsx(
                'text-fg-3 transition-transform duration-200',
                open && 'rotate-180',
              )}
            />
          </div>
        </div>

        <div className="flex items-center justify-end mt-3 gap-2">
          <span
            className={`pill shrink-0 ${
              isShort ? 'border-danger/40 text-danger' : 'border-ink-3 text-fg-2'
            }`}
          >
            {playing}/{totalPlayers} playing
          </span>
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

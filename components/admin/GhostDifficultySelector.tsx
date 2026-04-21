'use client';

import type { GhostDifficulty } from '@/lib/scoring';

interface Props {
  value: GhostDifficulty;
  disabled?: boolean;
  onChange: (next: GhostDifficulty) => void;
}

const OPTIONS: Array<{
  value: GhostDifficulty;
  label: string;
  sub: string;
}> = [
  { value: 'AUTO',     label: 'Auto (handicap-scaled)', sub: 'Net par for low handicaps, net bogey for high handicaps' },
  { value: 'EASY',     label: 'Easy',                    sub: 'Net par everywhere' },
  { value: 'STANDARD', label: 'Standard',                sub: 'Net bogey everywhere' },
  { value: 'TOUGH',    label: 'Tough',                   sub: 'Net double bogey everywhere' },
];

export default function GhostDifficultySelector({ value, disabled, onChange }: Props) {
  return (
    <div className="space-y-2">
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <label
            key={opt.value}
            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
              active ? 'border-masters bg-masters/5' : 'border-ink-3 bg-white hover:bg-ink-2'
            } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input
              type="radio"
              name="ghost-difficulty"
              className="mt-0.5 accent-masters"
              checked={active}
              onChange={() => onChange(opt.value)}
              disabled={disabled}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-fg-1">{opt.label}</p>
              <p className="text-xs text-fg-3 mt-0.5">{opt.sub}</p>
            </div>
          </label>
        );
      })}
    </div>
  );
}

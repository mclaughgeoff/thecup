'use client';

import type { AbsenceSource } from '@/lib/scoring';

export type AbsentState =
  | { kind: 'auto'; inferredAbsent: boolean }
  | { kind: 'force-absent' }
  | { kind: 'force-present' };

interface Props {
  name: string;
  absentOverride: boolean | null;
  resolvedAbsent: boolean;
  source: AbsenceSource;
  disabled?: boolean;
  onChange: (next: boolean | null) => void;
}

/**
 * Three-state segmented control for a single MatchPlayer:
 *   Auto | Force Absent | Force Present
 * Shows a resolved-state badge next to the name so the admin
 * sees both the current control position *and* what it resolves to.
 */
export default function AbsentPlayerToggle({
  name,
  absentOverride,
  resolvedAbsent,
  source,
  disabled,
  onChange,
}: Props) {
  const current: 'auto' | 'absent' | 'present' =
    absentOverride === true ? 'absent' : absentOverride === false ? 'present' : 'auto';

  const badge = (() => {
    if (!resolvedAbsent && source === 'DEFAULT') {
      return (
        <span className="pill border-ink-3 bg-ink-2 text-fg-2">
          ● Present
        </span>
      );
    }
    if (resolvedAbsent && source === 'AVAILABILITY') {
      return (
        <span className="pill border-warning/30 bg-warning/10 text-warning">
          ○ Absent · from availability
        </span>
      );
    }
    if (resolvedAbsent && source === 'OVERRIDE') {
      return (
        <span className="pill border-danger/30 bg-danger/10 text-danger">
          ● Absent · admin
        </span>
      );
    }
    if (!resolvedAbsent && source === 'OVERRIDE') {
      return (
        <span className="pill border-masters/30 bg-masters/10 text-masters">
          ● Present · admin
        </span>
      );
    }
    return null;
  })();

  const Btn = ({
    state,
    label,
    value,
  }: {
    state: 'auto' | 'absent' | 'present';
    label: string;
    value: boolean | null;
  }) => {
    const active = current === state;
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(value)}
        className={`flex-1 text-[11px] font-semibold py-1.5 px-2 transition ${
          active
            ? 'bg-masters text-white'
            : 'bg-white text-fg-2 hover:bg-ink-2'
        } disabled:opacity-50 disabled:pointer-events-none`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-fg-1 truncate">{name}</p>
        <div className="mt-1">{badge}</div>
      </div>
      <div className="inline-flex rounded-lg border border-ink-3 overflow-hidden shrink-0">
        <Btn state="auto" label="Auto" value={null} />
        <div className="w-px bg-ink-3" />
        <Btn state="absent" label="Absent" value={true} />
        <div className="w-px bg-ink-3" />
        <Btn state="present" label="Present" value={false} />
      </div>
    </div>
  );
}

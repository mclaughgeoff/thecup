interface Props {
  teamA: { name: string; color: string };
  teamB: { name: string; color: string };
  pointsA: number;
  pointsB: number;
  label: string | null;
  note: string | null;
  overriddenBy: { name: string } | null;
  overriddenAt: Date | null;
}

function formatAt(d: Date | null): string | null {
  if (!d) return null;
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(d);
  } catch {
    return null;
  }
}

/**
 * Player-facing override result card — replaces the scorecard grid when an
 * admin has called the match. No hole-by-hole view, no live scoring; just the
 * declared result, a label, and the admin's note.
 */
export default function OverrideResultCard({
  teamA,
  teamB,
  pointsA,
  pointsB,
  label,
  note,
  overriddenBy,
  overriddenAt,
}: Props) {
  const sig = [overriddenBy?.name, formatAt(overriddenAt)].filter(Boolean).join(' · ');
  return (
    <section className="px-4 pt-4">
      <div className="card-elevated text-center">
        <p className="text-[10px] uppercase tracking-widest text-fg-3 mb-3">
          Admin call
        </p>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: teamA.color }}>
              {teamA.name}
            </p>
            <p className="text-4xl font-bold tabular-nums mt-1">{pointsA}</p>
          </div>
          <span className="text-fg-3 font-light">—</span>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: teamB.color }}>
              {teamB.name}
            </p>
            <p className="text-4xl font-bold tabular-nums mt-1">{pointsB}</p>
          </div>
        </div>
        {label ? (
          <p className="mt-4 text-sm font-semibold text-fg-1">{label}</p>
        ) : null}
        {note ? (
          <div className="mt-3 p-3 rounded-xl bg-ink-2 border border-ink-3 text-sm text-fg-2 text-left">
            {note}
            {sig ? (
              <p className="mt-2 text-[11px] text-fg-3">— {sig}</p>
            ) : null}
          </div>
        ) : sig ? (
          <p className="mt-3 text-[11px] text-fg-3">— {sig}</p>
        ) : null}
      </div>
    </section>
  );
}

import clsx from 'clsx';

interface Player {
  name: string;
  absent?: boolean;
}

interface MatchLeaderboardRowProps {
  matchNumber: number;
  teeTime?: string | null;
  formatLabel?: string | null;
  sideA: { label: string; color: string; players: Player[] };
  sideB: { label: string; color: string; players: Player[] };
  pointsA: number | null;
  pointsB: number | null;
  /** When true, match has final points (or override). Loser side will dim. */
  final: boolean;
  /** Short status label, e.g. "3&2", "AS", "7 UP thru 12", "Upcoming". */
  statusLabel?: string | null;
  /** Match-play live leader: positive = A is up, negative = B is up, 0 = AS. */
  upBy?: number | null;
}

/** Append an alpha channel to a hex color. e.g. tint('#C41E3A', 0.08) → "#C41E3A14" */
function tint(hex: string, alpha: number): string {
  const a = Math.max(0, Math.min(255, Math.round(alpha * 255)));
  const aHex = a.toString(16).padStart(2, '0');
  return `${hex}${aHex}`;
}

function PlayerList({ players, align }: { players: Player[]; align: 'left' | 'right' }) {
  if (players.length === 0) return <span className="text-[13px] text-fg-3 italic">—</span>;
  return (
    <p className={clsx('text-[15px] font-medium text-fg-1 truncate', align === 'right' && 'text-right')}>
      {players.map((p, i) => (
        <span key={i}>
          {i > 0 ? <span className="text-fg-3"> &middot; </span> : null}
          {p.absent ? <span className="text-fg-3">👻 {p.name}</span> : p.name}
        </span>
      ))}
    </p>
  );
}

/**
 * Status chip color follows the leader: red if Alpha leads, blue if Bravo leads,
 * neutral gray for All Square / Upcoming. Sits *above* the VS pill so it's the
 * first thing the eye lands on per row.
 */
function StatusChip({
  label,
  pointsA,
  pointsB,
  upBy,
  colorA,
  colorB,
}: {
  label: string;
  pointsA: number | null;
  pointsB: number | null;
  upBy: number | null | undefined;
  colorA: string;
  colorB: string;
}) {
  // Final result wins → use points to color. Otherwise use upBy from live state.
  let leader: 'A' | 'B' | 'draw' = 'draw';
  if (pointsA != null && pointsB != null) {
    if (pointsA > pointsB) leader = 'A';
    else if (pointsB > pointsA) leader = 'B';
  } else if (upBy != null) {
    if (upBy > 0) leader = 'A';
    else if (upBy < 0) leader = 'B';
  }

  const color = leader === 'A' ? colorA : leader === 'B' ? colorB : null;

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[13px] font-semibold uppercase tracking-wider whitespace-nowrap',
        color ? 'text-white' : 'bg-draw-50 text-draw-500 border border-draw-200',
      )}
      style={color ? { backgroundColor: color } : undefined}
    >
      {label}
    </span>
  );
}

export default function MatchLeaderboardRow({
  matchNumber,
  teeTime,
  formatLabel,
  sideA,
  sideB,
  pointsA,
  pointsB,
  final,
  statusLabel,
  upBy,
}: MatchLeaderboardRowProps) {
  const aDim = final && pointsA != null && pointsB != null && pointsA < pointsB;
  const bDim = final && pointsA != null && pointsB != null && pointsB < pointsA;

  const bgA = tint(sideA.color, 0.08);
  const bgB = tint(sideB.color, 0.08);

  return (
    <div className="rounded-[10px] overflow-hidden border border-ink-3 bg-white">
      {/* Header strip */}
      <div className="px-3 py-1.5 bg-ink-2/60 border-b border-ink-3 flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-wider text-fg-3 truncate">
          <span className="font-semibold text-fg-2">Match {matchNumber}</span>
          {teeTime ? (
            <>
              <span className="text-fg-3"> · </span>
              <span className="font-mono">{teeTime}</span>
            </>
          ) : null}
          {formatLabel ? (
            <>
              <span className="text-fg-3"> · </span>
              <span className="text-masters-glow font-semibold">{formatLabel}</span>
            </>
          ) : null}
        </p>
        {statusLabel ? (
          <StatusChip
            label={statusLabel}
            pointsA={pointsA}
            pointsB={pointsB}
            upBy={upBy}
            colorA={sideA.color}
            colorB={sideB.color}
          />
        ) : null}
      </div>

      {/* Body — split into red half / VS center / blue half */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch">
        <div
          className={clsx('px-3 py-2.5 transition-opacity', aDim && 'opacity-55')}
          style={{ backgroundColor: bgA }}
        >
          <p
            className="text-[11px] uppercase tracking-wider font-semibold truncate mb-0.5"
            style={{ color: sideA.color }}
          >
            {sideA.label}
          </p>
          <PlayerList players={sideA.players} align="left" />
        </div>

        <div className="px-2 flex items-center justify-center bg-white border-x border-ink-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-fg-3 px-2 py-0.5 rounded-full bg-ink-2 border border-ink-3">
            vs
          </span>
        </div>

        <div
          className={clsx(
            'px-3 py-2.5 text-right transition-opacity',
            bDim && 'opacity-55',
          )}
          style={{ backgroundColor: bgB }}
        >
          <p
            className="text-[11px] uppercase tracking-wider font-semibold truncate mb-0.5"
            style={{ color: sideB.color }}
          >
            {sideB.label}
          </p>
          <PlayerList players={sideB.players} align="right" />
        </div>
      </div>
    </div>
  );
}

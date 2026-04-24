import clsx from 'clsx';
import { fmtPts } from '@/lib/utils';

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
}

function PtsChip({ value, color, dim }: { value: number | null; color: string; dim?: boolean }) {
  const isZero = value === 0;
  const isWinner = value != null && value > 0.5;
  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center min-w-[36px] px-2 py-0.5 rounded-full text-xs font-bold tabular-nums',
        value == null && 'bg-ink-2 text-fg-3',
        isZero && 'bg-ink-2 text-fg-3',
        value === 0.5 && 'bg-ink-2 border border-ink-3 text-fg-1',
        isWinner && 'text-white',
        dim && 'opacity-55',
      )}
      style={isWinner ? { backgroundColor: color } : undefined}
    >
      {value == null ? '—' : fmtPts(value)}
    </span>
  );
}

function PlayerList({ players }: { players: Player[] }) {
  if (players.length === 0) return <span className="text-xs text-fg-3 italic">—</span>;
  return (
    <span className="text-sm truncate">
      {players.map((p, i) => (
        <span key={i}>
          {i > 0 ? <span className="text-fg-3"> &middot; </span> : null}
          {p.absent ? <span className="text-fg-3">👻 {p.name}</span> : p.name}
        </span>
      ))}
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
}: MatchLeaderboardRowProps) {
  const aDim = final && pointsA != null && pointsB != null && pointsA < pointsB;
  const bDim = final && pointsA != null && pointsB != null && pointsB < pointsA;

  return (
    <div className="bg-ink-2 border border-ink-3 rounded-xl p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 text-[10px] uppercase tracking-wider text-fg-3">
          <span className="shrink-0">Match {matchNumber}</span>
          {teeTime ? <span className="shrink-0 font-mono">· {teeTime}</span> : null}
          {formatLabel ? (
            <span className="shrink-0 text-masters-glow">· {formatLabel}</span>
          ) : null}
        </div>
        {statusLabel ? (
          <span
            className={clsx(
              'text-[10px] font-semibold rounded-full px-2 py-0.5 shrink-0',
              final ? 'bg-masters/10 text-masters' : 'bg-ink-1 text-fg-2',
            )}
          >
            {statusLabel}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto_minmax(0,1fr)] items-center gap-2">
        {/* side A */}
        <div className={clsx('min-w-0', aDim && 'opacity-55')}>
          <p
            className="text-[10px] uppercase tracking-wider font-semibold truncate"
            style={{ color: sideA.color }}
          >
            {sideA.label}
          </p>
          <PlayerList players={sideA.players} />
        </div>
        <PtsChip value={pointsA} color={sideA.color} dim={aDim} />
        <span className="text-fg-3 text-[10px]">vs</span>
        <PtsChip value={pointsB} color={sideB.color} dim={bDim} />
        {/* side B */}
        <div className={clsx('min-w-0 text-right', bDim && 'opacity-55')}>
          <p
            className="text-[10px] uppercase tracking-wider font-semibold truncate"
            style={{ color: sideB.color }}
          >
            {sideB.label}
          </p>
          <PlayerList players={sideB.players} />
        </div>
      </div>
    </div>
  );
}

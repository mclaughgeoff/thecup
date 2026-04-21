import clsx from 'clsx';
import PlayerAvatar from './PlayerAvatar';
import FormatBadge from './FormatBadge';

export interface MatchupPlayer {
  playerId: string;
  name: string;
  handicap: number;
  photoUrl: string | null;
  side: 'A' | 'B';
}

export interface MatchupTeam {
  name: string;
  color: string | null | undefined;
}

export interface MatchupCardProps {
  matchNumber: number;
  teeTime?: string | null;
  players: MatchupPlayer[];
  teamA: MatchupTeam;
  teamB: MatchupTeam;
  /** Format scoring entry mode: "per_side" joins teammates; "per_player" splits into 1v1 pairings */
  strokeEntryMode?: 'per_side' | 'per_player' | string | null;
  /** Optional format label (e.g. "Four-Ball"); renders as a colored pill in the header. */
  format?: string | null;
  /** Optional format slug — overrides `format` for color lookup. */
  formatSlug?: string | null;
  status?: { label: string; emphasized?: boolean } | null;
  /**
   * When set, indicates match result: winning side gets a filled green pill,
   * losing side dims to ~55% opacity. "halved" = tied ("AS").
   */
  result?: 'A' | 'B' | 'halved' | null;
  /** Result label shown in the center column (e.g. "2&1", "3&2", "AS"). */
  resultLabel?: string | null;
  footer?: React.ReactNode;
}

function PlayerTile({ player, align = 'left' }: { player: MatchupPlayer; align?: 'left' | 'right' }) {
  return (
    <div className={clsx('flex items-center gap-2 min-w-0', align === 'right' && 'flex-row-reverse')}>
      <PlayerAvatar name={player.name} photoUrl={player.photoUrl} size="sm" />
      <div className={clsx('min-w-0', align === 'right' && 'text-right')}>
        <p className="text-sm font-medium truncate">{player.name}</p>
        <p className="text-[10px] text-fg-3 tabular-nums">HCP {player.handicap}</p>
      </div>
    </div>
  );
}

function TeamHeader({
  team,
  color,
  align = 'left',
}: {
  team: MatchupTeam;
  color?: string;
  align?: 'left' | 'right';
}) {
  return (
    <p
      className={`text-[10px] uppercase tracking-wider font-semibold ${align === 'right' ? 'text-right' : ''}`}
      style={color ? { color } : undefined}
    >
      {team.name}
    </p>
  );
}

/** Colored vertical bar marking a team's side of the matchup. */
function TeamBar({ color, align }: { color?: string; align: 'left' | 'right' }) {
  return (
    <div
      className={clsx('w-1 rounded-full self-stretch min-h-[36px]', align === 'left' ? '-ml-1 mr-2' : '-mr-1 ml-2')}
      style={{ backgroundColor: color ?? '#9CA3AF' }}
      aria-hidden="true"
    />
  );
}

export default function MatchupCard({
  matchNumber,
  teeTime,
  players,
  teamA,
  teamB,
  strokeEntryMode,
  format,
  formatSlug,
  status,
  result,
  resultLabel,
  footer,
}: MatchupCardProps) {
  const sideA = players.filter((p) => p.side === 'A');
  const sideB = players.filter((p) => p.side === 'B');
  const perPlayer = strokeEntryMode === 'per_player';
  const colorA = teamA.color ?? '#C41E3A';
  const colorB = teamB.color ?? '#003DA5';
  const hasResult = result != null;
  const aLost = result === 'B';
  const bLost = result === 'A';

  return (
    <div className="bg-ink-2 border border-ink-3 rounded-xl p-3">
      {/* Header row: match number + tee time + format badge + status */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] uppercase tracking-wider text-fg-3 shrink-0">
            Match {matchNumber}
          </span>
          {teeTime ? (
            <span className="text-[10px] font-mono text-fg-3 shrink-0">· {teeTime}</span>
          ) : null}
          {format || formatSlug ? (
            <FormatBadge format={format} slug={formatSlug} size="xs" className="ml-1" />
          ) : null}
        </div>
        {status ? (
          <span
            className={`pill shrink-0 ${status.emphasized ? 'border-masters/60 text-masters-glow bg-masters/5' : 'border-ink-3'}`}
          >
            {status.label}
          </span>
        ) : null}
      </div>

      {/* Team headers */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 mb-2">
        <TeamHeader team={teamA} color={colorA} />
        <span />
        <TeamHeader team={teamB} color={colorB} align="right" />
      </div>

      {perPlayer ? (
        // Per-player: for each ordinal position, show sideA[i] vs sideB[i] as its own row.
        <div className="space-y-2">
          {Array.from({ length: Math.max(sideA.length, sideB.length) }).map((_, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-3">
              <div className={clsx('flex items-center', aLost && 'opacity-55')}>
                <TeamBar color={colorA} align="left" />
                {sideA[i] ? <PlayerTile player={sideA[i]} /> : <p className="text-xs text-fg-3 italic">—</p>}
              </div>
              <span className="text-fg-3 text-xs self-center">vs</span>
              <div className={clsx('flex items-center justify-end', bLost && 'opacity-55')}>
                {sideB[i] ? <PlayerTile player={sideB[i]} align="right" /> : <p className="text-xs text-fg-3 italic">—</p>}
                <TeamBar color={colorB} align="right" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Per-side: teammates listed together, one "vs" (or result pill) for the whole match.
        <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-3">
          <div className={clsx('flex items-start', aLost && 'opacity-55')}>
            <TeamBar color={colorA} align="left" />
            <div className="space-y-1.5 min-w-0 flex-1">
              {sideA.length === 0 ? (
                <p className="text-xs text-fg-3 italic">—</p>
              ) : (
                sideA.map((p) => <PlayerTile key={p.playerId} player={p} />)
              )}
            </div>
          </div>
          <div className="self-center">
            {hasResult && resultLabel ? (
              <span
                className={clsx(
                  'inline-flex items-center font-bold text-xs px-2.5 py-1 rounded-md tabular-nums',
                  result === 'halved'
                    ? 'bg-ink-3 text-fg-1'
                    : 'bg-masters text-white',
                )}
              >
                {resultLabel}
              </span>
            ) : (
              <span className="text-fg-3 text-xs">vs</span>
            )}
          </div>
          <div className={clsx('flex items-start justify-end', bLost && 'opacity-55')}>
            <div className="space-y-1.5 min-w-0 flex-1 flex flex-col items-end">
              {sideB.length === 0 ? (
                <p className="text-xs text-fg-3 italic text-right">—</p>
              ) : (
                sideB.map((p) => <PlayerTile key={p.playerId} player={p} align="right" />)
              )}
            </div>
            <TeamBar color={colorB} align="right" />
          </div>
        </div>
      )}

      {footer ? <div className="mt-2">{footer}</div> : null}
    </div>
  );
}

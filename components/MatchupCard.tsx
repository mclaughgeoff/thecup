import PlayerAvatar from './PlayerAvatar';

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
  status?: { label: string; emphasized?: boolean } | null;
  footer?: React.ReactNode;
}

function PlayerTile({ player }: { player: MatchupPlayer }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <PlayerAvatar name={player.name} photoUrl={player.photoUrl} size="sm" />
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{player.name}</p>
        <p className="text-[10px] text-fg-3 tabular-nums">HCP {player.handicap}</p>
      </div>
    </div>
  );
}

function TeamHeader({ team, color, align = 'left' }: { team: MatchupTeam; color?: string; align?: 'left' | 'right' }) {
  return (
    <p
      className={`text-[10px] uppercase tracking-wider font-semibold ${align === 'right' ? 'text-right' : ''}`}
      style={color ? { color } : undefined}
    >
      {team.name}
    </p>
  );
}

export default function MatchupCard({
  matchNumber,
  teeTime,
  players,
  teamA,
  teamB,
  strokeEntryMode,
  status,
  footer,
}: MatchupCardProps) {
  const sideA = players.filter((p) => p.side === 'A');
  const sideB = players.filter((p) => p.side === 'B');
  const perPlayer = strokeEntryMode === 'per_player';
  const colorA = teamA.color ?? undefined;
  const colorB = teamB.color ?? undefined;

  return (
    <div className="bg-ink-2 border border-ink-3 rounded-xl p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] uppercase tracking-wider text-fg-3">
            Match {matchNumber}
          </span>
          {teeTime ? (
            <span className="text-[10px] font-mono text-fg-3">· {teeTime}</span>
          ) : null}
        </div>
        {status ? (
          <span className={`pill ${status.emphasized ? 'border-masters/60 text-masters-glow' : 'border-ink-3'}`}>
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
            <div key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div>{sideA[i] ? <PlayerTile player={sideA[i]} /> : <p className="text-xs text-fg-3 italic">—</p>}</div>
              <span className="text-fg-3 text-xs">vs</span>
              <div>
                {sideB[i] ? <PlayerTile player={sideB[i]} /> : <p className="text-xs text-fg-3 italic">—</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Per-side: teammates listed together, one "vs" for the whole match.
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="space-y-1.5">
            {sideA.length === 0 ? (
              <p className="text-xs text-fg-3 italic">—</p>
            ) : (
              sideA.map((p) => <PlayerTile key={p.playerId} player={p} />)
            )}
          </div>
          <span className="text-fg-3 text-xs">vs</span>
          <div className="space-y-1.5">
            {sideB.length === 0 ? (
              <p className="text-xs text-fg-3 italic">—</p>
            ) : (
              sideB.map((p) => <PlayerTile key={p.playerId} player={p} />)
            )}
          </div>
        </div>
      )}

      {footer ? <div className="mt-2">{footer}</div> : null}
    </div>
  );
}

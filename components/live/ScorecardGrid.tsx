'use client';

import type { HoleInfo, MatchStateResp } from './HoleScoring';

interface Props {
  data: MatchStateResp;
  onCellTap: (hole: number) => void;
}

export default function ScorecardGrid({ data, onCellTap }: Props) {
  const holes = data.holes;
  const front = holes.slice(0, 9);
  const back = holes.slice(9);
  const teamA = data.match.teamA;
  const teamB = data.match.teamB;
  const colorA = teamA.color ?? '#C41E3A';
  const colorB = teamB.color ?? '#003DA5';

  const totalStableford =
    data.format.scoringType === 'stableford';

  return (
    <div className="px-4 pt-4 space-y-4">
      {front.length > 0 ? (
        <Nine
          label="Front 9"
          holes={front}
          data={data}
          onCellTap={onCellTap}
          colorA={colorA}
          colorB={colorB}
          teamAName={teamA.name}
          teamBName={teamB.name}
        />
      ) : null}
      {back.length > 0 ? (
        <Nine
          label="Back 9"
          holes={back}
          data={data}
          onCellTap={onCellTap}
          colorA={colorA}
          colorB={colorB}
          teamAName={teamA.name}
          teamBName={teamB.name}
        />
      ) : null}

      {/* Totals */}
      <div className="bg-ink-1 border border-ink-3 rounded-2xl p-4 shadow-card">
        <h3 className="text-[10px] uppercase tracking-widest text-fg-3 mb-2">Totals</h3>
        <div className="grid grid-cols-3 gap-2 text-sm font-mono tabular-nums">
          <div />
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-fg-3 font-sans">Gross</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-fg-3 font-sans">Net</p>
          </div>

          <div className="font-semibold" style={{ color: colorA }}>
            {teamA.name}
          </div>
          <div className="text-center">{totalNet(data, 'A', 'gross') || '—'}</div>
          <div className="text-center font-semibold">{totalNet(data, 'A', 'net') || '—'}</div>

          <div className="font-semibold" style={{ color: colorB }}>
            {teamB.name}
          </div>
          <div className="text-center">{totalNet(data, 'B', 'gross') || '—'}</div>
          <div className="text-center font-semibold">{totalNet(data, 'B', 'net') || '—'}</div>
        </div>

        {totalStableford ? (
          <div className="mt-3 pt-3 border-t border-ink-3 grid grid-cols-3 gap-2 text-sm font-mono tabular-nums">
            <div className="text-[10px] uppercase tracking-wider text-fg-3 font-sans">Stableford</div>
            <div className="text-center">{sumStableford(data, 'A')}</div>
            <div className="text-center">{sumStableford(data, 'B')}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Nine({
  label,
  holes,
  data,
  onCellTap,
  colorA,
  colorB,
  teamAName,
  teamBName,
}: {
  label: string;
  holes: HoleInfo[];
  data: MatchStateResp;
  onCellTap: (hole: number) => void;
  colorA: string;
  colorB: string;
  teamAName: string;
  teamBName: string;
}) {
  const perHoleMap = new Map(data.state.perHole.map((h) => [h.hole, h]));

  return (
    <div className="bg-ink-1 border border-ink-3 rounded-2xl p-3 shadow-card overflow-x-auto scrollbar-none">
      <p className="text-[10px] uppercase tracking-widest text-fg-3 mb-2">{label}</p>
      <table className="min-w-full text-xs">
        <thead>
          <tr className="text-fg-3">
            <th className="px-2 py-1.5 text-left font-sans font-semibold">Hole</th>
            {holes.map((h) => (
              <th key={h.holeNumber} className="px-2 py-1.5 font-mono tabular-nums">
                {h.holeNumber}
              </th>
            ))}
            <th className="px-2 py-1.5 font-sans">Tot</th>
          </tr>
          <tr className="text-fg-3">
            <th className="px-2 py-1 text-left font-sans">Par</th>
            {holes.map((h) => (
              <th key={h.holeNumber} className="px-2 py-1 font-mono tabular-nums">
                {h.par}
              </th>
            ))}
            <th className="px-2 py-1 font-mono tabular-nums">
              {holes.reduce((s, h) => s + h.par, 0)}
            </th>
          </tr>
          <tr className="text-fg-3">
            <th className="px-2 py-1 text-left font-sans">HCP</th>
            {holes.map((h) => (
              <th key={h.holeNumber} className="px-2 py-1 font-mono tabular-nums">
                {h.handicapIndex}
              </th>
            ))}
            <th />
          </tr>
        </thead>
        <tbody>
          <TeamRow
            color={colorA}
            name={teamAName}
            holes={holes}
            perHoleMap={perHoleMap}
            which="A"
            onCellTap={onCellTap}
          />
          <TeamRow
            color={colorB}
            name={teamBName}
            holes={holes}
            perHoleMap={perHoleMap}
            which="B"
            onCellTap={onCellTap}
          />
          {/* Per-hole match result */}
          <tr className="text-fg-3 border-t border-ink-3">
            <td className="px-2 py-1 text-left text-[10px] uppercase tracking-wider font-sans">
              Hole
            </td>
            {holes.map((h) => {
              const ph = perHoleMap.get(h.holeNumber);
              const a = ph?.netA;
              const b = ph?.netB;
              let marker = '—';
              let color = '';
              if (a != null && b != null) {
                if (a < b) { marker = 'A'; color = colorA; }
                else if (b < a) { marker = 'B'; color = colorB; }
                else { marker = '½'; }
              }
              return (
                <td key={h.holeNumber} className="px-2 py-1 text-center font-mono">
                  <span style={color ? { color } : {}}>{marker}</span>
                </td>
              );
            })}
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function TeamRow({
  color,
  name,
  holes,
  perHoleMap,
  which,
  onCellTap,
}: {
  color: string;
  name: string;
  holes: HoleInfo[];
  perHoleMap: Map<number, NonNullable<ReturnType<Map<number, never>['get']>> | { hole: number; grossA: number | null; grossB: number | null; netA: number | null; netB: number | null; strokesA: number; strokesB: number }>;
  which: 'A' | 'B';
  onCellTap: (hole: number) => void;
}) {
  let grossTot = 0;
  let netTot = 0;

  return (
    <tr className="border-t border-ink-3">
      <td
        className="px-2 py-1.5 text-left text-[11px] font-semibold whitespace-nowrap"
        style={{ color }}
      >
        {name}
      </td>
      {holes.map((h) => {
        const ph = perHoleMap.get(h.holeNumber) as
          | { grossA: number | null; grossB: number | null; netA: number | null; netB: number | null; strokesA: number; strokesB: number }
          | undefined;
        const gross = which === 'A' ? ph?.grossA : ph?.grossB;
        const net = which === 'A' ? ph?.netA : ph?.netB;
        const strokes = which === 'A' ? ph?.strokesA : ph?.strokesB;
        if (gross != null) grossTot += gross;
        if (net != null) netTot += net;
        const hasStroke = (strokes ?? 0) > 0;

        return (
          <td key={h.holeNumber} className="px-1.5 py-1.5 text-center align-middle">
            <button
              type="button"
              onClick={() => onCellTap(h.holeNumber)}
              className="inline-flex flex-col items-center leading-tight w-full min-h-[32px] rounded-md hover:bg-ink-2 active:bg-ink-3 transition tap-highlight-none"
            >
              {gross == null ? (
                <span className="text-fg-3 font-mono">—</span>
              ) : (
                <div className="relative inline-flex flex-col items-center leading-tight">
                  {hasStroke ? (
                    <span
                      className="absolute -top-1 -right-2 w-1.5 h-1.5 rounded-full bg-masters"
                      aria-label={`${strokes} stroke`}
                    />
                  ) : null}
                  <span className="font-mono tabular-nums font-semibold">{gross}</span>
                  <span className="text-[9px] text-fg-3 font-mono">{net}</span>
                </div>
              )}
            </button>
          </td>
        );
      })}
      <td className="px-2 py-1.5 text-center font-mono tabular-nums">
        <div className="leading-tight">
          <div className="font-semibold">{grossTot || '—'}</div>
          <div className="text-[9px] text-fg-3">{netTot || '—'}</div>
        </div>
      </td>
    </tr>
  );
}

function totalNet(data: MatchStateResp, side: 'A' | 'B', which: 'gross' | 'net'): number {
  let total = 0;
  for (const h of data.state.perHole) {
    const v = which === 'gross'
      ? (side === 'A' ? h.grossA : h.grossB)
      : (side === 'A' ? h.netA : h.netB);
    if (v != null) total += v;
  }
  return total;
}

function sumStableford(_data: MatchStateResp, _side: 'A' | 'B'): number {
  // Only the live match GET returns totals; stableford total not in this shape. We fall back to 0.
  return 0;
}

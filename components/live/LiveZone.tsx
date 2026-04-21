'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LiveZoneShell from './LiveZoneShell';
import HoleScoring, { type MatchStateResp } from './HoleScoring';
import ScorecardGrid from './ScorecardGrid';
import LiveRyderCup from './LiveRyderCup';

type Panel = 'scoring' | 'cup';
type View = 'hole' | 'card';

interface Props {
  matchId: string;
  initialData: MatchStateResp;
}

export default function LiveZone({ matchId, initialData }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  // Seed state from URL on first render, but drive rendering from local state.
  // `router.replace(?foo=bar)` in Next 14 App Router doesn't reliably re-trigger
  // useSearchParams, so mirror URL → state for deep-linkability without round-tripping.
  const [panel, setPanelState] = useState<Panel>(params.get('panel') === 'cup' ? 'cup' : 'scoring');
  const [view, setViewState] = useState<View>(params.get('view') === 'card' ? 'card' : 'hole');
  const [currentHole, setCurrentHoleState] = useState<number>(() => {
    const h = Number(params.get('hole') ?? '1');
    return Number.isFinite(h) && h >= 1 ? h : 1;
  });

  const [data, setData] = useState<MatchStateResp>(initialData);

  const reload = useCallback(async () => {
    const r = await fetch(`/api/scoring/match/${matchId}`, { cache: 'no-store' });
    if (!r.ok) return;
    setData(await r.json());
  }, [matchId]);

  const syncUrl = useCallback(
    (next: { panel?: Panel; view?: View; hole?: number }) => {
      const sp = new URLSearchParams();
      const p = next.panel ?? panel;
      const v = next.view ?? view;
      const h = next.hole ?? currentHole;
      if (p !== 'scoring') sp.set('panel', p);
      if (p === 'scoring' && v !== 'hole') sp.set('view', v);
      if (p === 'scoring' && v === 'hole' && h !== 1) sp.set('hole', String(h));
      const qs = sp.toString();
      const base = window.location.pathname;
      router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
    },
    [panel, view, currentHole, router],
  );

  const setPanel = (p: Panel) => { setPanelState(p); syncUrl({ panel: p }); };
  const setView = (v: View) => { setViewState(v); syncUrl({ view: v }); };
  const setHole = (h: number) => { setViewState('hole'); setCurrentHoleState(h); syncUrl({ view: 'hole', hole: h }); };

  const title = useMemo(() => {
    const r = data.round;
    const timeSegment = r.teeTime ? ` · ${r.teeTime}` : '';
    return `${r.dayOfWeek} · Match ${data.match.matchNumber}${timeSegment}`;
  }, [data]);

  // Keep data synced when the panel or view switches back to scoring (in case it was edited elsewhere)
  useEffect(() => {
    if (panel === 'scoring') void reload();
  }, [panel, reload]);

  return (
    <LiveZoneShell title={title} panel={panel} setPanel={setPanel} showLiveDot>
      {panel === 'scoring' ? (
        view === 'card' ? (
          <>
            <div className="px-4 pt-4">
              <div className="bg-ink-2 rounded-full p-1 flex max-w-xs mx-auto">
                <button
                  onClick={() => setView('hole')}
                  className="flex-1 py-1.5 rounded-full text-xs text-fg-2 tap-highlight-none"
                >
                  Hole
                </button>
                <button className="flex-1 py-1.5 rounded-full text-xs font-semibold bg-white shadow-card text-fg-1">
                  Card
                </button>
              </div>
            </div>
            <ScorecardGrid data={data} onCellTap={(h) => setHole(h)} />
          </>
        ) : (
          <HoleScoring
            matchId={matchId}
            data={data}
            reload={reload}
            currentHole={currentHole}
            setHole={setHole}
            onOpenCard={() => setView('card')}
          />
        )
      ) : (
        <LiveRyderCup />
      )}
    </LiveZoneShell>
  );
}

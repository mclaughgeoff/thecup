'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/BottomTabBar';
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/icons';

interface HoleInfo {
  holeNumber: number;
  par: number;
  handicapIndex: number;
}

interface PerPlayer {
  playerId: string;
  name: string;
  side: 'A' | 'B';
  handicap: number;
  playingHandicap: number;
  strokesByHole: Record<number, number>;
}

interface PerHole {
  hole: number;
  grossA: number | null;
  grossB: number | null;
  netA: number | null;
  netB: number | null;
  strokesA: number;
  strokesB: number;
}

interface MatchStatusShape {
  label: string;
  final: boolean;
}

interface MatchStateResp {
  match: {
    id: string;
    matchNumber: number;
    teamA: { id: string; name: string; color: string | null };
    teamB: { id: string; name: string; color: string | null };
  };
  round: { roundNumber: number; dayOfWeek: string; course: string; course_name: string; teeTime: string; activeTeeBox: string | null };
  format: {
    name: string;
    slug: string | null;
    scoringType: 'match' | 'stroke' | 'stableford';
    teamScoringMode: string;
    strokeEntryMode: 'per_player' | 'per_side';
  };
  allowance: number;
  holes: HoleInfo[];
  state: {
    perPlayer: PerPlayer[];
    teamStrokesByHole: Record<'A' | 'B', Record<number, number>>;
    perHole: PerHole[];
    matchStatus: MatchStatusShape;
  };
}

export default function MatchScorecardEntry() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<MatchStateResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(1);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedTimestamps, setSavedTimestamps] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const r = await fetch(`/api/scoring/match/${params.id}`);
    if (!r.ok) {
      const body = await r.json().catch(() => ({}));
      setError(body.error || 'Failed to load match');
      return;
    }
    const json = await r.json();
    setData(json);
    setError(null);
  }, [params.id]);

  useEffect(() => {
    (async () => {
      try {
        const me = await fetch('/api/auth/me');
        if (!me.ok) throw new Error();
        await reload();
      } catch {
        router.push('/auth/request-link');
      } finally {
        setLoading(false);
      }
    })();
  }, [router, reload]);

  const hole = useMemo(() => data?.holes.find((h) => h.holeNumber === current) ?? null, [data, current]);
  const perHole = useMemo(() => data?.state.perHole.find((h) => h.hole === current) ?? null, [data, current]);
  const isPerSide = data?.format.strokeEntryMode === 'per_side';

  const saveScore = async (args: {
    side: 'A' | 'B';
    playerId?: string | null;
    strokes: number | null; // null = delete
  }) => {
    if (!data) return;
    const k = `${args.side}:${args.playerId ?? 'team'}`;
    setSavingKey(k);
    try {
      if (args.strokes == null) {
        await fetch(`/api/scoring/match/${params.id}/hole/${current}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ side: args.side, playerId: args.playerId ?? null }),
        });
      } else {
        await fetch(`/api/scoring/match/${params.id}/hole/${current}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ side: args.side, playerId: args.playerId ?? null, strokes: args.strokes }),
        });
      }
      await reload();
      setSavedTimestamps((t) => ({ ...t, [k]: Date.now() }));
    } finally {
      setSavingKey(null);
    }
  };

  const goto = (n: number) => {
    if (!data) return;
    if (n < 1 || n > data.holes.length) return;
    setCurrent(n);
  };

  if (loading || !data) {
    return (
      <>
        <AppHeader title="Scorecard" backHref={`/ryder-cup/match/${params.id}`} />
        <main className="min-h-[50vh] flex items-center justify-center bg-ink-0">
          {error ? (
            <p className="text-danger text-sm px-4 text-center">{error}</p>
          ) : (
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-masters border-t-transparent" />
          )}
        </main>
        <BottomTabBar />
      </>
    );
  }

  const teamA = data.match.teamA;
  const teamB = data.match.teamB;
  const sideAPlayers = data.state.perPlayer.filter((p) => p.side === 'A');
  const sideBPlayers = data.state.perPlayer.filter((p) => p.side === 'B');

  return (
    <>
      <AppHeader title={`Match ${data.match.matchNumber}`} backHref={`/ryder-cup/match/${params.id}`} />
      <main className="bg-ink-0 pb-nav">
        {/* Status banner */}
        <section className="px-4 pt-4">
          <div className="card-elevated text-center">
            <p className="text-[10px] uppercase tracking-[0.25em] text-fg-3 mb-1">
              {data.format.name}
            </p>
            <p className="text-xl font-semibold">{data.state.matchStatus.label}</p>
            <p className="text-[10px] uppercase tracking-wider text-fg-3 mt-1">
              {data.round.course_name} · {data.round.activeTeeBox ?? '—'} · {data.allowance}% hcp
            </p>
          </div>
        </section>

        {/* Hole card */}
        <section className="px-4 pt-4">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-widest text-fg-3">
                Hole {current} of {data.holes.length}
              </p>
              <div className="flex items-center gap-3">
                <span className="pill">Par {hole?.par ?? '—'}</span>
                <span className="pill">HCP {hole?.handicapIndex ?? '—'}</span>
              </div>
            </div>

            {/* Entry inputs */}
            {isPerSide ? (
              <div className="grid grid-cols-2 gap-3">
                <TeamInput
                  label={teamA.name}
                  color={teamA.color ?? '#C41E3A'}
                  strokes={data.state.teamStrokesByHole.A[current] ?? 0}
                  gross={perHole?.grossA ?? null}
                  net={perHole?.netA ?? null}
                  onSave={(strokes) => saveScore({ side: 'A', playerId: null, strokes })}
                  saving={savingKey === 'A:team'}
                  justSaved={!!savedTimestamps['A:team'] && Date.now() - savedTimestamps['A:team'] < 1500}
                />
                <TeamInput
                  label={teamB.name}
                  color={teamB.color ?? '#003DA5'}
                  strokes={data.state.teamStrokesByHole.B[current] ?? 0}
                  gross={perHole?.grossB ?? null}
                  net={perHole?.netB ?? null}
                  onSave={(strokes) => saveScore({ side: 'B', playerId: null, strokes })}
                  saving={savingKey === 'B:team'}
                  justSaved={!!savedTimestamps['B:team'] && Date.now() - savedTimestamps['B:team'] < 1500}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <SideBlock
                  label={teamA.name}
                  color={teamA.color ?? '#C41E3A'}
                  players={sideAPlayers}
                  hole={current}
                  matchId={params.id}
                  reload={reload}
                />
                <SideBlock
                  label={teamB.name}
                  color={teamB.color ?? '#003DA5'}
                  players={sideBPlayers}
                  hole={current}
                  matchId={params.id}
                  reload={reload}
                />
              </div>
            )}
          </div>
        </section>

        {/* Nav */}
        <section className="px-4 pt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => goto(current - 1)}
            disabled={current <= 1}
            className="btn-ghost inline-flex items-center gap-2"
          >
            <ArrowLeftIcon size={16} /> Prev hole
          </button>
          <button
            onClick={() => goto(current + 1)}
            disabled={current >= data.holes.length}
            className="btn-primary inline-flex items-center gap-2"
          >
            Next hole <ArrowRightIcon size={16} />
          </button>
        </section>

        <div className="px-4 pt-4 text-center">
          <Link
            href={`/ryder-cup/match/${params.id}`}
            className="text-masters-glow text-sm font-semibold inline-flex items-center gap-1"
          >
            View full scorecard <ArrowRightIcon size={14} />
          </Link>
        </div>

        {/* Hole selector */}
        <section className="px-4 pt-6">
          <h2 className="label mb-2">Jump to hole</h2>
          <div className="grid grid-cols-9 gap-1.5">
            {data.holes.map((h) => {
              const done = (data.state.perHole.find((x) => x.hole === h.holeNumber)?.netA ?? null) != null
                && (data.state.perHole.find((x) => x.hole === h.holeNumber)?.netB ?? null) != null;
              return (
                <button
                  key={h.holeNumber}
                  onClick={() => goto(h.holeNumber)}
                  className={`aspect-square rounded-lg text-xs font-semibold border transition tap-highlight-none ${
                    h.holeNumber === current
                      ? 'bg-masters text-fg-1 border-masters'
                      : done
                      ? 'bg-masters/10 border-masters/40 text-masters-glow'
                      : 'bg-ink-2 border-ink-3 text-fg-2'
                  }`}
                >
                  {h.holeNumber}
                </button>
              );
            })}
          </div>
        </section>
      </main>
      <BottomTabBar />
    </>
  );
}

// ─────────── subcomponents ───────────

function TeamInput({
  label, color, strokes, gross, net, onSave, saving, justSaved,
}: {
  label: string;
  color: string;
  strokes: number;
  gross: number | null;
  net: number | null;
  onSave: (strokes: number | null) => Promise<void>;
  saving: boolean;
  justSaved: boolean;
}) {
  const [val, setVal] = useState<string>(gross == null ? '' : String(gross));
  useEffect(() => { setVal(gross == null ? '' : String(gross)); }, [gross]);

  const commit = () => {
    const n = parseInt(val, 10);
    if (Number.isNaN(n)) {
      if (gross != null) void onSave(null); // cleared → delete
      return;
    }
    if (n === gross) return;
    void onSave(n);
  };

  return (
    <div className="bg-ink-2 border border-ink-3 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="h-1 w-6 rounded-full" style={{ backgroundColor: color }} />
        <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color }}>
          {label}
        </p>
      </div>
      <input
        type="number"
        inputMode="numeric"
        value={val}
        placeholder="—"
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        className="input text-3xl font-mono text-center tabular-nums py-3"
      />
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(strokes, 3) }).map((_, i) => (
            <span key={i} className="w-1.5 h-1.5 rounded-full bg-masters-glow" />
          ))}
          <span className="text-[10px] text-fg-3 ml-1">
            {strokes > 0 ? `${strokes} stroke${strokes > 1 ? 's' : ''}` : 'No strokes'}
          </span>
        </div>
        <span className="text-[10px] font-mono text-fg-2">
          {net != null ? `Net ${net}` : saving ? 'Saving…' : justSaved ? 'Saved' : ''}
        </span>
      </div>
    </div>
  );
}

function SideBlock({
  label, color, players, hole, matchId, reload,
}: {
  label: string;
  color: string;
  players: PerPlayer[];
  hole: number;
  matchId: string;
  reload: () => Promise<void>;
}) {
  return (
    <div className="bg-ink-2 border border-ink-3 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="h-1 w-6 rounded-full" style={{ backgroundColor: color }} />
        <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color }}>
          {label}
        </p>
      </div>
      <div className="space-y-2">
        {players.map((p) => (
          <PlayerInput
            key={p.playerId}
            player={p}
            hole={hole}
            matchId={matchId}
            reload={reload}
          />
        ))}
      </div>
    </div>
  );
}

function PlayerInput({
  player, hole, matchId, reload,
}: {
  player: PerPlayer;
  hole: number;
  matchId: string;
  reload: () => Promise<void>;
}) {
  // Fetch existing score? We rely on reload() to refresh parent; this input is uncontrolled-on-blur.
  const [val, setVal] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const commit = async () => {
    const n = parseInt(val, 10);
    if (Number.isNaN(n)) return;
    setSaving(true);
    await fetch(`/api/scoring/match/${matchId}/hole/${hole}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ side: player.side, playerId: player.playerId, strokes: n }),
    });
    await reload();
    setSaving(false);
  };

  const strokes = player.strokesByHole[hole] ?? 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{player.name}</p>
        <p className="text-[10px] text-fg-3">
          {strokes > 0 ? `${strokes} stroke${strokes > 1 ? 's' : ''} · PH ${player.playingHandicap}` : `PH ${player.playingHandicap}`}
        </p>
      </div>
      <input
        type="number"
        inputMode="numeric"
        placeholder="—"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        disabled={saving}
        className="input w-20 text-xl font-mono text-center tabular-nums py-2"
      />
    </div>
  );
}

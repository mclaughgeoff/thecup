/**
 * Scoring engine — pure functions. No DB access.
 *
 * Consumed by: API routes (/api/scoring/...), server components on
 * /ryder-cup/match/[id] and /ryder-cup for live leaderboard aggregation.
 */

export type ScoringType = 'match' | 'stroke' | 'stableford';
export type TeamScoringMode = 'individual' | 'best_ball' | 'scramble';
export type HandicapCombine = 'per_player' | 'combined_sum';
export type StrokeEntryMode = 'per_player' | 'per_side';
export type Side = 'A' | 'B';
export type GhostDifficulty = 'AUTO' | 'EASY' | 'STANDARD' | 'TOUGH';
export type AbsenceSource = 'OVERRIDE' | 'AVAILABILITY' | 'DEFAULT';

/**
 * Stableford point map keyed by diff-from-par as a string.
 * E.g. { "-3": 5, "-2": 4, "-1": 3, "0": 2, "1": 1, "2": 0 }
 * Any diff not listed falls through to the "worse than the highest key" rule,
 * which scores 0 (or the key tagged "worse" if present).
 */
export type StablefordConfig = Record<string, number>;

export interface FormatConfig {
  scoringType: ScoringType;
  teamScoringMode: TeamScoringMode;
  handicapCombine: HandicapCombine;
  strokeEntryMode: StrokeEntryMode;
  defaultAllowance: number;
  stablefordConfig?: StablefordConfig | null;
}

export interface HoleInfo {
  holeNumber: number;
  par: number;
  handicapIndex: number; // 1-18 (1 = hardest)
}

export interface PlayerInfo {
  playerId: string;
  name: string;
  handicap: number;
  side: Side;
  /** True if this player is absent for this match (ghost score substituted). */
  absent?: boolean;
  /** How the absence was resolved (for UI badges). */
  absenceSource?: AbsenceSource;
}

export interface ScoreRow {
  hole: number;                // 1-18
  side: Side;
  playerId: string | null;     // null = team-level score (per_side formats)
  strokes: number;
}

export interface ComputeInput {
  format: FormatConfig;
  /** Effective allowance % to apply (round override if set, else format default). */
  allowance: number;
  /** Course slope for the active tee box, or null if unknown. */
  slope: number | null;
  holes: HoleInfo[];           // 18 entries (or fewer if partial course)
  players: PlayerInfo[];
  scores: ScoreRow[];
  /**
   * Admin-set playing-handicap overrides for this round, keyed by playerId.
   * When present, completely replaces the computed PH for that player.
   * Team handicap (for per-side formats) is recomputed as the sum of each
   * partner's effective PH, so overrides compose naturally with team play.
   */
  playerOverrides?: Record<string, number>;
  /** Ghost-score difficulty selector for absent players. Defaults to AUTO. */
  ghostDifficulty?: GhostDifficulty;
}

export interface PerPlayer {
  playerId: string;
  name: string;
  side: Side;
  handicap: number;
  courseHandicap: number;
  playingHandicap: number;
  strokesByHole: Record<number, number>; // holeNumber → strokes received on that hole
  absent: boolean;
  absenceSource?: AbsenceSource;
}

export interface GhostPerHole {
  hole: number;
  par: number;
  handicapIndex: number;
  strokes: number; // strokes received (from PH + stroke index allocation)
  gross: number;
  net: number;
}

export interface GhostScorecard {
  playerId: string;
  playerName: string;
  side: Side;
  handicap: number;
  courseHandicap: number;
  playingHandicap: number;
  difficultyUsed: GhostDifficulty;
  source: AbsenceSource;
  perHole: GhostPerHole[];
}

export interface PerHoleTeam {
  hole: number;
  grossA: number | null;
  grossB: number | null;
  netA: number | null;
  netB: number | null;
  strokesA: number; // strokes received by side A's scoring entity on this hole
  strokesB: number; // same for B
  /** Match-play hole result: 'A' | 'B' | 'halve' | null (incomplete). */
  matchResult: 'A' | 'B' | 'halve' | null;
  /** Stableford points earned this hole (by side). Null if scoringType != stableford or hole incomplete. */
  stablefordA: number | null;
  stablefordB: number | null;
}

export interface MatchState {
  perPlayer: PerPlayer[];
  /** Team-level playing handicap (used for per-side formats with combined_sum). */
  teamPlayingHandicap: Record<Side, number>;
  /** Total strokes allocated per side per hole (derived from teamPlayingHandicap or per-player). */
  teamStrokesByHole: Record<Side, Record<number, number>>;
  perHole: PerHoleTeam[];
  totals: {
    sideA: { gross: number; net: number; stableford: number };
    sideB: { gross: number; net: number; stableford: number };
  };
  /** Cumulative match-play state if scoringType='match'. */
  matchStatus: MatchStatus;
  /** Is every hole fully entered? */
  allHolesEntered: boolean;
  /** Points awarded (1/0.5/0) once final. Null while in progress. */
  points: { a: number | null; b: number | null };
  /** Synthesized ghost scorecards for any absent players (empty if none). */
  ghosts: GhostScorecard[];
}

export interface MatchStatus {
  /** Holes completed (where both sides have a net score). */
  thru: number;
  /** Signed: + = A up, - = B up, 0 = AS. */
  upBy: number;
  /** Holes remaining (18 - thru). */
  remaining: number;
  /** Conventional golf string: "2&1", "AS", "3 UP thru 10", etc. */
  label: string;
  /** True if mathematically settled (|upBy| > remaining) or all holes done. */
  final: boolean;
  /** Winner once final. */
  winner: Side | 'halve' | null;
}

// ─────────────────────────────────────────────────────────────
// Core math
// ─────────────────────────────────────────────────────────────

/** USGA course handicap: handicap × slope / 113, rounded to nearest integer. */
export function courseHandicap(playerHandicap: number, slope: number | null): number {
  if (slope == null) return Math.round(playerHandicap);
  return Math.round((playerHandicap * slope) / 113);
}

/** Playing handicap = course handicap × allowance%, rounded. Negative clamps to 0. */
export function playingHandicap(ch: number, allowancePct: number): number {
  const ph = Math.round((ch * allowancePct) / 100);
  return ph < 0 ? 0 : ph;
}

/**
 * Strokes received on a specific hole for a playing handicap.
 * Standard USGA allocation: floor(ph / 18) base strokes everywhere,
 * plus +1 on the hardest (ph mod 18) holes.
 */
export function strokesOnHole(ph: number, holeHandicapIndex: number): number {
  if (ph <= 0) return 0;
  const base = Math.floor(ph / 18);
  const remainder = ph % 18;
  return base + (holeHandicapIndex <= remainder ? 1 : 0);
}

/** Combined team playing handicap = sum of partners' playing handicaps. */
export function combinedTeamPlayingHandicap(partnerPHs: number[]): number {
  return partnerPHs.reduce((s, x) => s + x, 0);
}

/** Net = gross - strokes received. */
export function netScore(gross: number, strokes: number): number {
  return gross - strokes;
}

/**
 * Default Stableford map (used when no config is provided):
 * albatross+ → 5, eagle → 4, birdie → 3, par → 2, bogey → 1, double+ → 0.
 */
export const DEFAULT_STABLEFORD: StablefordConfig = {
  '-3': 5, '-2': 4, '-1': 3, '0': 2, '1': 1, '2': 0,
};

/**
 * Look up the point value for a net score given a StablefordConfig.
 * - Exact diff match wins.
 * - Diffs *lower* than the smallest key default to the smallest-key value
 *   (i.e. "5 under par" counts as an albatross).
 * - Diffs *higher* than the largest key default to 0.
 */
export function stablefordPoints(
  netStrokes: number,
  par: number,
  config: StablefordConfig | null | undefined = DEFAULT_STABLEFORD,
): number {
  const map = config && Object.keys(config).length > 0 ? config : DEFAULT_STABLEFORD;
  const diff = netStrokes - par;
  if (map[String(diff)] !== undefined) return map[String(diff)];

  const keys = Object.keys(map).map(Number).sort((a, b) => a - b);
  if (keys.length === 0) return 0;
  if (diff < keys[0]) return map[String(keys[0])];
  // Higher than max key → 0 (double-bogey or worse)
  return 0;
}

// ─────────────────────────────────────────────────────────────
// Match status (match-play rules)
// ─────────────────────────────────────────────────────────────

/**
 * Given per-hole net A/B values, compute match status.
 * Entries with either side null are treated as "not yet played".
 */
export function matchStatus(
  perHole: Array<{ a: number | null; b: number | null }>,
  totalHoles = 18,
): MatchStatus {
  let upBy = 0;
  let thru = 0;
  for (const h of perHole) {
    if (h.a == null || h.b == null) continue;
    thru++;
    if (h.a < h.b) upBy += 1;
    else if (h.b < h.a) upBy -= 1;
  }

  const remaining = totalHoles - thru;
  const margin = Math.abs(upBy);

  // Mathematically closed: can't be caught
  const closedOut = thru > 0 && remaining >= 0 && margin > remaining;
  const allDone = thru >= totalHoles;
  const final = closedOut || allDone;

  let label = '';
  let winner: Side | 'halve' | null = null;

  if (thru === 0) {
    label = 'All Square';
  } else if (closedOut) {
    // "3&2" etc: winner is up by N with M to play; label is "N&M"
    // Special case: "N UP" when won on final hole (remaining==0 at decision moment).
    if (remaining === 0) {
      label = `${margin} UP`;
    } else {
      label = `${margin}&${remaining}`;
    }
    winner = upBy > 0 ? 'A' : 'B';
  } else if (allDone) {
    if (upBy === 0) { label = 'Halve'; winner = 'halve'; }
    else { label = `${margin} UP`; winner = upBy > 0 ? 'A' : 'B'; }
  } else {
    // In progress
    if (upBy === 0) label = `AS thru ${thru}`;
    else label = `${margin} UP thru ${thru}`;
  }

  return { upBy, thru, remaining, label, final, winner };
}

// ─────────────────────────────────────────────────────────────
// Ghost scoring for absent players
// ─────────────────────────────────────────────────────────────

/**
 * Compute a ghost's gross + net score for a single hole.
 *
 * AUTO (handicap-scaled):
 *   H ≤ 9   → net par everywhere                    (gross = par + strokes)
 *   10..19  → split: net par on SI 1–9 holes,
 *             net bogey on SI 10–18                 (gross = par + strokes [+1 on easy half])
 *   H ≥ 20  → net bogey everywhere                  (gross = par + strokes + 1)
 *
 * Slider overrides AUTO:
 *   EASY     → net par          (gross = par + strokes)
 *   STANDARD → net bogey        (gross = par + strokes + 1)
 *   TOUGH    → net double bogey (gross = par + strokes + 2)
 */
export function computeGhostScores(
  absentPlayerHandicap: number,
  par: number,
  strokeIndex: number,
  strokesOnThisHole: number,
  difficulty: GhostDifficulty,
): { gross: number; net: number } {
  const net = (bump: number) => (par + bump);
  const gross = (bump: number) => par + strokesOnThisHole + bump;

  if (difficulty === 'EASY')     return { gross: gross(0), net: net(0) };
  if (difficulty === 'STANDARD') return { gross: gross(1), net: net(1) };
  if (difficulty === 'TOUGH')    return { gross: gross(2), net: net(2) };

  // AUTO — handicap-scaled
  const h = absentPlayerHandicap;
  if (h <= 9) return { gross: gross(0), net: net(0) };
  if (h >= 20) return { gross: gross(1), net: net(1) };
  // Mid tier (10..19): net par on SI 1–9, net bogey on SI 10–18
  const bump = strokeIndex <= 9 ? 0 : 1;
  return { gross: gross(bump), net: net(bump) };
}

/**
 * Three-state absence resolution.
 *
 *   absentOverride === true   → Absent, source OVERRIDE
 *   absentOverride === false  → Present, source OVERRIDE
 *   absentOverride === null   → inherit from availability
 *                               · available === false → Absent, source AVAILABILITY
 *                               · otherwise           → Present, source DEFAULT
 */
export function resolveAbsence(
  absentOverride: boolean | null | undefined,
  availability: { available: boolean } | null | undefined,
): { absent: boolean; source: AbsenceSource } {
  if (absentOverride === true)  return { absent: true,  source: 'OVERRIDE' };
  if (absentOverride === false) return { absent: false, source: 'OVERRIDE' };
  if (availability && availability.available === false) {
    return { absent: true, source: 'AVAILABILITY' };
  }
  return { absent: false, source: 'DEFAULT' };
}

/**
 * Scramble weighted handicap allowance (industry-standard).
 * Players sorted ascending by course handicap, weighted blend returns the team PH.
 *   4 players: 25/20/15/10
 *   3 players: 30/20/10
 *   2 players: 35/15
 *   1 player:  100% (edge-case)
 * Absent players are excluded from the weighting (no ghost in scramble).
 * Falls back to the 4-player blend if >4 somehow.
 */
export function scrambleTeamPlayingHandicap(presentCourseHandicaps: number[]): number {
  const sorted = [...presentCourseHandicaps].sort((a, b) => a - b);
  const weights: Record<number, number[]> = {
    1: [1.0],
    2: [0.35, 0.15],
    3: [0.30, 0.20, 0.10],
    4: [0.25, 0.20, 0.15, 0.10],
  };
  const w = weights[sorted.length] ?? weights[4];
  let ph = 0;
  for (let i = 0; i < sorted.length; i++) {
    ph += sorted[i] * (w[i] ?? 0);
  }
  return Math.round(ph);
}

// ─────────────────────────────────────────────────────────────
// High-level: compute full match state for a given Format + scores
// ─────────────────────────────────────────────────────────────

export function computeMatchState(input: ComputeInput): MatchState {
  const { format, allowance, slope, holes, players, scores } = input;
  const ghostDifficulty: GhostDifficulty = input.ghostDifficulty ?? 'AUTO';

  // Sort holes by number
  const orderedHoles = [...holes].sort((a, b) => a.holeNumber - b.holeNumber);

  // Per-player handicap + strokes allocation
  const overrides = input.playerOverrides ?? {};
  const perPlayer: PerPlayer[] = players.map((p) => {
    const ch = courseHandicap(p.handicap, slope);
    const computedPH = playingHandicap(ch, allowance);
    // Admin override (if set) wins — replaces the computed PH outright.
    const ph = overrides[p.playerId] ?? computedPH;
    const strokesByHole: Record<number, number> = {};
    for (const h of orderedHoles) {
      strokesByHole[h.holeNumber] = strokesOnHole(ph, h.handicapIndex);
    }
    return {
      playerId: p.playerId,
      name: p.name,
      side: p.side,
      handicap: p.handicap,
      courseHandicap: ch,
      playingHandicap: ph,
      strokesByHole,
      absent: p.absent === true,
      absenceSource: p.absenceSource,
    };
  });

  const isScramble = format.teamScoringMode === 'scramble';

  // Team playing handicap.
  // Scramble: weighted allowance of *present* players only (no ghost in scramble).
  // Non-scramble: sum of every player's PH (absent partners still contribute via ghost).
  let teamPHA: number;
  let teamPHB: number;
  if (isScramble) {
    const presentA = perPlayer.filter(p => p.side === 'A' && !p.absent).map(p => p.courseHandicap);
    const presentB = perPlayer.filter(p => p.side === 'B' && !p.absent).map(p => p.courseHandicap);
    // Apply the configured allowance % on top of the weighted scramble blend so round-level
    // overrides (e.g. 85%) still compose with the scramble weighting.
    teamPHA = playingHandicap(scrambleTeamPlayingHandicap(presentA), allowance);
    teamPHB = playingHandicap(scrambleTeamPlayingHandicap(presentB), allowance);
  } else {
    teamPHA = combinedTeamPlayingHandicap(perPlayer.filter(p => p.side === 'A').map(p => p.playingHandicap));
    teamPHB = combinedTeamPlayingHandicap(perPlayer.filter(p => p.side === 'B').map(p => p.playingHandicap));
  }
  const teamPlayingHandicap: Record<Side, number> = { A: teamPHA, B: teamPHB };

  // Strokes per side per hole (for per_side / combined_sum formats)
  const teamStrokesByHole: Record<Side, Record<number, number>> = { A: {}, B: {} };
  for (const h of orderedHoles) {
    teamStrokesByHole.A[h.holeNumber] = strokesOnHole(teamPHA, h.handicapIndex);
    teamStrokesByHole.B[h.holeNumber] = strokesOnHole(teamPHB, h.handicapIndex);
  }

  // Synthesize ghost scorecards for absent players.
  // In scramble we don't produce ghosts (the format re-weights instead).
  const ghosts: GhostScorecard[] = [];
  if (!isScramble) {
    for (const p of perPlayer) {
      if (!p.absent) continue;
      const perHoleGhost: GhostPerHole[] = orderedHoles.map((h) => {
        const strokes = p.strokesByHole[h.holeNumber];
        const { gross, net } = computeGhostScores(
          p.handicap,
          h.par,
          h.handicapIndex,
          strokes,
          ghostDifficulty,
        );
        return {
          hole: h.holeNumber,
          par: h.par,
          handicapIndex: h.handicapIndex,
          strokes,
          gross,
          net,
        };
      });
      ghosts.push({
        playerId: p.playerId,
        playerName: p.name,
        side: p.side,
        handicap: p.handicap,
        courseHandicap: p.courseHandicap,
        playingHandicap: p.playingHandicap,
        difficultyUsed: ghostDifficulty,
        source: p.absenceSource ?? 'OVERRIDE',
        perHole: perHoleGhost,
      });
    }
  }

  // Fast lookup: ghost net/gross per (playerId, hole)
  const ghostByKey = new Map<string, { gross: number; net: number; strokes: number }>();
  for (const g of ghosts) {
    for (const h of g.perHole) {
      ghostByKey.set(`${g.playerId}:${h.hole}`, { gross: h.gross, net: h.net, strokes: h.strokes });
    }
  }

  // Bucket scores
  const scoresByKey = new Map<string, number>();
  for (const s of scores) {
    const key = s.playerId ? `p:${s.playerId}:${s.hole}` : `t:${s.side}:${s.hole}`;
    scoresByKey.set(key, s.strokes);
  }

  const isPerSide = format.strokeEntryMode === 'per_side';

  // Per-hole team results
  const perHole: PerHoleTeam[] = orderedHoles.map((h) => {
    const par = h.par;

    // Derive each side's gross + strokes-allocated + net
    const sideResult = (side: Side): { gross: number | null; net: number | null; strokes: number } => {
      const sidePlayers = perPlayer.filter(p => p.side === side);

      if (isPerSide) {
        // One entry per team per hole
        const gross = scoresByKey.get(`t:${side}:${h.holeNumber}`) ?? null;
        const strokes = teamStrokesByHole[side][h.holeNumber];
        const net = gross == null ? null : netScore(gross, strokes);
        return { gross, net, strokes };
      }

      // per_player entry
      if (format.teamScoringMode === 'best_ball') {
        // Each partner's net (real score or ghost substitute); team net = min.
        const completed: Array<{ gross: number; net: number; strokes: number }> = [];
        for (const p of sidePlayers) {
          if (p.absent) {
            const ghost = ghostByKey.get(`${p.playerId}:${h.holeNumber}`);
            if (ghost) completed.push(ghost);
            continue;
          }
          const g = scoresByKey.get(`p:${p.playerId}:${h.holeNumber}`);
          if (g == null) continue;
          const s = p.strokesByHole[h.holeNumber];
          completed.push({ gross: g, net: g - s, strokes: s });
        }
        if (completed.length === 0) return { gross: null, net: null, strokes: 0 };
        const best = completed.reduce((a, b) => (a.net <= b.net ? a : b));
        return { gross: best.gross, net: best.net, strokes: best.strokes };
      }

      if (format.teamScoringMode === 'individual') {
        // Singles: one player per side; use real or ghost score.
        const p = sidePlayers[0];
        if (!p) return { gross: null, net: null, strokes: 0 };
        if (p.absent) {
          const ghost = ghostByKey.get(`${p.playerId}:${h.holeNumber}`);
          return ghost ? { gross: ghost.gross, net: ghost.net, strokes: ghost.strokes } : { gross: null, net: null, strokes: 0 };
        }
        const g = scoresByKey.get(`p:${p.playerId}:${h.holeNumber}`) ?? null;
        const strokes = p.strokesByHole[h.holeNumber];
        const net = g == null ? null : g - strokes;
        return { gross: g, net, strokes };
      }

      // scramble, per_player entry — treat first recorded present partner as the team's gross,
      // then apply the re-weighted team strokes allocation.
      const present = sidePlayers.filter(p => !p.absent);
      const first = present[0];
      if (!first) return { gross: null, net: null, strokes: 0 };
      const g = scoresByKey.get(`p:${first.playerId}:${h.holeNumber}`) ?? null;
      const strokes = teamStrokesByHole[side][h.holeNumber];
      const net = g == null ? null : g - strokes;
      return { gross: g, net, strokes };
    };

    const a = sideResult('A');
    const b = sideResult('B');

    let matchResult: 'A' | 'B' | 'halve' | null = null;
    if (a.net != null && b.net != null) {
      if (a.net < b.net) matchResult = 'A';
      else if (b.net < a.net) matchResult = 'B';
      else matchResult = 'halve';
    }

    const sfConfig = format.stablefordConfig ?? null;
    const stablefordA = a.net != null ? stablefordPoints(a.net, par, sfConfig) : null;
    const stablefordB = b.net != null ? stablefordPoints(b.net, par, sfConfig) : null;

    return {
      hole: h.holeNumber,
      grossA: a.gross, grossB: b.gross,
      netA:   a.net,   netB:   b.net,
      strokesA: a.strokes, strokesB: b.strokes,
      matchResult,
      stablefordA, stablefordB,
    };
  });

  // Totals
  const sum = (xs: Array<number | null>) => xs.reduce<number>((s, x) => s + (x ?? 0), 0);
  const totals = {
    sideA: {
      gross:      sum(perHole.map(h => h.grossA)),
      net:        sum(perHole.map(h => h.netA)),
      stableford: sum(perHole.map(h => h.stablefordA)),
    },
    sideB: {
      gross:      sum(perHole.map(h => h.grossB)),
      net:        sum(perHole.map(h => h.netB)),
      stableford: sum(perHole.map(h => h.stablefordB)),
    },
  };

  // Match status
  const status = matchStatus(
    perHole.map(h => ({ a: h.netA, b: h.netB })),
    orderedHoles.length,
  );

  const allHolesEntered = perHole.every(h => h.netA != null && h.netB != null);

  // Points — only awarded once final
  let points: { a: number | null; b: number | null } = { a: null, b: null };
  if (format.scoringType === 'match' && status.final) {
    if (status.winner === 'A')      points = { a: 1,   b: 0   };
    else if (status.winner === 'B') points = { a: 0,   b: 1   };
    else if (status.winner === 'halve') points = { a: 0.5, b: 0.5 };
  } else if (format.scoringType === 'stroke' && allHolesEntered) {
    if (totals.sideA.net < totals.sideB.net) points = { a: 1, b: 0 };
    else if (totals.sideB.net < totals.sideA.net) points = { a: 0, b: 1 };
    else points = { a: 0.5, b: 0.5 };
  } else if (format.scoringType === 'stableford' && allHolesEntered) {
    if (totals.sideA.stableford > totals.sideB.stableford) points = { a: 1, b: 0 };
    else if (totals.sideB.stableford > totals.sideA.stableford) points = { a: 0, b: 1 };
    else points = { a: 0.5, b: 0.5 };
  }

  return {
    perPlayer,
    teamPlayingHandicap,
    teamStrokesByHole,
    perHole,
    totals,
    matchStatus: status,
    allHolesEntered,
    points,
    ghosts,
  };
}

// ─────────────────────────────────────────────────────────────
// Projection: "if called now, who gets the point?"
// ─────────────────────────────────────────────────────────────

/**
 * Given a computed match state + a match's finality flag, return the points
 * each side would receive if the match were called at this exact moment.
 *
 * - If the match is final, pass state.points through (treats nulls as 0).
 * - If no holes have been played yet, return { a: 0, b: 0 } — we don't project unplayed matches.
 * - Match play: leading side gets 1, all-square gets 0.5/0.5. Uses state.matchStatus
 *   which already resolves teamScoringMode (best-ball / alt-shot / scramble) into a leader.
 * - Stroke / Stableford: compare aggregated team totals; ties → 0.5/0.5.
 */
export function projectMatchPoints(
  state: MatchState,
  match: { final: boolean; overridePointsA?: number | null; overridePointsB?: number | null },
  scoringType: ScoringType,
): { a: number; b: number } {
  // Admin override short-circuits everything — both actual and projected treat
  // the override as the final result.
  if (match.overridePointsA != null && match.overridePointsB != null) {
    return { a: match.overridePointsA, b: match.overridePointsB };
  }
  if (match.final) {
    return { a: state.points.a ?? 0, b: state.points.b ?? 0 };
  }
  if (state.matchStatus.thru === 0) {
    return { a: 0, b: 0 };
  }

  if (scoringType === 'match') {
    if (state.matchStatus.upBy > 0) return { a: 1, b: 0 };
    if (state.matchStatus.upBy < 0) return { a: 0, b: 1 };
    return { a: 0.5, b: 0.5 };
  }

  if (scoringType === 'stroke') {
    const a = state.totals.sideA.net;
    const b = state.totals.sideB.net;
    if (a < b) return { a: 1, b: 0 };
    if (b < a) return { a: 0, b: 1 };
    return { a: 0.5, b: 0.5 };
  }

  // stableford
  const a = state.totals.sideA.stableford;
  const b = state.totals.sideB.stableford;
  if (a > b) return { a: 1, b: 0 };
  if (b > a) return { a: 0, b: 1 };
  return { a: 0.5, b: 0.5 };
}

export interface RyderCupTotals {
  actual: { a: number; b: number };
  projected: { a: number; b: number };
}

/**
 * Aggregate actual and projected points for a list of matches.
 *
 * - actual: only matches whose DB `pointsA`/`pointsB` have been set (final).
 * - projected: actual for finals + `projectMatchPoints(state, match)` for in-progress.
 */
export function computeRyderCupTotals(
  entries: Array<{
    state: MatchState;
    scoringType: ScoringType;
    pointsA: number | null;
    pointsB: number | null;
    overridePointsA?: number | null;
    overridePointsB?: number | null;
  }>,
): RyderCupTotals {
  const actual = { a: 0, b: 0 };
  const projected = { a: 0, b: 0 };
  for (const e of entries) {
    const hasOverride = e.overridePointsA != null && e.overridePointsB != null;
    const isFinal = hasOverride || e.state.matchStatus.final || (e.pointsA != null && e.pointsB != null);
    if (hasOverride) {
      actual.a += e.overridePointsA as number;
      actual.b += e.overridePointsB as number;
    } else if (e.pointsA != null && e.pointsB != null) {
      actual.a += e.pointsA;
      actual.b += e.pointsB;
    } else if (isFinal) {
      // final per state but not written back yet — treat as actual anyway.
      actual.a += e.state.points.a ?? 0;
      actual.b += e.state.points.b ?? 0;
    }
    const p = projectMatchPoints(
      e.state,
      { final: isFinal, overridePointsA: e.overridePointsA, overridePointsB: e.overridePointsB },
      e.scoringType,
    );
    projected.a += p.a;
    projected.b += p.b;
  }
  return { actual, projected };
}

/**
 * Resolve the effective FormatConfig + allowance + scoringType for a round,
 * inheriting round-level overrides.
 */
export function resolveRoundFormat(round: {
  handicapAllowance: number | null;
  scoringType: string | null;
  formatRef: {
    scoringType: string;
    teamScoringMode: string;
    handicapCombine: string;
    strokeEntryMode: string;
    defaultAllowance: number;
    stablefordConfig?: unknown;
  } | null;
}): { format: FormatConfig; allowance: number } | null {
  if (!round.formatRef) return null;
  const fr = round.formatRef;
  return {
    format: {
      scoringType:     (round.scoringType ?? fr.scoringType) as ScoringType,
      teamScoringMode: fr.teamScoringMode as TeamScoringMode,
      handicapCombine: fr.handicapCombine as HandicapCombine,
      strokeEntryMode: fr.strokeEntryMode as StrokeEntryMode,
      defaultAllowance: fr.defaultAllowance,
      stablefordConfig:
        fr.stablefordConfig && typeof fr.stablefordConfig === 'object'
          ? (fr.stablefordConfig as StablefordConfig)
          : null,
    },
    allowance: round.handicapAllowance ?? fr.defaultAllowance,
  };
}

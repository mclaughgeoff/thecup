import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(timeStr: string): string {
  return timeStr;
}

export function calculateMatchStatus(player1Score: number, player2Score: number): string {
  const diff = player1Score - player2Score;
  if (diff > 0) {
    return `${diff}UP`;
  } else if (diff < 0) {
    return `${Math.abs(diff)}DN`;
  } else {
    return 'AS';
  }
}

export function calculatePoints(result: string): { team1: number; team2: number } {
  if (result.includes('Team1 Win')) {
    return { team1: 1, team2: 0 };
  } else if (result.includes('Team2 Win')) {
    return { team1: 0, team2: 1 };
  } else if (result.includes('Halve')) {
    return { team1: 0.5, team2: 0.5 };
  }
  return { team1: 0, team2: 0 };
}

export function formatHandicap(hcp: number): string {
  return hcp.toFixed(1);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();
}

/** Ryder-Cup-style point formatter: halves as "½", zero as "0", whole numbers otherwise. */
export function fmtPts(n: number): string {
  if (n === 0) return '0';
  const whole = Math.floor(n);
  const frac = n - whole;
  if (frac === 0.5) return whole === 0 ? '½' : `${whole}½`;
  return String(n);
}

/**
 * Trip-local timezone used to compare wall-clock tee times ("2:24 PM") against "now".
 * Vercel runs in UTC; the trip is US East Coast. If the trip ever moves, change this.
 */
export const TRIP_TIMEZONE = 'America/New_York';

/** Parse "8:15 AM" / "2:24 PM" → minutes since midnight. Null if unparseable. */
export function teeTimeToMinutes(teeTime: string): number | null {
  const m = teeTime.match(/^\s*(\d{1,2}):(\d{2})\s*(AM|PM)\s*$/i);
  if (!m) return null;
  let hours = parseInt(m[1], 10);
  const minutes = parseInt(m[2], 10);
  const ampm = m[3].toUpperCase();
  if (ampm === 'PM' && hours !== 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function ymdAndMinutesInTz(d: Date, tz: string): { ymd: string; minutes: number } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const hour = parseInt(get('hour'), 10);
  const minute = parseInt(get('minute'), 10);
  return {
    ymd: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: hour * 60 + minute,
  };
}

/**
 * Whether the given round date+teeTime is within `leadMinutes` of "now" or already past,
 * evaluated in the trip timezone. A null/unparseable teeTime returns false (conservative).
 */
export function isWithinTeeTimeWindow(
  roundDate: Date,
  earliestTeeTime: string | null,
  leadMinutes = 30,
  now: Date = new Date(),
): boolean {
  if (!earliestTeeTime) return false;
  const teeMins = teeTimeToMinutes(earliestTeeTime);
  if (teeMins == null) return false;

  const roundYmd = ymdAndMinutesInTz(roundDate, TRIP_TIMEZONE).ymd;
  const nowPieces = ymdAndMinutesInTz(now, TRIP_TIMEZONE);

  if (nowPieces.ymd > roundYmd) return true;          // round day is in the past
  if (nowPieces.ymd < roundYmd) return false;         // round day is in the future
  return nowPieces.minutes >= teeMins - leadMinutes;  // same day: check window
}

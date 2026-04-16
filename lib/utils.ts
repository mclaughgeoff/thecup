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

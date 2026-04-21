'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Panel = 'scoring' | 'cup';

interface Props {
  title: string;
  panel: Panel;
  setPanel: (p: Panel) => void;
  showLiveDot?: boolean;
  children: React.ReactNode;
}

export default function LiveZoneShell({ title, panel, setPanel, showLiveDot, children }: Props) {
  const router = useRouter();
  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl border-b border-ink-3">
        <div className="h-14 flex items-center gap-3 px-3">
          <button
            aria-label="Close live scoring"
            onClick={() => router.push('/dashboard')}
            className="w-9 h-9 rounded-full flex items-center justify-center text-fg-2 hover:bg-ink-2 active:bg-ink-3 transition tap-highlight-none"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div className="flex-1 min-w-0 text-center">
            <p className="text-sm font-semibold tracking-tight text-fg-1 truncate">{title}</p>
          </div>
          <div className="w-9 h-9 flex items-center justify-center">
            {showLiveDot ? (
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 pb-28">{children}</main>

      {/* Bottom segmented control */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 pb-safe bg-white/95 backdrop-blur-xl border-t border-ink-3">
        <div className="max-w-screen-sm mx-auto px-4 py-3">
          <div className="bg-ink-2 rounded-full p-1 flex">
            {(['scoring', 'cup'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPanel(p)}
                className={`flex-1 py-2.5 rounded-full text-sm transition-all duration-200 tap-highlight-none ${
                  panel === p
                    ? 'bg-white shadow-card text-fg-1 font-semibold'
                    : 'text-fg-2'
                }`}
              >
                {p === 'scoring' ? 'Scoring' : 'Ryder Cup'}
              </button>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}

// Exposes a Link-y fallback for places that want a plain "open live scoring" tile.
export function LiveZoneLink({ matchId, children, className }: { matchId: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={`/live/${matchId}`} className={className}>
      {children}
    </Link>
  );
}

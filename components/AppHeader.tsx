import Link from 'next/link';
import Image from 'next/image';
import { theme } from '@/lib/theme';

interface AppHeaderProps {
  /** Page title (used in subpage mode). Ignored when `brand` is true. */
  title?: string;
  /** If set, renders a back button on the left. */
  backHref?: string;
  /** Optional slot rendered on the right side. */
  right?: React.ReactNode;
  /**
   * When true, render the brand lockup (lighthouse + app name) on the left
   * instead of a back button + centered page title. Use on top-level pages.
   */
  brand?: boolean;
}

export default function AppHeader({ title, backHref, right, brand }: AppHeaderProps) {
  // Brand mode: lighthouse + "SeaPines Cup 2026" on the left, no back button.
  if (brand) {
    return (
      <header className="glass sticky top-0 z-40 pt-safe">
        <div className="h-14 px-4 flex items-center justify-between gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0 tap-highlight-none" aria-label={theme.title}>
            <Image
              src={theme.logo}
              alt=""
              width={28}
              height={28}
              className="shrink-0"
              priority
            />
            <span className="font-bold tracking-tight text-fg-1 truncate">
              {theme.name}{' '}
              <span className="font-medium text-fg-3">{theme.year}</span>
            </span>
          </Link>
          <div className="flex items-center justify-end">
            {right ?? null}
          </div>
        </div>
      </header>
    );
  }

  // Subpage mode: back button + centered title (unchanged).
  return (
    <header className="glass sticky top-0 z-40 pt-safe">
      <div className="h-14 px-4 flex items-center justify-between gap-3">
        <div className="w-10 flex items-center">
          {backHref ? (
            <Link
              href={backHref}
              aria-label="Back"
              className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-fg-1 hover:bg-ink-2 active:scale-95 transition tap-highlight-none"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </Link>
          ) : null}
        </div>

        <h1 className="flex-1 text-center text-base font-semibold tracking-tight text-fg-1 truncate">
          {title}
        </h1>

        <div className="w-10 flex items-center justify-end">
          {right ?? null}
        </div>
      </div>
    </header>
  );
}

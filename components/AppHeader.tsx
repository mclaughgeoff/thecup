import Link from 'next/link';

interface AppHeaderProps {
  title: string;
  backHref?: string;
  right?: React.ReactNode;
}

export default function AppHeader({ title, backHref, right }: AppHeaderProps) {
  return (
    <header className="glass sticky top-0 z-40 pt-safe border-t-0 border-l-0 border-r-0">
      <div className="h-14 px-4 flex items-center justify-between gap-3">
        <div className="w-10 flex items-center">
          {backHref ? (
            <Link
              href={backHref}
              aria-label="Back"
              className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-fg-1 hover:bg-ink-3 active:scale-95 transition tap-highlight-none"
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

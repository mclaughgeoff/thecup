import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { theme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getSession();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen bg-hero-green text-cream relative overflow-hidden">
      {/* Ambient highlight — matches the Augusta preview's radial glow */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 80% 15%, rgba(245,235,214,0.22), transparent 55%)',
        }}
      />

      <div className="relative max-w-xl mx-auto px-6 pt-24 pb-16 flex flex-col min-h-screen">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <Image
            src={theme.logo}
            alt=""
            width={96}
            height={96}
            priority
            className="mb-6 drop-shadow-[0_6px_18px_rgba(0,0,0,0.25)]"
          />
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cream/80 mb-4">
            Sea Pines · May 13–17, 2026
          </p>
          <h1 className="text-6xl font-bold tracking-tight mb-4 text-cream">
            The <span className="text-white">Cup</span>
          </h1>
          <p className="text-base text-cream/80 mb-10 max-w-sm mx-auto">
            Sixteen players. Eight rounds. Two teams. One trophy.
          </p>

          <Link
            href="/auth/request-link"
            className="inline-flex items-center justify-center w-full py-4 rounded-xl bg-cream text-masters font-semibold text-base shadow-[0_8px_24px_rgba(0,0,0,0.18)] hover:bg-cream-light active:scale-[0.99] transition"
          >
            Sign in with magic link
          </Link>
        </div>

        <div className="pt-10 border-t border-cream/20 grid grid-cols-3 gap-3 text-center">
          {[
            { n: 16, label: 'players' },
            { n: 8, label: 'rounds' },
            { n: 3, label: 'courses' },
          ].map(({ n, label }) => (
            <div key={label}>
              <p className="text-2xl font-semibold text-cream">{n}</p>
              <p className="text-[10px] uppercase tracking-wider text-cream/60 mt-0.5">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getSession();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen bg-ink-0 text-fg-1 relative overflow-hidden">
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-20 bg-masters"
      />

      <div className="relative max-w-xl mx-auto px-6 pt-24 pb-16 flex flex-col min-h-screen">
        <div className="flex-1 flex flex-col justify-center text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold mb-4">
            Sea Pines · May 13–17, 2026
          </p>
          <h1 className="text-6xl font-bold tracking-tight mb-4">
            The <span className="text-masters-glow">Cup</span>
          </h1>
          <p className="text-base text-fg-2 mb-10 max-w-sm mx-auto">
            Sixteen players. Eight rounds. Two teams. One trophy.
          </p>

          <Link
            href="/auth/request-link"
            className="btn-primary w-full py-4 text-base"
          >
            Sign in with magic link
          </Link>
        </div>

        <div className="pt-10 border-t border-ink-3 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-semibold text-gold">16</p>
            <p className="text-[10px] uppercase tracking-wider text-fg-3 mt-0.5">players</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-gold">8</p>
            <p className="text-[10px] uppercase tracking-wider text-fg-3 mt-0.5">rounds</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-gold">3</p>
            <p className="text-[10px] uppercase tracking-wider text-fg-3 mt-0.5">courses</p>
          </div>
        </div>
      </div>
    </main>
  );
}

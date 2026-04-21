'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function MagicLinkContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing token');
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch('/api/auth/verify-magic-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Link is invalid or expired');
        } else {
          router.push('/dashboard');
        }
      } catch (err) {
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token, router]);

  return (
    <div className="card w-full max-w-sm text-center">
      {loading && (
        <>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-masters border-t-transparent mx-auto mb-4" />
          <p className="text-fg-2">Signing you in…</p>
        </>
      )}

      {error && !loading && (
        <>
          <h2 className="text-lg font-semibold text-danger mb-3">Error</h2>
          <p className="text-fg-2 text-sm mb-6">{error}</p>
          <a href="/auth/request-link" className="btn-primary inline-flex">
            Request new link
          </a>
        </>
      )}
    </div>
  );
}

export default function MagicLinkPage() {
  return (
    <main className="min-h-screen bg-ink-0 flex items-center justify-center px-4">
      <Suspense
        fallback={
          <div className="card w-full max-w-sm text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-masters border-t-transparent mx-auto mb-4" />
            <p className="text-fg-2">Loading…</p>
          </div>
        }
      >
        <MagicLinkContent />
      </Suspense>
    </main>
  );
}

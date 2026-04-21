'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RequestMagicLinkPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/request-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send magic link');
      } else {
        setSuccess('Magic link sent — check your email.');
        setEmail('');
        setTimeout(() => router.push('/'), 3000);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-ink-0 flex items-center justify-center px-4 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-3xl opacity-15 bg-masters"
      />

      <div className="relative card w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold mb-2">
              Sea Pines 2026
            </p>
            <h1 className="text-3xl font-bold">
              The <span className="text-masters-glow">Cup</span>
            </h1>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input"
            />
          </div>

          {error && (
            <div className="p-3 bg-danger/10 border border-danger/30 text-danger rounded-xl text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-success/10 border border-success/30 text-success rounded-xl text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Sending…' : 'Send magic link'}
          </button>
        </form>

        <p className="text-center text-fg-3 text-xs mt-6">
          Check your email for a sign-in link. Expires in 24 hours.
        </p>
      </div>
    </main>
  );
}

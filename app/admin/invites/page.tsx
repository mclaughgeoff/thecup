'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/BottomTabBar';
import PlayerAvatar from '@/components/PlayerAvatar';
import { CheckIcon } from '@/components/icons';

interface Player {
  id: string;
  name: string;
  email: string;
  photoUrl: string | null;
  inviteSent: boolean;
}

interface MePlayer {
  id: string;
  name: string;
  isAdmin: boolean;
}

export default function InvitesPage() {
  const [me, setMe] = useState<MePlayer | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) throw new Error('Unauthorized');
        const playerData = await res.json();
        if (!playerData.isAdmin) throw new Error('Not admin');
        setMe(playerData);

        const playersRes = await fetch('/api/players');
        if (!playersRes.ok) throw new Error('Failed to fetch players');
        const playersData = await playersRes.json();
        setPlayers(playersData);
      } catch (error) {
        router.push('/auth/request-link');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleSendInvite = async (playerId: string) => {
    setSending(true);
    try {
      const res = await fetch('/api/admin/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send invite');
      }

      setPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, inviteSent: true } : p))
      );
      setMessage({ type: 'success', text: 'Invite sent.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendAllInvites = async () => {
    setSending(true);
    try {
      const uninvitedIds = players.filter((p) => !p.inviteSent).map((p) => p.id);

      const res = await fetch('/api/admin/send-invites-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerIds: uninvitedIds }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send invites');
      }

      setPlayers((prev) => prev.map((p) => ({ ...p, inviteSent: true })));
      setMessage({
        type: 'success',
        text: `Sent ${uninvitedIds.length} invite(s).`,
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <>
        <AppHeader title="Invites" backHref="/admin" />
        <main className="min-h-[50vh] flex items-center justify-center bg-ink-0">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-masters border-t-transparent" />
        </main>
        <BottomTabBar />
      </>
    );
  }

  const uninvitedPlayers = players.filter((p) => !p.inviteSent);
  const invitedPlayers = players.filter((p) => p.inviteSent);

  return (
    <>
      <AppHeader title="Invites" backHref="/admin" />
      <main className="bg-ink-0 pb-nav">
        {message ? (
          <div className="px-4 pt-4">
            <div
              className={`p-3 rounded-xl text-sm border ${
                message.type === 'success'
                  ? 'bg-success/10 border-success/30 text-success'
                  : 'bg-danger/10 border-danger/30 text-danger'
              }`}
            >
              {message.text}
            </div>
          </div>
        ) : null}

        {uninvitedPlayers.length > 0 ? (
          <section className="px-4 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="label">Pending ({uninvitedPlayers.length})</h2>
            </div>

            <div className="card space-y-2">
              {uninvitedPlayers.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 p-3 bg-ink-2 border border-ink-3 rounded-xl"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <PlayerAvatar name={p.name} photoUrl={p.photoUrl} size="sm" />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{p.name}</p>
                      <p className="text-xs text-fg-3 truncate">{p.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSendInvite(p.id)}
                    disabled={sending}
                    className="btn-primary text-xs py-2 px-3"
                  >
                    Send
                  </button>
                </div>
              ))}

              <button
                onClick={handleSendAllInvites}
                disabled={sending}
                className="btn-primary w-full mt-2"
              >
                {sending ? 'Sending…' : `Send all ${uninvitedPlayers.length} invites`}
              </button>
            </div>
          </section>
        ) : null}

        {invitedPlayers.length > 0 ? (
          <section className="px-4 pt-6">
            <h2 className="label mb-3">Invited ({invitedPlayers.length})</h2>
            <div className="card space-y-2">
              {invitedPlayers.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3 bg-ink-2 border border-ink-3 rounded-xl"
                >
                  <PlayerAvatar name={p.name} photoUrl={p.photoUrl} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{p.name}</p>
                    <p className="text-xs text-fg-3 truncate">{p.email}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-success text-xs font-semibold">
                    <CheckIcon size={14} />
                    Sent
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {uninvitedPlayers.length === 0 && invitedPlayers.length === 0 ? (
          <div className="px-4 pt-8">
            <div className="card text-center">
              <p className="text-fg-2 text-sm">No players found.</p>
            </div>
          </div>
        ) : null}
      </main>
      <BottomTabBar isAdmin={me?.isAdmin} />
    </>
  );
}

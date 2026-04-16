'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import PlayerAvatar from '@/components/PlayerAvatar';

interface Player {
  id: string;
  name: string;
  email: string;
  photoUrl: string | null;
  inviteSent: boolean;
}

export default function InvitesPage() {
  const [player, setPlayer] = useState<any>(null);
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
        setPlayer(playerData);

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

      setPlayers(
        players.map(p => (p.id === playerId ? { ...p, inviteSent: true } : p))
      );
      setMessage({ type: 'success', text: 'Invite sent!' });
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
      const uninvitedIds = players.filter(p => !p.inviteSent).map(p => p.id);

      const res = await fetch('/api/admin/send-invites-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerIds: uninvitedIds }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send invites');
      }

      setPlayers(players.map(p => ({ ...p, inviteSent: true })));
      setMessage({
        type: 'success',
        text: `Sent ${uninvitedIds.length} invite(s)!`,
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
        <Header player={player} />
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-cup-green border-t-transparent"></div>
        </div>
      </>
    );
  }

  const uninvitedPlayers = players.filter(p => !p.inviteSent);
  const invitedPlayers = players.filter(p => p.inviteSent);

  return (
    <>
      <Header player={player} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-cup-navy mb-8">📧 Send Invites</h1>

        {message && (
          <div
            className={`p-4 rounded-lg mb-6 ${
              message.type === 'success'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        {uninvitedPlayers.length > 0 && (
          <div className="card mb-8">
            <h2 className="text-2xl font-bold text-cup-navy mb-4">
              ⏳ Pending Invites ({uninvitedPlayers.length})
            </h2>

            <div className="space-y-2 mb-6">
              {uninvitedPlayers.map(p => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <PlayerAvatar name={p.name} photoUrl={p.photoUrl} size="sm" />
                    <div>
                      <p className="font-semibold text-gray-800">{p.name}</p>
                      <p className="text-sm text-gray-600">{p.email}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSendInvite(p.id)}
                    disabled={sending}
                    className="btn-primary text-sm disabled:opacity-50"
                  >
                    {sending ? 'Sending...' : 'Send Invite'}
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleSendAllInvites}
              disabled={sending}
              className="w-full btn-primary disabled:opacity-50"
            >
              {sending ? 'Sending...' : `Send All ${uninvitedPlayers.length} Invites`}
            </button>
          </div>
        )}

        {invitedPlayers.length > 0 && (
          <div className="card">
            <h2 className="text-2xl font-bold text-cup-navy mb-4">
              ✅ Invited ({invitedPlayers.length})
            </h2>

            <div className="space-y-2">
              {invitedPlayers.map(p => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-4 bg-green-50 rounded-lg"
                >
                  <PlayerAvatar name={p.name} photoUrl={p.photoUrl} size="sm" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{p.name}</p>
                    <p className="text-sm text-gray-600">{p.email}</p>
                  </div>
                  <span className="text-green-600 font-semibold">✓ Sent</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {uninvitedPlayers.length === 0 && invitedPlayers.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-gray-600 text-lg">No players found</p>
          </div>
        )}

        <div className="mt-12 text-center">
          <a href="/admin" className="btn-outline">
            ← Back to Admin Panel
          </a>
        </div>
      </div>
    </>
  );
}

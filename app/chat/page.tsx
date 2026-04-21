'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/BottomTabBar';
import PlayerAvatar from '@/components/PlayerAvatar';

interface Message {
  id: string;
  content: string;
  player: {
    id: string;
    name: string;
    photoUrl: string | null;
  };
  createdAt: string;
}

interface Player {
  id: string;
  name: string;
  isAdmin: boolean;
}

export default function ChatPage() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) throw new Error('Failed to fetch player');
        const playerData = await res.json();
        setPlayer(playerData);

        const msgRes = await fetch('/api/chat/messages');
        if (!msgRes.ok) throw new Error('Failed to fetch messages');
        const messagesData = await msgRes.json();
        setMessages(messagesData);
      } catch (error) {
        router.push('/auth/request-link');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      });

      if (!res.ok) throw new Error('Failed to send message');
      const message = await res.json();
      setMessages([...messages, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <>
        <AppHeader title="Chat" />
        <main className="min-h-[50vh] flex items-center justify-center bg-ink-0">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-masters border-t-transparent" />
        </main>
        <BottomTabBar />
      </>
    );
  }

  if (!player) {
    return (
      <>
        <AppHeader title="Chat" />
        <main className="min-h-[50vh] flex items-center justify-center bg-ink-0">
          <p className="text-danger text-sm">Unable to load chat.</p>
        </main>
        <BottomTabBar />
      </>
    );
  }

  return (
    <>
      <AppHeader title="Team chat" />
      <main className="bg-ink-0 pb-[10.5rem]">
        <div className="px-3 pt-4 space-y-3">
          {messages.length === 0 ? (
            <p className="text-center text-fg-3 text-sm py-12">
              No messages yet. Start the conversation.
            </p>
          ) : (
            messages.map((msg) => {
              const mine = msg.player.id === player.id;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${mine ? 'flex-row-reverse' : ''}`}
                >
                  {!mine ? (
                    <PlayerAvatar
                      name={msg.player.name}
                      photoUrl={msg.player.photoUrl}
                      size="sm"
                    />
                  ) : null}

                  <div
                    className={`max-w-[75%] px-3.5 py-2 rounded-2xl ${
                      mine
                        ? 'bg-masters text-fg-1 rounded-br-md'
                        : 'bg-ink-2 text-fg-1 rounded-bl-md border border-ink-3'
                    }`}
                  >
                    {!mine ? (
                      <p className="text-[11px] font-semibold text-fg-2 mb-0.5">
                        {msg.player.name}
                      </p>
                    ) : null}
                    <p className="text-sm break-words whitespace-pre-wrap">
                      {msg.content}
                    </p>
                    <p className={`text-[10px] mt-1 ${mine ? 'text-fg-1/70' : 'text-fg-3'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Fixed input bar, sits just above the bottom tab bar */}
      <form
        onSubmit={handleSendMessage}
        className="glass fixed left-0 right-0 z-30 px-3 py-2 flex items-center gap-2"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0) + 3.5rem)' }}
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Message"
          className="input flex-1 py-2.5 rounded-full px-4"
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="btn-primary rounded-full px-5 py-2.5"
        >
          {sending ? '…' : 'Send'}
        </button>
      </form>

      <BottomTabBar isAdmin={player.isAdmin} />
    </>
  );
}

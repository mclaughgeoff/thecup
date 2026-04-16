'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
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
        <Header player={undefined} />
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-cup-green border-t-transparent"></div>
        </div>
      </>
    );
  }

  if (!player) {
    return (
      <>
        <Header player={undefined} />
        <div className="text-center py-20">
          <p className="text-red-600">Unable to load chat</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header player={player} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-cup-navy mb-8">💬 Team Chat</h1>

        <div className="card h-96 flex flex-col overflow-hidden mb-4">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <p className="text-center text-gray-500 py-12">
                No messages yet. Start the conversation!
              </p>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.player.id === player.id ? 'justify-end' : ''}`}
                >
                  {msg.player.id !== player.id && (
                    <PlayerAvatar name={msg.player.name} photoUrl={msg.player.photoUrl} size="sm" />
                  )}

                  <div
                    className={`max-w-xs ${
                      msg.player.id === player.id
                        ? 'bg-cup-green text-white rounded-2xl rounded-br-none'
                        : 'bg-gray-100 text-gray-800 rounded-2xl rounded-bl-none'
                    } px-4 py-2`}
                  >
                    {msg.player.id !== player.id && (
                      <p className="font-semibold text-xs mb-1 opacity-75">
                        {msg.player.name}
                      </p>
                    )}
                    <p className="break-words">{msg.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="border-t p-4 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-cup-green"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="btn-primary rounded-full px-6 disabled:opacity-50"
            >
              {sending ? '...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

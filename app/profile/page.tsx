'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/BottomTabBar';
import PlayerAvatar from '@/components/PlayerAvatar';
import { formatHandicap } from '@/lib/utils';

interface Player {
  id: string;
  email: string;
  name: string;
  nickname: string | null;
  handicap: number;
  photoUrl: string | null;
  arrivalDate: string | null;
  arrivalTime: string | null;
  arrivalAirport: string | null;
  arrivalFlight: string | null;
  departureDate: string | null;
  departureTime: string | null;
  departureAirport: string | null;
  departureFlight: string | null;
  isAdmin: boolean;
}

interface Round {
  id: string;
  roundNumber: number;
  dayOfWeek: string;
  course: string;
  teeTime: string;
  format: string;
  isRyderCup: boolean;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="label">{children}</label>;
}

export default function ProfilePage() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [formData, setFormData] = useState<Partial<Player>>({});
  const [rounds, setRounds] = useState<Round[]>([]);
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setMessage(null);

    try {
      const body = new FormData();
      body.append('file', file);

      const res = await fetch('/api/players/upload-photo', {
        method: 'POST',
        body,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload photo');

      setPlayer(prev => (prev ? { ...prev, photoUrl: data.photoUrl } : prev));
      setMessage({ type: 'success', text: 'Photo updated.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Upload failed',
      });
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [meRes, roundsRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/players/rounds'),
        ]);
        if (!meRes.ok) throw new Error('Failed to fetch player');
        const me = await meRes.json();
        setPlayer(me);
        setFormData(me);

        if (roundsRes.ok) {
          const data = await roundsRes.json();
          setRounds(data.rounds);
          setAvailability(data.availability);
        }
      } catch (error) {
        router.push('/auth/request-link');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value || null,
    }));
  };

  const toggleAvailability = (roundId: string) => {
    setAvailability((prev) => ({ ...prev, [roundId]: !prev[roundId] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const [profRes, availRes] = await Promise.all([
        fetch('/api/players/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }),
        fetch('/api/players/availability', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roundIds: rounds.filter((r) => availability[r.id] !== false).map((r) => r.id),
          }),
        }),
      ]);

      if (!profRes.ok) {
        const data = await profRes.json();
        throw new Error(data.error || 'Failed to update profile');
      }
      if (!availRes.ok) {
        const data = await availRes.json();
        throw new Error(data.error || 'Failed to update availability');
      }

      setMessage({ type: 'success', text: 'Profile saved.' });
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <AppHeader title="Profile" backHref="/dashboard" />
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
        <AppHeader title="Profile" backHref="/dashboard" />
        <main className="min-h-[50vh] flex items-center justify-center bg-ink-0">
          <p className="text-danger text-sm">Unable to load profile.</p>
        </main>
        <BottomTabBar />
      </>
    );
  }

  return (
    <>
      <AppHeader title="Profile" backHref="/dashboard" />
      <main className="bg-ink-0 pb-nav">
        <form onSubmit={handleSubmit} className="px-4 pt-4 space-y-4">
          {/* Photo + identity */}
          <section className="card-elevated flex flex-col items-center text-center">
            <PlayerAvatar name={player.name} photoUrl={player.photoUrl} size="xl" />
            <h1 className="mt-4 text-xl font-semibold">{player.name}</h1>
            <p className="text-xs text-fg-3">{player.email}</p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={uploadingPhoto}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="btn-ghost mt-4"
            >
              {uploadingPhoto ? 'Uploading…' : 'Change photo'}
            </button>
            <p className="text-[10px] text-fg-3 mt-2">JPEG, PNG or WebP · max 2 MB</p>
          </section>

          {/* Basic info */}
          <section className="card">
            <h2 className="label mb-3">Basics</h2>
            <div className="space-y-3">
              <div>
                <FieldLabel>Nickname</FieldLabel>
                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname || ''}
                  onChange={handleChange}
                  placeholder="Optional"
                  className="input"
                />
              </div>

              <div>
                <FieldLabel>Handicap</FieldLabel>
                <div className="flex items-center justify-between bg-ink-2 border border-ink-3 rounded-xl px-3 py-3">
                  <span className="text-2xl font-mono text-gold">
                    {formatHandicap(formData.handicap ?? 0)}
                  </span>
                  <span className="text-[10px] text-fg-3 text-right">
                    Set by an admin<br />Contact Geoff to update
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Rounds */}
          {rounds.length > 0 ? (
            <section className="card">
              <h2 className="label mb-3">Rounds you're playing</h2>
              <div className="space-y-2">
                {rounds.map((r) => {
                  const on = availability[r.id] !== false;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => toggleAvailability(r.id)}
                      className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border transition text-left tap-highlight-none ${
                        on
                          ? 'bg-masters/10 border-masters/60'
                          : 'bg-ink-2 border-ink-3'
                      }`}
                    >
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-fg-3">
                          Round {r.roundNumber} · {r.dayOfWeek}
                        </p>
                        <p className="text-sm font-semibold mt-0.5">{r.course}</p>
                        <p className="text-xs text-fg-3 mt-0.5">
                          {r.teeTime} · {r.format}
                        </p>
                      </div>
                      <span
                        className={`pill ${
                          on
                            ? 'border-masters-glow/60 text-masters-glow'
                            : 'border-ink-3 text-fg-3'
                        }`}
                      >
                        {on ? 'In' : 'Out'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          {/* Arrival */}
          <section className="card">
            <h2 className="label mb-3">Arrival</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Date</FieldLabel>
                <input
                  type="date"
                  name="arrivalDate"
                  value={formData.arrivalDate || ''}
                  onChange={handleChange}
                  className="input"
                />
              </div>
              <div>
                <FieldLabel>Time</FieldLabel>
                <input
                  type="time"
                  name="arrivalTime"
                  value={formData.arrivalTime || ''}
                  onChange={handleChange}
                  className="input"
                />
              </div>
              <div>
                <FieldLabel>Airport</FieldLabel>
                <input
                  type="text"
                  name="arrivalAirport"
                  value={formData.arrivalAirport || ''}
                  onChange={handleChange}
                  placeholder="SAV"
                  className="input"
                />
              </div>
              <div>
                <FieldLabel>Flight</FieldLabel>
                <input
                  type="text"
                  name="arrivalFlight"
                  value={formData.arrivalFlight || ''}
                  onChange={handleChange}
                  placeholder="JB 249"
                  className="input"
                />
              </div>
            </div>
          </section>

          {/* Departure */}
          <section className="card">
            <h2 className="label mb-3">Departure</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Date</FieldLabel>
                <input
                  type="date"
                  name="departureDate"
                  value={formData.departureDate || ''}
                  onChange={handleChange}
                  className="input"
                />
              </div>
              <div>
                <FieldLabel>Time</FieldLabel>
                <input
                  type="time"
                  name="departureTime"
                  value={formData.departureTime || ''}
                  onChange={handleChange}
                  className="input"
                />
              </div>
              <div>
                <FieldLabel>Airport</FieldLabel>
                <input
                  type="text"
                  name="departureAirport"
                  value={formData.departureAirport || ''}
                  onChange={handleChange}
                  placeholder="SAV"
                  className="input"
                />
              </div>
              <div>
                <FieldLabel>Flight</FieldLabel>
                <input
                  type="text"
                  name="departureFlight"
                  value={formData.departureFlight || ''}
                  onChange={handleChange}
                  placeholder="JB 250"
                  className="input"
                />
              </div>
            </div>
          </section>

          {message ? (
            <div
              className={`p-3 rounded-xl text-sm border ${
                message.type === 'success'
                  ? 'bg-success/10 border-success/30 text-success'
                  : 'bg-danger/10 border-danger/30 text-danger'
              }`}
            >
              {message.text}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </main>
      <BottomTabBar isAdmin={player.isAdmin} />
    </>
  );
}

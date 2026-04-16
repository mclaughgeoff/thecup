'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { formatHandicap } from '@/lib/utils';

interface Player {
  id: string;
  email: string;
  name: string;
  nickname: string | null;
  handicap: number;
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

export default function ProfilePage() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [formData, setFormData] = useState<Partial<Player>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) throw new Error('Failed to fetch player');
        const data = await res.json();
        setPlayer(data);
        setFormData(data);
      } catch (error) {
        router.push('/auth/request-link');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayer();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value || null,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/players/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      setMessage({ type: 'success', text: 'Profile updated!' });
      setTimeout(() => router.push('/dashboard'), 2000);
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
          <p className="text-red-600">Unable to load profile</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header player={{ id: player.id, name: player.name, isAdmin: player.isAdmin }} />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-cup-navy mb-8">👤 My Profile</h1>

        <form onSubmit={handleSubmit} className="card space-y-6">
          {/* Basic Info */}
          <fieldset>
            <legend className="text-xl font-bold text-cup-navy mb-4">Basic Information</legend>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  disabled
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nickname
                </label>
                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname || ''}
                  onChange={handleChange}
                  placeholder="Optional"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Handicap
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    name="handicap"
                    value={formData.handicap || ''}
                    onChange={handleChange}
                    step="0.1"
                    className="flex-1 mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <span className="text-2xl font-bold text-cup-green">
                    {formatHandicap(formData.handicap || 0)}
                  </span>
                </div>
              </div>
            </div>
          </fieldset>

          {/* Arrival */}
          <fieldset>
            <legend className="text-xl font-bold text-cup-navy mb-4">Arrival</legend>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <input
                    type="date"
                    name="arrivalDate"
                    value={formData.arrivalDate || ''}
                    onChange={handleChange}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Time
                  </label>
                  <input
                    type="time"
                    name="arrivalTime"
                    value={formData.arrivalTime || ''}
                    onChange={handleChange}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Airport
                  </label>
                  <input
                    type="text"
                    name="arrivalAirport"
                    value={formData.arrivalAirport || ''}
                    onChange={handleChange}
                    placeholder="e.g., SAV"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Flight Number
                  </label>
                  <input
                    type="text"
                    name="arrivalFlight"
                    value={formData.arrivalFlight || ''}
                    onChange={handleChange}
                    placeholder="e.g., AA123"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </fieldset>

          {/* Departure */}
          <fieldset>
            <legend className="text-xl font-bold text-cup-navy mb-4">Departure</legend>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <input
                    type="date"
                    name="departureDate"
                    value={formData.departureDate || ''}
                    onChange={handleChange}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Time
                  </label>
                  <input
                    type="time"
                    name="departureTime"
                    value={formData.departureTime || ''}
                    onChange={handleChange}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Airport
                  </label>
                  <input
                    type="text"
                    name="departureAirport"
                    value={formData.departureAirport || ''}
                    onChange={handleChange}
                    placeholder="e.g., SAV"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Flight Number
                  </label>
                  <input
                    type="text"
                    name="departureFlight"
                    value={formData.departureFlight || ''}
                    onChange={handleChange}
                    placeholder="e.g., AA123"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </fieldset>

          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="btn-outline"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

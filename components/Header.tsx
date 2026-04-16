'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Player {
  id: string;
  name: string;
  isAdmin: boolean;
}

export default function Header({ player }: { player?: Player }) {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  return (
    <header className="golf-bg text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-2xl font-bold text-cup-gold">
          ⛳ The Cup
        </Link>

        {player ? (
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex gap-6">
              <Link href="/dashboard" className="hover:text-cup-gold transition">
                Dashboard
              </Link>
              <Link href="/schedule" className="hover:text-cup-gold transition">
                Schedule
              </Link>
              <Link href="/leaderboard" className="hover:text-cup-gold transition">
                Leaderboard
              </Link>
              <Link href="/players" className="hover:text-cup-gold transition">
                Players
              </Link>
              <Link href="/housing" className="hover:text-cup-gold transition">
                Housing
              </Link>
              {player.isAdmin && (
                <Link href="/admin" className="hover:text-cup-gold transition">
                  Admin
                </Link>
              )}
            </nav>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition"
              >
                <span className="text-sm">{player.name}</span>
                <span className="text-lg">▼</span>
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-lg overflow-hidden">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    My Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowMenu(!showMenu)}
              className="md:hidden text-xl"
            >
              ☰
            </button>
          </div>
        ) : (
          <Link href="/auth/request-link" className="btn-primary text-sm">
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}

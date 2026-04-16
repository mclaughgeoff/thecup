import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const session = await getSession();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen golf-bg text-white">
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-cup-gold">⛳ The Cup</h1>
          <h2 className="text-2xl md:text-3xl font-semibold mb-2">Sea Pines 2026</h2>
          <p className="text-lg text-gray-200 mb-8">
            Annual Ryder Cup Golf Trip · May 13–17, 2026
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white bg-opacity-10 rounded-lg p-6 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-cup-gold mb-2">16 Players</h3>
            <p className="text-gray-200">Two teams of 8 competing in match play</p>
          </div>

          <div className="bg-white bg-opacity-10 rounded-lg p-6 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-cup-gold mb-2">8 Rounds</h3>
            <p className="text-gray-200">Foursomes, Four-ball, Scramble, Singles & Casual</p>
          </div>

          <div className="bg-white bg-opacity-10 rounded-lg p-6 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-cup-gold mb-2">3 Courses</h3>
            <p className="text-gray-200">Harbour Town, Heron Point & Atlantic Dunes</p>
          </div>
        </div>

        <div className="text-center">
          <a
            href="/auth/request-link"
            className="inline-block bg-cup-gold text-cup-navy px-8 py-4 rounded-lg font-bold text-lg hover:bg-opacity-90 transition-all"
          >
            Sign In to The Cup
          </a>
        </div>

        <div className="mt-20 grid md:grid-cols-2 gap-10">
          <div>
            <h3 className="text-2xl font-bold mb-4">The Trip</h3>
            <ul className="space-y-2 text-gray-200">
              <li>✓ May 13–17 at Sea Pines Resort, Hilton Head</li>
              <li>✓ 4 luxury villas with oceanfront views</li>
              <li>✓ Daily golf on championship courses</li>
              <li>✓ Competitive Ryder Cup format</li>
              <li>✓ Team dinners & celebrations</li>
            </ul>
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-4">Features</h3>
            <ul className="space-y-2 text-gray-200">
              <li>✓ Live scoring & match updates</li>
              <li>✓ Real-time leaderboard</li>
              <li>✓ Schedule & tee times</li>
              <li>✓ Player profiles & handicaps</li>
              <li>✓ Housing & travel info</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

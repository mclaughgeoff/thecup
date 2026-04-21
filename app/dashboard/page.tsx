import { requireAuth } from '@/lib/auth';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/BottomTabBar';
import PlayerAvatar from '@/components/PlayerAvatar';
import SectionCard from '@/components/SectionCard';
import {
  CalendarIcon,
  TrophyIcon,
  UsersIcon,
  HouseIcon,
  ChatIcon,
  UserIcon,
  SettingsIcon,
  MailIcon,
  ArrowRightIcon,
} from '@/components/icons';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import type { ComponentType } from 'react';

export const dynamic = 'force-dynamic';

function formatRoundDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default async function DashboardPage() {
  try {
    const session = await requireAuth();

    const player = await prisma.player.findUnique({
      where: { id: session.playerId },
      include: { villa: true },
    });

    if (!player) {
      redirect('/');
    }

    const nextRound = await prisma.round.findFirst({
      where: { date: { gte: new Date() } },
      orderBy: { date: 'asc' },
    });

    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    const firstName = player.nickname || player.name.split(' ')[0];

    const quickLinks: Array<{
      href: string;
      label: string;
      sub: string;
      Icon: ComponentType<{ size?: number; className?: string }>;
    }> = [
      { href: '/schedule',    label: 'Schedule',    sub: '8 rounds',      Icon: CalendarIcon },
      { href: '/ryder-cup',   label: 'Ryder Cup',   sub: 'Live scoring',  Icon: TrophyIcon   },
      { href: '/players',     label: 'Players',     sub: 'Roster',        Icon: UsersIcon    },
      { href: '/housing',     label: 'Housing',     sub: '4 villas',      Icon: HouseIcon    },
      { href: '/dinners',     label: 'Meals',       sub: 'Lunch + dinner', Icon: MailIcon    },
      { href: '/chat',        label: 'Chat',        sub: 'Team feed',     Icon: ChatIcon     },
      { href: '/profile',     label: 'Profile',     sub: 'Your info',     Icon: UserIcon     },
    ];

    return (
      <>
        <AppHeader title="The Cup" />
        <main className="bg-ink-0 pb-nav">
          <section className="px-4 pt-6 pb-4">
            <div className="flex items-center gap-3">
              <PlayerAvatar name={player.name} photoUrl={player.photoUrl} size="lg" />
              <div>
                <p className="text-xs uppercase tracking-wider text-fg-3">Welcome back</p>
                <h1 className="text-2xl font-semibold">{firstName}</h1>
              </div>
            </div>
          </section>

          {nextRound ? (
            <section className="px-4 pb-4">
              <SectionCard tone="gold" className="relative overflow-hidden">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-gold">
                      Next round
                    </p>
                    <p className="text-xl font-semibold mt-1">{nextRound.course}</p>
                    <p className="text-sm text-fg-2 mt-0.5">
                      {formatRoundDate(nextRound.date)} · {nextRound.teeTime}
                    </p>
                  </div>
                  <span
                    className={`pill ${
                      nextRound.isRyderCup
                        ? 'border-masters/60 text-masters-glow'
                        : 'border-ink-3 text-fg-2'
                    }`}
                  >
                    {nextRound.isRyderCup ? 'Ryder Cup' : 'Casual'}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-fg-2">{nextRound.format}</span>
                  <Link
                    href="/schedule"
                    className="text-masters-glow font-semibold inline-flex items-center gap-1"
                  >
                    View schedule
                    <ArrowRightIcon size={14} />
                  </Link>
                </div>
              </SectionCard>
            </section>
          ) : null}

          <section className="px-4 pb-6">
            <h2 className="label mb-3">Quick actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickLinks.map(({ href, label, sub, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="card hover:border-fg-3 transition tap-highlight-none"
                >
                  <div className="w-9 h-9 rounded-lg bg-ink-2 border border-ink-3 flex items-center justify-center text-fg-2 mb-3">
                    <Icon size={18} />
                  </div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-xs text-fg-3 mt-0.5">{sub}</p>
                </Link>
              ))}
              {player.isAdmin ? (
                <Link
                  href="/admin"
                  className="card border-gold/40 hover:border-gold transition tap-highlight-none"
                >
                  <div className="w-9 h-9 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center text-gold mb-3">
                    <SettingsIcon size={18} />
                  </div>
                  <p className="font-semibold text-gold">Admin</p>
                  <p className="text-xs text-fg-3 mt-0.5">Manage the trip</p>
                </Link>
              ) : null}
            </div>
          </section>

          {announcements.length > 0 ? (
            <section className="px-4 pb-6">
              <h2 className="label mb-3">Latest announcements</h2>
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <SectionCard key={ann.id}>
                    <h3 className="font-semibold">{ann.title}</h3>
                    <p className="text-sm text-fg-2 mt-1">{ann.content}</p>
                    <p className="text-[11px] text-fg-3 mt-3">
                      {ann.createdAt.toLocaleDateString()}
                    </p>
                  </SectionCard>
                ))}
              </div>
            </section>
          ) : null}
        </main>
        <BottomTabBar isAdmin={player.isAdmin} />
      </>
    );
  } catch (error) {
    redirect('/auth/request-link');
  }
}

import { requireAdmin } from '@/lib/auth';
import AppHeader from '@/components/AppHeader';
import BottomTabBar from '@/components/BottomTabBar';
import {
  MailIcon,
  HouseIcon,
  CalendarIcon,
  TrophyIcon,
  UserIcon,
  ChatIcon,
  CheckIcon,
  ChartIcon,
} from '@/components/icons';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import type { ComponentType } from 'react';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await requireAdmin();

  const player = await prisma.player.findUnique({
    where: { id: session.playerId },
  });

  const [players, rounds, teams, meals, matchesTotal, formatsTotal] = await Promise.all([
    prisma.player.findMany(),
    prisma.round.findMany(),
    prisma.ryderCupTeam.findMany({ include: { members: true } }),
    prisma.mealReservation.count(),
    prisma.match.count(),
    prisma.format.count(),
  ]);

  const uninvited = players.filter((p) => !p.inviteSent).length;
  const assigned = teams.reduce((sum, t) => sum + t.members.length, 0);

  const sections: Array<{
    href: string;
    label: string;
    sub: string;
    Icon: ComponentType<{ size?: number; className?: string }>;
  }> = [
    { href: '/admin/ryder-cup',     label: 'Ryder Cup',   sub: `${assigned}/${players.length} assigned · ${matchesTotal} matches`, Icon: TrophyIcon  },
    { href: '/admin/players',       label: 'Players',     sub: `${players.length} total · ${uninvited} uninvited`,                 Icon: UserIcon    },
    { href: '/admin/availability',  label: 'Availability',sub: `Who's playing each round`,                                         Icon: CheckIcon   },
    { href: '/admin/rounds',        label: 'Rounds',      sub: `${rounds.length} scheduled`,                                        Icon: CalendarIcon },
    { href: '/admin/formats',       label: 'Formats',     sub: `${formatsTotal} scoring formats`,                                   Icon: ChartIcon   },
    { href: '/admin/dinners',       label: 'Meals',       sub: `${meals} reservations`,                                             Icon: ChatIcon    },
    { href: '/admin/housing',       label: 'Housing',     sub: '4 villas',                                                          Icon: HouseIcon   },
    { href: '/admin/invites',       label: 'Invites',     sub: `${uninvited} pending`,                                              Icon: MailIcon    },
  ];

  return (
    <>
      <AppHeader title="Admin" backHref="/dashboard" />
      <main className="bg-ink-0 pb-nav">
        <section className="px-4 pt-4 grid grid-cols-2 gap-3">
          {sections.map(({ href, label, sub, Icon }) => (
            <Link
              key={href}
              href={href}
              className="card border-gold/30 hover:border-gold transition tap-highlight-none"
            >
              <div className="w-9 h-9 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center text-gold mb-3">
                <Icon size={18} />
              </div>
              <p className="font-semibold text-gold">{label}</p>
              <p className="text-xs text-fg-3 mt-0.5">{sub}</p>
            </Link>
          ))}
        </section>

        <section className="px-4 pt-6">
          <h2 className="label mb-3">Stats</h2>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Players"  value={players.length} />
            <Stat label="Invited"  value={players.filter((p) => p.inviteSent).length} />
            <Stat label="Rounds"   value={rounds.length} />
            <Stat label="RC rounds" value={rounds.filter((r) => r.isRyderCup).length} />
            <Stat label="Matches"  value={matchesTotal} />
            <Stat label="Meals"    value={meals} />
          </div>
        </section>
      </main>
      <BottomTabBar isAdmin={player?.isAdmin} />
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card text-center">
      <p className="text-3xl font-mono font-semibold text-masters-glow">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-fg-3 mt-1">{label}</p>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import clsx from 'clsx';
import BottomSheet from './BottomSheet';
import type { ComponentType, SVGProps } from 'react';
import {
  HomeIcon,
  CalendarIcon,
  TrophyIcon,
  ChatIcon,
  MoreIcon,
  UsersIcon,
  HouseIcon,
  UserIcon,
  SettingsIcon,
  SignOutIcon,
  MailIcon,
} from './icons';

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

interface BottomTabBarProps {
  isAdmin?: boolean;
}

type Tab = {
  key: string;
  label: string;
  href?: string;
  match?: (path: string) => boolean;
  icon: React.ReactNode;
  onClick?: () => void;
};

export default function BottomTabBar({ isAdmin = false }: BottomTabBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  const tabs: Tab[] = [
    {
      key: 'home',
      label: 'Home',
      href: '/dashboard',
      match: (p) => p === '/dashboard',
      icon: <HomeIcon size={22} />,
    },
    {
      key: 'schedule',
      label: 'Schedule',
      href: '/schedule',
      match: (p) => p.startsWith('/schedule'),
      icon: <CalendarIcon size={22} />,
    },
    {
      key: 'rc',
      label: 'Ryder Cup',
      href: '/ryder-cup',
      match: (p) => p.startsWith('/ryder-cup') || p.startsWith('/leaderboard'),
      icon: <TrophyIcon size={22} />,
    },
    {
      key: 'chat',
      label: 'Chat',
      href: '/chat',
      match: (p) => p.startsWith('/chat'),
      icon: <ChatIcon size={22} />,
    },
    {
      key: 'more',
      label: 'More',
      match: (p) =>
        p.startsWith('/players') ||
        p.startsWith('/housing') ||
        p.startsWith('/profile') ||
        p.startsWith('/admin') ||
        p.startsWith('/dinners'),
      icon: <MoreIcon size={22} />,
      onClick: () => setMoreOpen(true),
    },
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setMoreOpen(false);
    router.push('/');
  };

  const moreLinks: Array<{ href: string; label: string; Icon: IconComponent }> = [
    { href: '/players', label: 'Teams', Icon: UsersIcon },
    { href: '/housing', label: 'Housing', Icon: HouseIcon },
    { href: '/dinners', label: 'Meals',   Icon: MailIcon  },
    { href: '/profile', label: 'Profile', Icon: UserIcon  },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin', Icon: SettingsIcon }] : []),
  ];

  return (
    <>
      <nav
        aria-label="Primary"
        className="glass fixed bottom-0 left-0 right-0 z-30 pb-safe border-b-0 border-t border-ink-3"
      >
        <ul className="grid grid-cols-5">
          {tabs.map((tab) => {
            const active = tab.match ? tab.match(pathname ?? '') : false;
            const color = active ? 'text-masters' : 'text-fg-3';
            const content = (
              <div className="flex flex-col items-center gap-1">
                <span
                  className={clsx(
                    'flex items-center justify-center rounded-xl px-3 py-1 transition',
                    active ? 'bg-masters/10 text-masters' : 'text-fg-3',
                  )}
                >
                  {tab.icon}
                </span>
                <span className={clsx('text-[10px] font-medium', color)}>{tab.label}</span>
              </div>
            );

            return (
              <li key={tab.key}>
                {tab.href && !tab.onClick ? (
                  <Link
                    href={tab.href}
                    aria-label={tab.label}
                    aria-current={active ? 'page' : undefined}
                    className="w-full h-14 flex items-center justify-center tap-highlight-none"
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={tab.onClick}
                    aria-label={tab.label}
                    aria-current={active ? 'page' : undefined}
                    className="w-full h-14 flex items-center justify-center tap-highlight-none"
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <BottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <div className="flex flex-col gap-1 pb-2">
          {moreLinks.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMoreOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-ink-2 active:scale-[0.99] transition tap-highlight-none"
            >
              <span className="text-fg-2 w-6 flex items-center justify-center">
                <Icon size={20} />
              </span>
              <span className="text-base font-medium text-fg-1">{label}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 flex items-center gap-3 px-4 py-3 rounded-xl text-danger hover:bg-danger/10 active:scale-[0.99] transition text-left"
          >
            <span className="w-6 flex items-center justify-center">
              <SignOutIcon size={20} />
            </span>
            <span className="text-base font-medium">Sign out</span>
          </button>
        </div>
      </BottomSheet>
    </>
  );
}

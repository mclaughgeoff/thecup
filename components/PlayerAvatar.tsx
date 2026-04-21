import { getInitials } from '@/lib/utils';
import clsx from 'clsx';

interface PlayerAvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  ring?: boolean;
}

export default function PlayerAvatar({ name, photoUrl, size = 'md', ring = true }: PlayerAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-28 h-28 text-2xl',
  };

  const initials = getInitials(name);

  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center font-bold bg-ink-2 text-masters flex-shrink-0 overflow-hidden',
        ring && 'ring-1 ring-ink-3',
        sizeClasses[size],
      )}
      title={name}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

import clsx from 'clsx';

interface SectionCardProps {
  children: React.ReactNode;
  tone?: 'default' | 'elevated' | 'masters' | 'gold' | 'teamA' | 'teamB';
  className?: string;
  as?: 'div' | 'section' | 'article' | 'a';
  href?: string;
  id?: string;
}

const toneClasses: Record<NonNullable<SectionCardProps['tone']>, string> = {
  default:  'bg-ink-1 border-ink-3',
  elevated: 'bg-ink-2 border-ink-3',
  masters:  'bg-ink-1 border-masters/50',
  gold:     'bg-ink-1 border-gold/40',
  teamA:    'bg-ink-1 border-teamA/60',
  teamB:    'bg-ink-1 border-teamB/60',
};

export default function SectionCard({
  children,
  tone = 'default',
  className,
  as: Tag = 'div',
  href,
  id,
}: SectionCardProps) {
  const classes = clsx(
    'rounded-2xl border p-4',
    toneClasses[tone],
    className,
  );

  if (Tag === 'a' && href) {
    return (
      <a
        id={id}
        href={href}
        className={clsx(classes, 'block transition hover:border-fg-3 active:scale-[0.99] tap-highlight-none')}
      >
        {children}
      </a>
    );
  }

  return (
    <Tag id={id} className={classes}>
      {children}
    </Tag>
  );
}

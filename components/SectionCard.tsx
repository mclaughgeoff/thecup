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
  default:  'bg-white border-ink-3 shadow-card',
  elevated: 'bg-white border-transparent shadow-elev',
  masters:  'bg-white border-masters/25 shadow-card',
  // "gold" is legacy — now the green-tinted hero treatment (Masters gradient)
  gold:     'bg-gradient-to-br from-masters/10 to-masters/5 border-masters/20 shadow-hero',
  teamA:    'bg-white border-teamA/40 shadow-card',
  teamB:    'bg-white border-teamB/40 shadow-card',
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
    'rounded-2xl border p-4 transition-all duration-200 ease-out',
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

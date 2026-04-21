import clsx from 'clsx';

export type FormatKey = 'fourball' | 'singles' | 'scramble' | 'skins' | 'unknown';

interface FormatBadgeProps {
  /** Format display name, e.g. "Four-Ball", "Singles", "Scramble", "Skins". */
  format?: string | null;
  /** Optional explicit slug; overrides `format` string matching. */
  slug?: string | null;
  /** Visual size — `xs` for dense lists, `sm` (default) for cards. */
  size?: 'xs' | 'sm';
  className?: string;
}

/** Normalize an arbitrary format string/slug into one of our known keys. */
export function formatKey(input: string | null | undefined): FormatKey {
  if (!input) return 'unknown';
  const k = input.toLowerCase().replace(/[\s\-_]+/g, '');
  if (k.includes('fourball') || k === '4ball' || k === 'bestball') return 'fourball';
  if (k.includes('single')) return 'singles';
  if (k.includes('scramble')) return 'scramble';
  if (k.includes('skin')) return 'skins';
  return 'unknown';
}

const STYLES: Record<FormatKey, { bg: string; fg: string; label: string }> = {
  fourball: { bg: 'bg-format-fourball', fg: 'text-white',         label: 'Four-Ball' },
  singles:  { bg: 'bg-format-singles',  fg: 'text-white',         label: 'Singles'   },
  scramble: { bg: 'bg-format-scramble', fg: 'text-white',         label: 'Scramble'  },
  skins:    { bg: 'bg-format-skins',    fg: 'text-[#3a2a00]',     label: 'Skins'     },
  unknown:  { bg: 'bg-ink-2',           fg: 'text-fg-2',          label: '—'         },
};

export default function FormatBadge({ format, slug, size = 'sm', className }: FormatBadgeProps) {
  const key = formatKey(slug ?? format);
  const style = STYLES[key];
  // Prefer the caller-provided label when we recognized a format; if unknown,
  // fall back to the raw string (so an exotic format still shows its name).
  const label = key === 'unknown' ? (format?.trim() || style.label) : style.label;

  return (
    <span
      className={clsx(
        'inline-flex items-center font-bold uppercase tracking-wider rounded-md',
        size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5',
        style.bg,
        style.fg,
        className,
      )}
    >
      {label}
    </span>
  );
}

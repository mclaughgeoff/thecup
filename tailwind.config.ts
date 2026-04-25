import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces (light)
        ink: {
          0: '#FFFFFF', // app background
          1: '#FAFAFA', // card surface
          2: '#F5F5F7', // nested surface / input bg
          3: '#E5E7EB', // borders, dividers
        },
        // Text
        fg: {
          1: '#0A0A0A', // primary text (warm near-black)
          2: '#4B5563', // secondary
          3: '#9CA3AF', // tertiary / captions
        },
        // Brand — Masters / Augusta green
        masters: {
          DEFAULT: '#006747', // primary
          light:   '#0A8A5F', // hover / lighter accents
          glow:    '#004D33', // strong emphasis / pressed
          dark:    '#003826', // darkest shade (hero gradient stop)
        },
        // Warm cream accent — reads well on dark green surfaces
        cream: {
          DEFAULT: '#F5EBD6',
          light:   '#FBF6E6',
          dark:    '#E8DBC0',
        },
        // Gold token kept for backwards compat — routed to Masters green.
        // If a future leaderboard/trophy needs a warm accent, introduce `amber`.
        gold: {
          DEFAULT: '#006747',
          muted:   '#0A8A5F',
        },
        // Team colors — brand identities for the two Ryder Cup sides.
        // Static tokens are *defaults*; per-team colors stored in the DB
        // override these via inline style.
        teamA: '#C41E3A', // red (legacy alias, mirrors alpha.500)
        teamB: '#003DA5', // blue (legacy alias, mirrors bravo.500)
        alpha: {
          50:  '#FEF2F4',
          100: '#FCE0E5',
          200: '#F5C2CB',
          500: '#C41E3A',
          600: '#A21830',
          700: '#7F1226',
        },
        bravo: {
          50:  '#F0F4FB',
          100: '#DCE5F4',
          200: '#B8C7E5',
          500: '#003DA5',
          600: '#003187',
          700: '#002569',
        },
        // Live state — emerald, distinct from Masters brand green
        live: {
          50:  '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          500: '#10B981',
          600: '#059669',
          glow: 'rgba(16,185,129,0.35)',
        },
        // Neutral draw/tie token for All Square
        draw: {
          50:  '#F5F5F7',
          200: '#D1D5DB',
          500: '#6B7280',
        },
        // Format-as-color system — each match format gets a distinct pill color
        // so rounds are visually parseable at a glance.
        format: {
          fourball: '#2563EB', // blue
          singles:  '#F59E0B', // amber
          scramble: '#8B5CF6', // violet
          skins:    '#EAB308', // gold
        },
        // Lighthouse red — used for live indicators, RC accents, active-nav underline
        lighthouse: '#C8102E',
        // Semantic
        danger:  '#EF4444',
        success: '#10B981',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)',
        elev: '0 4px 12px rgba(16,24,40,0.06), 0 2px 4px rgba(16,24,40,0.04)',
        // Hero shadow uses Masters-green alpha for a tinted lift
        hero: '0 12px 32px rgba(0,103,71,0.14), 0 4px 8px rgba(16,24,40,0.04)',
      },
      backgroundImage: {
        // Hero gradient: dark → primary → light green (135°)
        'hero-green':
          'linear-gradient(135deg, #003826 0%, #006747 55%, #0A8A5F 100%)',
        // Subtle nav/surface tint using the same green family
        'hero-green-soft':
          'linear-gradient(135deg, rgba(0,56,38,0.06) 0%, rgba(0,103,71,0.10) 100%)',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.35' },
        },
        // Subtle emerald glow on a Live session's accent bar.
        'live-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(16,185,129,0.55)' },
          '50%':      { boxShadow: '0 0 12px 2px rgba(16,185,129,0.45)' },
        },
      },
      animation: {
        shimmer:    'shimmer 2s linear infinite',
        'slide-up': 'slide-up 250ms ease-out',
        'fade-in':  'fade-in 200ms ease-out',
        'pulse-dot':'pulse-dot 1.4s ease-in-out infinite',
        'live-glow':'live-glow 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config

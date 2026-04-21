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
        // Brand — indigo replaces Masters green
        masters: {
          DEFAULT: '#4F46E5', // indigo-600
          light:   '#6366F1', // indigo-500 (hover)
          glow:    '#4338CA', // indigo-700 (strong emphasis)
        },
        // Gold token kept but collapsed to indigo to avoid sweeping 20+ files.
        // If a trophy/leaderboard needs a warm accent later, introduce `amber`.
        gold: {
          DEFAULT: '#4F46E5',
          muted:   '#6366F1',
        },
        // Team colors — brand identities for the two Ryder Cup sides, unchanged
        teamA: '#C41E3A',
        teamB: '#003DA5',
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
        hero: '0 12px 32px rgba(79,70,229,0.10), 0 4px 8px rgba(16,24,40,0.04)',
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
      },
      animation: {
        shimmer:    'shimmer 2s linear infinite',
        'slide-up': 'slide-up 250ms ease-out',
        'fade-in':  'fade-in 200ms ease-out',
      },
    },
  },
  plugins: [],
}

export default config

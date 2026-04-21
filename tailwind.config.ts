import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          0: '#0A0A0A',
          1: '#141414',
          2: '#1C1C1E',
          3: '#2C2C2E',
        },
        fg: {
          1: '#FFFFFF',
          2: '#A1A1A6',
          3: '#636366',
        },
        masters: {
          DEFAULT: '#2D6A4F',
          light: '#40916C',
          glow: '#52B788',
        },
        gold: {
          DEFAULT: '#D4A843',
          muted: '#B8943F',
        },
        teamA: '#C41E3A',
        teamB: '#003DA5',
        danger: '#FF453A',
        success: '#30D158',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
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

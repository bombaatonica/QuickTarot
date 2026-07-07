import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bordeaux: {
          50: '#fdf2f5',
          100: '#f9e0e7',
          200: '#f2bfcd',
          300: '#e691a9',
          400: '#d55c7f',
          500: '#b93357',
          600: '#9c1f42',
          700: '#800020',
          800: '#5c0f1f',
          900: '#3d0a14',
          950: '#1a0508',
        },
        gold: {
          50: '#fdfaf0',
          100: '#faf0cf',
          200: '#f0d98c',
          300: '#e5c55c',
          400: '#d4af37',
          500: '#c09a2c',
          600: '#9c7c1e',
          700: '#7a5f15',
          800: '#59450f',
          900: '#3b2d09',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'Georgia', 'serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 18px rgba(212, 175, 55, 0.25)',
        'gold-glow-lg': '0 0 32px rgba(212, 175, 55, 0.35)',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        orbPulse: {
          '0%, 100%': { transform: 'scale(0.85)', opacity: '0.5' },
          '50%': { transform: 'scale(1.1)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        shimmer: 'shimmer 2.4s ease-in-out infinite',
        'orb-pulse': 'orbPulse 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config

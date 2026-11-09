import type { Config } from 'tailwindcss'

// Palette from the spec: off white page, white cards, pink for the one thing
// you should press, green for what works and amber for what to change.
// Everything else is a warm grey so the photo of the outfit carries the colour.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FAFAFA',
        surface: '#FFFFFF',
        sunk: '#F5F5F4',
        line: '#E7E5E4',
        strong: '#D6D3D1',
        ink: '#1C1917',
        muted: '#57534E',
        faint: '#78716C',
        primary: { DEFAULT: '#DB2777', hover: '#BE185D', ink: '#9D174D', soft: '#FCE7F3', wash: '#FDF2F8' },
        works: { DEFAULT: '#16A34A', ink: '#15803D', soft: '#DCFCE7' },
        suggestion: { DEFAULT: '#D97706', ink: '#B45309', soft: '#FEF3C7' },
        danger: { DEFAULT: '#B91C1C', soft: '#FEE2E2' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(28, 25, 23, 0.04), 0 8px 24px -14px rgba(28, 25, 23, 0.14)',
        lift: '0 2px 6px rgba(28, 25, 23, 0.06), 0 28px 56px -28px rgba(28, 25, 23, 0.32)',
        pink: '0 10px 30px -12px rgba(219, 39, 119, 0.55)',
      },
      keyframes: {
        'rise-in': { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'none' } },
        'pop-in': { '0%': { opacity: '0', transform: 'scale(0.6)' }, '70%': { transform: 'scale(1.12)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        scan: { '0%': { top: '-12%' }, '100%': { top: '100%' } },
        typing: { '0%, 80%, 100%': { opacity: '0.25', transform: 'translateY(0)' }, '40%': { opacity: '1', transform: 'translateY(-2px)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        'rise-in': 'rise-in 0.4s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        'pop-in': 'pop-in 0.45s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        scan: 'scan 1.6s ease-in-out infinite alternate',
        typing: 'typing 1.2s ease-in-out infinite',
        shimmer: 'shimmer 1.8s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config

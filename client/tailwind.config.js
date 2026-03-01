/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          900: '#0f1419',
          800: '#1a1f26',
          700: '#252b33',
          600: '#303840',
        },
        accent: {
          teal: '#0d9488',
          cyan: '#22d3ee',
          amber: '#f59e0b',
          green: '#10b981',
          red: '#ef4444',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'monospace'],
        sans: ['Inter', 'Geist', 'system-ui', 'sans-serif'],
      },
      animation: {
        'score-pulse': 'score-pulse 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.4s ease-out',
      },
      keyframes: {
        'score-pulse': {
          '0%, 100': { opacity: 1, boxShadow: '0 0 0 0 rgba(13, 148, 136, 0.4)' },
          '50%': { opacity: 0.95, boxShadow: '0 0 20px 4px rgba(13, 148, 136, 0.2)' },
        },
        'fade-in': {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

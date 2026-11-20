/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a',
        surface: '#1e293b',
        'surface-elevated': '#273548',
        primary: {
          DEFAULT: '#6366f1',
          hover: '#4f46e5',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#334155',
          foreground: '#94a3b8',
        },
        border: '#334155',
        ring: '#6366f1',
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

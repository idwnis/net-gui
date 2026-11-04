/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          rack: '#0E1420',
          mint: '#2EE6A6',
          'mint-glow': 'rgba(46, 230, 166, 0.4)',
          paper: '#F4F6F9',
          night: '#070A12',
        },
        cyber: {
          dark: '#070A12',
          card: '#0E1420',
          border: '#1C2536',
          accent: '#2EE6A6',
          success: '#2EE6A6',
          warning: '#f59e0b',
          danger: '#ef4444',
          muted: '#64748b'
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}

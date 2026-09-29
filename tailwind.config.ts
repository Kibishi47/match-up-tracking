import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        tcg: {
          win: '#10b981',
          loss: '#ef4444',
          card: '#1e293b',
          surface: '#0f172a',
          border: '#334155'
        }
      }
    }
  }
}

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
        // ActionAgents-inspired coral palette
        coral: {
          50: '#FFF5F2',
          100: '#FFE4DE',
          200: '#FFC9BD',
          300: '#FFA78F',
          400: '#FF8561',
          500: '#FF7F50', // Primary coral
          600: '#FF6B35',
          700: '#E85A24',
          800: '#C44A1D',
          900: '#A03D18',
        },
        // Category colors (from competitive analysis)
        category: {
          finance: '#22C55E',
          marketing: '#EC4899',
          sales: '#3B82F6',
          research: '#8B5CF6',
          operations: '#F97316',
        },
        // Legacy brand colors (for backward compatibility)
        brand: {
          dark: '#0A0A0B',
          surface: 'rgba(16, 24, 39, 0.7)',
          accent: '#ec4899',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Menlo', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        // Category gradients for agent cards
        'gradient-finance': 'linear-gradient(135deg, #DCFCE7 0%, #86EFAC 100%)',
        'gradient-marketing': 'linear-gradient(135deg, #FCE7F3 0%, #F9A8D4 100%)',
        'gradient-sales': 'linear-gradient(135deg, #DBEAFE 0%, #93C5FD 100%)',
        'gradient-research': 'linear-gradient(135deg, #EDE9FE 0%, #C4B5FD 100%)',
        'gradient-operations': 'linear-gradient(135deg, #FEF3C7 0%, #FCD34D 100%)',
      },
      boxShadow: {
        // Premium shadows from competitive analysis
        'card': '0 1px 3px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'modal': '0 20px 60px rgba(0, 0, 0, 0.15)',
        'fab': '0 4px 20px rgba(0, 0, 0, 0.2)',
      },
      borderRadius: {
        'sm': '6px',
        'DEFAULT': '8px',
        'md': '10px',
        'lg': '12px',
        'xl': '16px',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [],
}
export default config

/* Performance optimizations */
export const preload = true

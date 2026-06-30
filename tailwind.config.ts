import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        border: '#BBF7D0',
        input: '#BBF7D0',
        ring: '#15803D',
        background: '#F0FDF4',
        foreground: '#14532D',
        primary: {
          DEFAULT: '#15803D',
          foreground: '#FFFFFF',
          light: '#22C55E',
          dark: '#166534',
        },
        secondary: {
          DEFAULT: '#22C55E',
          foreground: '#0F172A',
        },
        accent: {
          DEFAULT: '#0369A1',
          foreground: '#FFFFFF',
          light: '#0EA5E9',
        },
        destructive: {
          DEFAULT: '#DC2626',
          foreground: '#FFFFFF',
        },
        warning: {
          DEFAULT: '#F59E0B',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#E8F0F1',
          foreground: '#64748B',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#14532D',
        },
      },
      fontFamily: {
        sans: ['var(--font-fira-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-fira-code)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [],
};

export default config;

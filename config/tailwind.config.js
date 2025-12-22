/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "../index.html",
    "../src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary palette
        navy: {
          DEFAULT: '#1a1a2e',
          light: '#252542',
          dark: '#12121f'
        },
        deepblue: {
          DEFAULT: '#16213e',
          light: '#1d2d52',
          dark: '#0f172a'
        },
        industrial: {
          DEFAULT: '#0f3460',
          light: '#164470',
          dark: '#0a2340'
        },
        // Accent colors
        safety: {
          DEFAULT: '#e94560',
          light: '#f06a82',
          dark: '#d13350'
        },
        gold: {
          DEFAULT: '#d4af37',
          light: '#e0c45c',
          dark: '#b8961f'
        },
        // Neutrals
        gray: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#eeeeee',
          300: '#e0e0e0',
          400: '#cccccc',
          500: '#9e9e9e',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#333333'
        }
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        display: ['Rajdhani', 'sans-serif']
      },
      fontSize: {
        'display': ['4.5rem', { lineHeight: '1.1', fontWeight: '800' }],
        'h1': ['3rem', { lineHeight: '1.2', fontWeight: '700' }],
        'h2': ['2.25rem', { lineHeight: '1.3', fontWeight: '700' }],
        'h3': ['1.75rem', { lineHeight: '1.4', fontWeight: '600' }],
        'h4': ['1.375rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }]
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
        '34': '8.5rem',
        '38': '9.5rem'
      },
      borderRadius: {
        '4xl': '2rem'
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 12px 40px rgba(0, 0, 0, 0.15)',
        'nav': '0 2px 10px rgba(0, 0, 0, 0.1)',
        'button': '0 4px 14px rgba(233, 69, 96, 0.4)'
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      },
      transitionTimingFunction: {
        'bounce-custom': 'cubic-bezier(0.34, 1.56, 0.64, 1)'
      }
    },
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px'
    }
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#F5F5F5',
          100: '#E8E8E8',
          200: '#CCCCCC',
          300: '#999999',
          400: '#FF0000', // main red — CTA bg
          500: '#CC0000', // hover red
          600: '#666666', // medium gray
          700: '#444444', // dark gray
          800: '#2A2A2A', // darker gray
          900: '#000000', // pure black
        },
        accent: {
          400: '#FF0000',
          500: '#CC0000',
          600: '#999999',
        },
        pearl: {
          DEFAULT: '#F5F5F5', // body bg — light gray
          dark:    '#E8E8E8', // borders / dividers
        },
        ink: {
          DEFAULT: '#000000', // black for text
          soft:    '#2A2A2A', // dark gray for text
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn: { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        slideUp: { from: { transform: 'translateY(20px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
      },
    },
  },
  plugins: [],
};

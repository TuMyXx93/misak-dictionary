/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta de colores Misak extraída del prototipo
        primary: {
          DEFAULT: '#38e07b',
          light: '#5fe894',
          dark: '#2bc768',
        },
        secondary: {
          DEFAULT: '#264532',
          light: '#3a6449',
          dark: '#1a2f23',
        },
        background: {
          DEFAULT: '#122118',
          light: '#1a2f23',
          dark: '#0a1410',
        },
        text: {
          DEFAULT: '#ffffff',
          muted: '#e0e0e0',
          disabled: '#9e9e9e',
        },
      },
      fontFamily: {
        sans: ['Spline Sans', 'Noto Sans', 'sans-serif'],
        display: ['Spline Sans', 'sans-serif'],
        body: ['Noto Sans', 'sans-serif'],
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
        128: '32rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

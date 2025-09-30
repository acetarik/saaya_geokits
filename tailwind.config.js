/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
    "./constants/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Saaya brand colors
        primary: {
          50: '#E4F3E6',
          100: '#D5EDDB',
          200: '#C8E6C9',
          300: '#A5D6A7',
          400: '#81C784',
          500: '#3F9142',
          600: '#2E7D32',
          700: '#1B5E20',
          800: '#2D5016',
          900: '#1A3D1F',
        },
        secondary: {
          50: '#FFF2E6',
          100: '#FDEBD0',
          200: '#FFF4E0',
          300: '#FFE0B2',
          400: '#FFCC80',
          500: '#F39C12',
          600: '#E65100',
          700: '#BF360C',
          800: '#B15B2B',
          900: '#E65100',
        },
        danger: {
          50: '#FFEBEE',
          100: '#FFE8E2',
          200: '#FFCDD2',
          300: '#EF9A9A',
          400: '#E57373',
          500: '#C54A2E',
          600: '#E53935',
          700: '#D32F2F',
          800: '#C62828',
          900: '#B71C1C',
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#EEEEEE',
          300: '#E0E0E0',
          400: '#BDBDBD',
          500: '#9E9E9E',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
        background: {
          primary: '#F7F5F2',
          secondary: '#FFFFFF',
          tertiary: '#F4F4F4',
        },
        text: {
          primary: '#1B1B1B',
          secondary: '#6F6F6F',
          tertiary: '#8A8A8A',
          inverse: '#FFFFFF',
        },
      },
      fontFamily: {
        // You can add custom fonts here if needed
        sans: ['System'],
        mono: ['monospace'],
      },
      fontSize: {
        'xs': '11px',
        'sm': '13px',
        'base': '15px',
        'lg': '16px',
        'xl': '18px',
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '26px',
        '5xl': '32px',
        '6xl': '34px',
      },
      spacing: {
        '18': '72px',
        '72': '288px',
        '84': '336px',
        '96': '384px',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '18px',
        '4xl': '20px',
        '5xl': '24px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.12)',
        'button': '0 1px 3px rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-4px)' },
          '60%': { transform: 'translateY(-2px)' },
        },
      },
    },
  },
  plugins: [],
}


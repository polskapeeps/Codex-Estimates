/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // PK Paints warm gold palette. The app stays dark; these values are
        // deliberately restrained and used for actions / active states.
        brand: {
          50: '#2a2111',
          100: '#3a2c13',
          500: '#e6bd63',
          600: '#d6a43c',
          700: '#c9962f',
          800: '#a9771e',
        },
      },
      fontFamily: {
        sans: [
          'Hanken Grotesk',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

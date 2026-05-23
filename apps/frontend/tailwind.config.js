/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#25d366',
          600: '#128c7e',
          700: '#075e54',
          800: '#064e3b',
          900: '#022c22',
        },
        whatsapp: {
          light: '#dcf8c6',
          dark: '#075e54',
          teal: '#128c7e',
          green: '#25d366',
          bg: '#efeae2',
        }
      },
    },
  },
  plugins: [],
};

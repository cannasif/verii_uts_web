/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'plus-jakarta': ["'Plus Jakarta Sans'", 'sans-serif'],
      },
    },
  },
  plugins: [],
};

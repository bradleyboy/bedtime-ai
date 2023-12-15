const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./{pages,components}/**/*.{js,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Andika', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
};

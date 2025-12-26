/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'vhs-bar': {
          '0%, 100%': { height: '8px' },
          '50%': { height: '24px' },
        }
      },
      animation: {
        'vhs-bar': 'vhs-bar 0.6s ease-in-out infinite',
      }
    }
  },
  plugins: [],
}
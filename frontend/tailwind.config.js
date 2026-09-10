/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Outfit', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        slate: {
          950: '#030712', // Pure obsidian
        },
      },
      boxShadow: {
        'premium': '0 20px 50px -12px rgba(0, 0, 0, 0.75)',
        'premium-glow': '0 0 40px -5px rgba(99, 102, 241, 0.15)',
        'button-glow': '0 4px 20px rgba(99, 102, 241, 0.4)',
      },
    },
  },
  plugins: [],
}

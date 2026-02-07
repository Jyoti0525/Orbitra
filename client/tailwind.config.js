/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Space theme color palette
        'space-black': '#0a0e27',
        'deep-space': '#1a1d3a',
        'nebula-purple': '#7b2cbf',
        'star-blue': '#4cc9f0',
        'warning-orange': '#ff6b35',
        'danger-red': '#ef233c',
        'safe-green': '#06ffa5',
      },
      backgroundImage: {
        'space-gradient': 'linear-gradient(to bottom, #0a0e27, #1a1d3a)',
      },
    },
  },
  plugins: [],
}

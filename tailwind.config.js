/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#eab308", // Yellow for fruits
        secondary: "#fbbf24",
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class", // enables class-based dark mode
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/forms")],
};

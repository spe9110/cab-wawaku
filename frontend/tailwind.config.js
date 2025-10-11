/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "375px",     // petits téléphones (iPhone SE)
        sm: "480px",     // mobiles larges
        md: "768px",     // tablettes
        lg: "1024px",    // laptops
        xl: "1280px",    // desktops
        "2xl": "1440px", // grands laptops (MacBook Air/Pro)
      },
    },
  },
  plugins: [],
}
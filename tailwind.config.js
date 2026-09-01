/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          pink: "#EC1C6B",
          orange: "#F7941E",
        },
        division: {
          energy: "#F7941E",
          secure: "#EC1C8C",
          connect: "#4CA6E0",
          water: "#7DD3FC",
          saas: "#9B7CE8",
        },
      },
      boxShadow: {
        brand: "0 20px 60px -20px rgba(236, 28, 107, 0.35)",
      },
    },
  },
  plugins: [],
};

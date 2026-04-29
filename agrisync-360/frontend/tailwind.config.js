/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0fdf4",
          100: "#dcfce7",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        earth: {
          400: "#a78b72",
          500: "#8B5E3C",
          600: "#6b4423",
        },
        harvest: {
          400: "#fbbf24",
          500: "#F4A261",
          600: "#d97706",
        },
      },
    },
  },
  plugins: [],
};

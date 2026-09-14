import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1200px" },
    },
    extend: {
      colors: {
        brand: {
          50: "#eefaf4",
          100: "#d6f4e3",
          200: "#b0e8cb",
          300: "#7dd6ad",
          400: "#4abd8a",
          500: "#25a26f",
          600: "#158258",
          700: "#116849",
          800: "#10533b",
          900: "#0e4431",
          950: "#06271b",
        },
        surface: {
          1: "#ffffff",
          2: "#f7f8f7",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "0.75rem",
        xl: "1rem",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;

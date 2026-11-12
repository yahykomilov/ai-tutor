/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Stitch style guide (https://stitch.withgoogle.com/projects/16343657154948229217):
        // Primary #0F3040, Secondary #464858, Tertiary #42260C (terracotta scale), Neutral #767778.
        brand: {
          50: "#f8f0ed", 100: "#f0ddd5", 200: "#e4c4b8", 300: "#d99b7f",
          400: "#c5836f", 500: "#a56f63", 600: "#8f5d52", 700: "#744a42",
          800: "#5c3b35", 900: "#46302c", 950: "#2a1c19",
        },
        ink: {
          600: "#5c6672", 700: "#464858", 800: "#22404e", 900: "#0f3040", 950: "#0a222e",
        },
        surface: {
          DEFAULT: "#f9f7f9",
          card: "#ffffff",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        blink: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.3" } },
      },
      animation: {
        "fade-up": "fade-up 0.25s ease-out",
        blink: "blink 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

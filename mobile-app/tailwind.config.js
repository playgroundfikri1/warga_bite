/** @type {import('tailwindcss').Config} */
module.exports = {
  // Light Mode Only sesuai Blueprint Fase 1
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#EA580C",
          hover: "#F97316",
          soft: "#FFEDD5",
        },
        surface: "#FFFFFF",
        canvas: "#F8FAFC",
        ink: {
          DEFAULT: "#1E293B",
          secondary: "#64748B",
        },
        line: "#E2E8F0",
        status: {
          success: "#16A34A",
          warning: "#D97706",
          danger: "#DC2626",
          muted: "#94A3B8",
        },
      },
    },
  },
  plugins: [],
};

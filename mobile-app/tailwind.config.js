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
        // Brand oranye (header, aksen) + terracotta gelap (CTA, tab aktif, bubble)
        primary: {
          DEFAULT: "#EA580C",
          hover: "#F97316",
          soft: "#FFEDD5",
        },
        cta: {
          DEFAULT: "#A63A00",
          dark: "#8A2F00",
        },
        surface: "#FFFFFF",
        canvas: "#F8FAFF",
        field: "#EEF2FF",
        chip: {
          mint: "#7CF5C5",
          mintText: "#065F46",
          peach: "#FFE0CC",
          sky: "#DBEAFE",
          skyText: "#1E40AF",
        },
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

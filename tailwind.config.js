/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "Roboto",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Noto Sans",
          "sans-serif",
        ],
        display: [
          "Inter",
          "Montserrat",
          "Roboto",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          DEFAULT: "#2563eb",
          hover: "#1d4ed8",
        },
        ai: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          DEFAULT: "#7c3aed",
          soft: "#ede9fe",
        },
        canvas: {
          DEFAULT: "#f8fafc",
          dark: "#090d16",
        },
        surface: {
          DEFAULT: "#ffffff",
          subtle: "#f1f5f9",
          card: "#ffffff",
          dark: "#0e1626",
          "dark-subtle": "#131d31",
        },
      },
      borderRadius: {
        card: "0.875rem",
        panel: "1.125rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        "card-hover": "0 10px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04)",
        pop: "0 12px 32px -4px rgb(15 23 42 / 0.15)",
        glow: "0 0 20px -5px rgba(99, 102, 241, 0.25)",
      },
      keyframes: {
        "pulse-subtle": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.6 },
        },
      },
      animation: {
        "pulse-subtle": "pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

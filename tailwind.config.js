/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "Geist",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
        display: [
          "Geist",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
      colors: {
        // Midnight Aurora palette
        bg: {
          0: "#070B14",
          1: "#0D1424",
          2: "#131C30",
          3: "#1A2540",
        },
        aurora: {
          violet: "#7C5CFF",
          blue: "#4F8CFF",
          cyan: "#22D3EE",
        },
        txt: {
          1: "#F4F6FB",
          2: "#A3AEC7",
          3: "#6B7792",
        },
        gain: {
          DEFAULT: "#2BD67B",
          soft: "rgba(43, 214, 123, 0.12)",
          border: "rgba(43, 214, 123, 0.25)",
        },
        loss: {
          DEFAULT: "#FF5C6C",
          soft: "rgba(255, 92, 108, 0.12)",
          border: "rgba(255, 92, 108, 0.25)",
        },
        warn: {
          DEFAULT: "#FFB84D",
          soft: "rgba(255, 184, 77, 0.12)",
        },
      },
      borderRadius: {
        card: "20px",     // 20px cards
        button: "12px",   // 12px buttons/inputs
        full: "9999px",
      },
      boxShadow: {
        "glass-card": "0 20px 60px -20px rgba(0, 0, 0, 0.60), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        "glass-card-hover": "0 24px 70px -15px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.10)",
        "button-glow": "0 8px 24px -4px rgba(124, 92, 255, 0.40)",
        "gain-glow": "0 0 20px -2px rgba(43, 214, 123, 0.25)",
        "loss-glow": "0 0 20px -2px rgba(255, 92, 108, 0.25)",
        pop: "0 20px 50px -10px rgba(0, 0, 0, 0.75)",
      },
    },
  },
  plugins: [],
};

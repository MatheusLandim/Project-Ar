import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#0B1B2B", soft: "#475569", faint: "#94A3B8" },
        brand: {
          DEFAULT: "#0E7C86",
          dark: "#0A5C64",
          soft: "#E0F2F4",
        },
        line: "#E2E8F0",
        surface: "#FFFFFF",
        canvas: "#EEF2F6",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-grotesk)", "var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,27,43,0.04), 0 8px 24px -12px rgba(11,27,43,0.12)",
      },
    },
  },
  plugins: [],
};
export default config;

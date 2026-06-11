import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "rgb(var(--c-bg) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        line: "rgb(var(--c-line) / <alpha-value>)",
        ink: {
          DEFAULT: "rgb(var(--c-ink) / <alpha-value>)",
          soft: "rgb(var(--c-ink-soft) / <alpha-value>)",
          faint: "rgb(var(--c-ink-faint) / <alpha-value>)",
        },
        brand: {
          DEFAULT: "rgb(var(--c-brand) / <alpha-value>)",
          dark: "rgb(var(--c-brand-dark) / <alpha-value>)",
          soft: "rgb(var(--c-brand-soft) / <alpha-value>)",
        },
        navy: "rgb(var(--c-navy) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-sora)", "var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        card: "var(--shadow-card)",
        glow: "0 0 0 1px rgb(var(--c-brand) / 0.15), 0 8px 40px -12px rgb(var(--c-brand) / 0.35)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fadeUp .45s cubic-bezier(.2,.7,.2,1) both",
        "scale-in": "scaleIn .2s ease both",
      },
    },
  },
  plugins: [],
};
export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dark garden palette
        ink: "#0C1210", // page background (moss-black)
        soil: "#101814", // deep section background
        card: "#151F1A", // card surface
        moss: "#1B2921", // raised / hover surface
        line: "#25332C", // borders / dividers
        fog: "#93A69B", // muted text
        snow: "#EAF2ED", // primary text
        leaf: "#6EE7A0", // primary accent (sprout green)
        "leaf-deep": "#173226",
        gold: "#F2C14E", // prizes / winners
        "gold-deep": "#332A14",
        rose: "#F87171", // errors / danger
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "rise-lg": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "float-up": {
          "0%": { transform: "translateY(0) translateX(0)", opacity: "0" },
          "10%": { opacity: "var(--spore-opacity, 0.7)" },
          "90%": { opacity: "var(--spore-opacity, 0.7)" },
          "100%": {
            transform: "translateY(-46vh) translateX(var(--spore-drift, 12px))",
            opacity: "0",
          },
        },
        aurora: {
          "0%, 100%": { transform: "translateX(-12%) scale(1)", opacity: "0.5" },
          "50%": { transform: "translateX(12%) scale(1.15)", opacity: "0.8" },
        },
        sheen: {
          "0%": { transform: "translateX(-150%) skewX(-18deg)" },
          "100%": { transform: "translateX(280%) skewX(-18deg)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "0.7" },
        },
        sway: {
          "0%, 100%": { transform: "rotate(-2.5deg)" },
          "50%": { transform: "rotate(2.5deg)" },
        },
      },
      animation: {
        rise: "rise 0.45s ease-out both",
        "rise-lg": "rise-lg 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        "float-up": "float-up var(--spore-duration, 14s) linear infinite",
        aurora: "aurora 16s ease-in-out infinite",
        sheen: "sheen 0.9s ease-in-out",
        "glow-pulse": "glow-pulse 5s ease-in-out infinite",
        sway: "sway 7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

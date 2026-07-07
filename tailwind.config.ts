import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dark garden palette
        ink: "#0C1210",     // page background (moss-black)
        soil: "#101814",    // deep section background
        card: "#151F1A",    // card surface
        line: "#25332C",    // borders / dividers
        fog: "#93A69B",     // muted text
        snow: "#EAF2ED",    // primary text
        leaf: "#6EE7A0",    // primary accent (sprout green)
        "leaf-deep": "#173226",
        gold: "#F2C14E",    // prizes / winners
        "gold-deep": "#332A14",
        rose: "#F87171",    // errors / danger
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
      },
      animation: {
        rise: "rise 0.45s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;

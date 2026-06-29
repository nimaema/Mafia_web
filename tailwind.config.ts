import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-vazirmatn)", "ui-sans-serif", "system-ui", "sans-serif"],
        vazir: ["var(--font-vazirmatn)", "sans-serif"],
        display: ["var(--font-display)", "var(--font-vazirmatn)", "sans-serif"],
      },
      colors: {
        // Faction colors map to the dual-theme semantic vars.
        role: {
          citizen: "var(--pm-blue)",
          mafia: "var(--pm-danger)",
          neutral: "var(--pm-violet)",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-top": "env(safe-area-inset-top)",
      },
    },
  },
  plugins: [],
};

export default config;

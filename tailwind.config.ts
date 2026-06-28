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
        // Vazirmatn as the global RTL Persian font; Markazi Text for display
        sans: ["var(--font-vazirmatn)", "ui-sans-serif", "system-ui", "sans-serif"],
        vazir: ["var(--font-vazirmatn)", "sans-serif"],
        display: ["var(--font-markazi)", "var(--font-vazirmatn)", "serif"],
      },
      colors: {
        // Midnight Salon palette
        brass: {
          soft: "#f1ddaa",
          DEFAULT: "#d4ad55",
          bright: "#e7c878",
          deep: "#9a6f28",
        },
        oxblood: {
          DEFAULT: "#be4750",
          bright: "#d6727a",
          deep: "#82282f",
        },
        steel: {
          DEFAULT: "#5e86a8",
          bright: "#8fb0cc",
          deep: "#38556f",
        },
        ink: {
          600: "#4d3a5c",
          700: "#392a45",
          800: "#291e33",
          850: "#211829",
          900: "#1a1220",
          950: "#130d18",
        },
        // Role colors (faction-coded)
        role: {
          citizen: "#5e86a8",   // steel-blue
          mafia: "#be4750",     // oxblood
          neutral: "#9173cc",   // amethyst
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(132, 204, 22, 0.3)" },
          "100%": { boxShadow: "0 0 20px rgba(190, 242, 100, 0.65)" },
        },
      },
      // RTL logical spacing utilities
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-top": "env(safe-area-inset-top)",
      },
    },
  },
  plugins: [],
};

export default config;

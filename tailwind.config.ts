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
        // Vazirmatn as the global RTL Persian font
        sans: ["var(--font-vazirmatn)", "ui-sans-serif", "system-ui", "sans-serif"],
        vazir: ["var(--font-vazirmatn)", "sans-serif"],
      },
      colors: {
        // Design system lime accent
        lime: {
          400: "#a3e635",
          500: "#84cc16",
          600: "#65a30d",
        },
        // Dark theme surfaces
        zinc: {
          900: "#18181b",
          950: "#09090b",
        },
        // Role colors
        role: {
          citizen: "#2563eb",   // blue-600
          mafia: "#b91c1c",     // red-700
          neutral: "#09090b",   // zinc-950
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
          "0%": { boxShadow: "0 0 5px rgba(163, 230, 53, 0.3)" },
          "100%": { boxShadow: "0 0 20px rgba(163, 230, 53, 0.7)" },
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

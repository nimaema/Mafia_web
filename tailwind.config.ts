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
        // Lime/azure command palette
        lime: {
          300: "#d9f99d",
          400: "#a3e635",
          500: "#84cc16",
          600: "#65a30d",
          700: "#4d7c0f",
        },
        azure: {
          50: "#f4f8fb",
          100: "#dbeafe",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
        },
        graphite: {
          600: "#3d4b56",
          700: "#2b333b",
          800: "#20272d",
          850: "#181d22",
          900: "#15181b",
          950: "#111417",
        },
        // Role colors
        role: {
          citizen: "#2563eb",   // blue-600
          mafia: "#b91c1c",     // red-700
          neutral: "#111417",   // graphite-950
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

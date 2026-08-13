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
      colors: {
        // Semantic tokens backed by the CSS variables defined in
        // src/app/globals.css. Without these mappings, utilities like
        // `border-border` and `bg-background` don't exist and Tailwind
        // fails the build on globals.css's `@apply border-border`.
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        brand: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        // Real estate specific
        "price":   "#1d4ed8",
        "sale":    "#16a34a",
        "rent":    "#7c3aed",
        "pending": "#d97706",
        "sold":    "#dc2626",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },
      fontSize: {
        "2xs": ["0.65rem", { lineHeight: "1rem" }],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        "card": "0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 10px 30px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.06)",
        "sticky": "0 2px 8px rgba(0,0,0,0.08)",
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%)",
        "card-gradient": "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.7) 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "shimmer": "shimmer 1.5s infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        shimmer: { "0%": { backgroundPosition: "-1000px 0" }, "100%": { backgroundPosition: "1000px 0" } },
      },
    },
  },
  plugins: [],
};

export default config;

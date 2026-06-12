import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        ai: {
          DEFAULT: "hsl(var(--ai))",
          foreground: "hsl(var(--ai-foreground))",
          muted: "hsl(var(--ai-muted))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 10px)",
        "3xl": "calc(var(--radius) + 18px)",
        "4xl": "calc(var(--radius) + 30px)",
      },
      boxShadow: {
        // Soft, layered elevation system.
        card: "0 1px 2px hsl(222 47% 11% / 0.04), 0 8px 24px hsl(222 47% 11% / 0.05)",
        "card-hover": "0 2px 6px hsl(222 47% 11% / 0.06), 0 18px 48px hsl(222 47% 11% / 0.10)",
        elevated: "0 4px 12px hsl(222 47% 11% / 0.08), 0 30px 70px hsl(222 47% 11% / 0.14)",
        glow: "0 10px 30px hsl(var(--primary) / 0.28)",
        "glow-ai": "0 10px 30px hsl(var(--ai) / 0.30)",
        ring: "0 0 0 1px hsl(var(--border))",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(ellipse 90% 60% at 50% -10%, hsl(var(--ai-muted)), transparent 70%)",
        "mesh-gradient":
          "radial-gradient(at 15% 20%, hsl(var(--primary) / 0.12) 0px, transparent 50%), radial-gradient(at 85% 10%, hsl(var(--accent) / 0.10) 0px, transparent 50%), radial-gradient(at 60% 90%, hsl(var(--ai) / 0.10) 0px, transparent 50%)",
        "brand-gradient":
          "linear-gradient(110deg, hsl(var(--brand-from)), hsl(var(--brand-via)) 55%, hsl(var(--brand-to)))",
        shine:
          "linear-gradient(110deg, transparent 35%, hsl(0 0% 100% / 0.45) 50%, transparent 65%)",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};

export default config;

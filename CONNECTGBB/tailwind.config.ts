import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: "color-mix(in oklab, var(--brand-primary) 10%, white)",
          100: "color-mix(in oklab, var(--brand-primary) 20%, white)",
          200: "color-mix(in oklab, var(--brand-primary) 35%, white)",
          300: "color-mix(in oklab, var(--brand-primary) 50%, white)",
          400: "color-mix(in oklab, var(--brand-primary) 70%, white)",
          500: "var(--brand-primary)",
          600: "color-mix(in oklab, var(--brand-primary) 85%, black)",
          700: "color-mix(in oklab, var(--brand-primary) 70%, black)",
          800: "color-mix(in oklab, var(--brand-primary) 55%, black)",
          900: "color-mix(in oklab, var(--brand-primary) 40%, black)",
          950: "color-mix(in oklab, var(--brand-primary) 30%, black)",
        },
        neutral: {
          50: "color-mix(in oklab, var(--foreground) 85%, white)",
          100: "color-mix(in oklab, var(--foreground) 70%, white)",
          200: "color-mix(in oklab, var(--foreground) 55%, white)",
          300: "color-mix(in oklab, var(--foreground) 40%, white)",
          400: "color-mix(in oklab, var(--foreground) 25%, white)",
          500: "var(--foreground)",
          600: "color-mix(in oklab, var(--surface-muted) 70%, black)",
          700: "color-mix(in oklab, var(--surface-muted) 80%, black)",
          800: "var(--surface-muted)",
          900: "var(--surface)",
          950: "var(--background)",
        },
        success: "var(--brand-primary)",
        warning: "var(--brand-secondary)",
        destructive: "var(--brand-secondary)",
        info: "var(--brand-primary)",
      },
      fontFamily: {
        display: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        body: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
      },
      boxShadow: {
        card: "0 8px 24px color-mix(in oklab, var(--background) 70%, transparent)",
        dropdown: "0 12px 32px color-mix(in oklab, var(--background) 75%, transparent)",
        modal: "0 16px 48px color-mix(in oklab, var(--background) 80%, transparent)",
      },
    },
  },
};

export default config;

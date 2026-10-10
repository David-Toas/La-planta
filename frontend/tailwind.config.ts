import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "#040505",
          foreground: "#ffffff",
          container: "#1e1e1e",
          "fixed-dim": "#c8c6c5",
        },
        secondary: {
          DEFAULT: "#725b38",
          foreground: "#ffffff",
          container: "#fedeb2",
          "on-container": "#78603e",
          fixed: "#fedeb2",
          "on-fixed": "#281800",
        },
        surface: {
          DEFAULT: "#f9f9ff",
          bright: "#f9f9ff",
          dim: "#cfdaf1",
          variant: "#d8e3fa",
          "container-lowest": "#ffffff",
          "container-low": "#f0f3ff",
          container: "#e7eeff",
          "container-high": "#dee8ff",
          "container-highest": "#d8e3fa",
          tint: "#5f5e5e",
        },
        "on-surface": "#111c2c",
        "on-surface-variant": "#444748",
        muted: {
          DEFAULT: "#f0f3ff",
          foreground: "#444748",
        },
        accent: {
          DEFAULT: "#fedeb2",
          foreground: "#281800",
        },
        destructive: {
          DEFAULT: "#ba1a1a",
          foreground: "#ffffff",
        },
        border: "#e5e7eb",
        input: "#e5e7eb",
        ring: "#725b38",
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "serif"],
        display: ["var(--font-playfair)", "serif"],
        sans: ["var(--font-plus-jakarta)", "sans-serif"],
        body: ["var(--font-plus-jakarta)", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;


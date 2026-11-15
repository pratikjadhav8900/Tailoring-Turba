import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-ui)", "system-ui", "sans-serif"],
        ui: ["var(--font-ui)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        serif: ["var(--font-ui)", "system-ui", "sans-serif"],
        sans: ["var(--font-ui)", "system-ui", "sans-serif"],
        editorial: ["var(--font-editorial)", "Georgia", "serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "warm-bone": "var(--color-warm-bone)",
        ink: "var(--color-ink)",
        "tailor-green": "var(--color-tailor-green)",
        sage: "var(--color-sage)",
        "muted-clay": "var(--color-muted-clay)",
        "soft-white": "var(--color-soft-white)",
        "natural-thread": "var(--color-natural-thread)",
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        border: "var(--border)",
        ring: "var(--ring)",
      },
    },
  },
  plugins: [],
};
export default config;

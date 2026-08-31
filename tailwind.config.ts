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
        display: ["var(--font-display)", "Georgia", "serif"],
        ui: ["var(--font-ui)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
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
      },
    },
  },
  plugins: [],
};
export default config;

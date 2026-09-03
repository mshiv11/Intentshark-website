/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['Platypi', 'Georgia', '"Times New Roman"', 'serif'],
        body: ['Calibri', '"Segoe UI"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      // Named brand tokens only. Tailwind's own `green`/`gray` scales are left
      // intact so utilities like `green-500` keep working.
      colors: {
        ink: "var(--ink)",
        brand: "var(--green)",
        mint: "var(--mint)",
        paper: "var(--paper)",
        text: "var(--text)",
        muted: "var(--muted)",
        rust: "var(--rust)",
        carddk: "var(--carddk)",
        linedk: "var(--linedk)",
        "border-soft": "var(--border-soft)",
        hair: "var(--hair)",
        amber: "var(--amber)",
      },
      borderColor: {
        DEFAULT: "var(--border-soft)",
      },
      maxWidth: {
        content: "1152px",
      },
      borderRadius: {
        card: "1rem",
      },
    },
  },
  plugins: [],
};

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14140F",
        paper: "#FAFAF7",
        moss: {
          50: "#EEF3EF",
          100: "#D7E3DA",
          300: "#8FB2A0",
          500: "#3F7D63",
          700: "#2F6F5E",
          900: "#1B3A30",
        },
        ember: "#E4572E",
        sand: "#EFEAE0",
        line: "#E4E1D8",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "14px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,20,15,0.06), 0 8px 24px -12px rgba(20,20,15,0.12)",
      },
      maxWidth: {
        content: "1280px",
      },
    },
  },
  plugins: [],
};
export default config;

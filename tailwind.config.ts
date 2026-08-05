import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#8B5CF6",
          dark: "#6D28D9",
          deep: "#6D28D9",
          light: "#F3EEFF",
          tint: "#F3EEFF",
        },
        accent: {
          DEFAULT: "#C4B5FD",
        },
        amber: { DEFAULT: "#F5A623", tint: "#FFF2DC", deep: "#9A6A0A" },
        green: { DEFAULT: "#33B189", tint: "#DEF6EE", deep: "#1B7A5C" },
        red: { DEFAULT: "#F2684B", tint: "#FDE7E1", deep: "#C1442B" },
        ink: "#182233",
        soft: "#67728A",
        faint: "#9AA4B8",
        bg: "#FBFCFE",
        border: "#E7ECF5",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "sans-serif"],
      },
      borderRadius: {
        xl2: "18px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,30,60,0.04)",
        pop: "0 8px 24px rgba(24,45,90,0.08)",
      },
    },
  },
  plugins: [],
};
export default config;

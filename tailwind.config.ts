import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: "#eef6f4",
          100: "#d5e9e4",
          200: "#aad3ca",
          300: "#7bb9ac",
          400: "#4a9686",
          500: "#2c7b69",
          600: "#1f6f5c", // Usiquimica brand accent
          700: "#1a5c4c",
          800: "#164a3e",
          900: "#123c33",
        },
      },
    },
  },
  plugins: [],
};
export default config;

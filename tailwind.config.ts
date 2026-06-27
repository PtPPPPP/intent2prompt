import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        cloud: "#f6f8fb",
        line: "#dbe2ea",
        accent: "#2563eb",
      },
      boxShadow: {
        soft: "0 16px 40px rgba(23, 32, 51, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;

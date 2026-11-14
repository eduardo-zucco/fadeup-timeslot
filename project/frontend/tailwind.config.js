/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        green: { DEFAULT: "#194d3c", hover: "#123c2e" },
        ink: "#233d33",
        muted: "#64756c",
        line: "#dce3d9",
        soft: "#edf2e8",
        paper: "#ffffff",
        error: "#9b332e",
      },
      fontFamily: {
        sans: ["Segoe UI", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

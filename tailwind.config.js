/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        lime: { DEFAULT: "#E9F40B" },
        ink: "#0B0E11",
        panel: "#10141A",
        panel2: "#161C24",
        line: "#232B36",
        mute: "#8A94A3",
        text: "#F2F4F7",
      },
      fontFamily: {
        display: ['"Work Sans"', "sans-serif"],
        sans: ['"Work Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

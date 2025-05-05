/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        beast: ["Beast", "sans-serif"],
        sans: ["Recursive", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#005995", // Lonely Blue
          hover: "#004b7a",
          light: "#f0f5f9", // Light blue
        },
        secondary: {
          DEFAULT: "#fa625f", // Stationary Pink Red
          hover: "#f94542",
        },
        accent: {
          yellow: "#fbf579", // Yellow Hand
          purple: "#600473", // Purpled
          "purple-light": "#f7f1f9", // Light purple
        },
      },
      keyframes: {
        scale: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.6)" },
        },
      },
      animation: {
        scale: "scale 0.8s ease-in-out 3",
      },
    },
  },
  plugins: [],
};

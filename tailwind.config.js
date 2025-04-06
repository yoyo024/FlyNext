/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        
        helvetica: ['Helvetica', 'Arial', 'sans-serif'],
        jersey: ["Jersey 25", "cursive"], // Custom font family
      },
    },
  },
  plugins: [],
};
  
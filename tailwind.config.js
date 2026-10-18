/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#007AFF', // Apple iOS System Blue
        surface: '#F2F2F7', // Apple System Gray 6
        'surface-dark': '#090A0F', // VisionOS Deep Obsidian
        border: '#E5E7EB',
        success: '#34C759', // Apple iOS Green
        warning: '#FF9500', // Apple iOS Amber/Orange
        danger: '#FF3B30', // Apple iOS Red
      },
      borderRadius: {
        'card': '24px',
        'squircle': '28px',
        'squircle-sm': '18px',
        'pill': '9999px',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'card': '0 10px 30px -5px rgba(0, 122, 255, 0.08)',
        'glass-light': '0 10px 30px -4px rgba(0, 0, 0, 0.04), 0 2px 8px -1px rgba(0, 0, 0, 0.02)',
        'glass-dark': '0 20px 40px -10px rgba(0, 0, 0, 0.5)',
        'dock-light': '0 20px 40px -8px rgba(0, 0, 0, 0.08), 0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        'dock-dark': '0 24px 48px -12px rgba(0, 0, 0, 0.6)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
    },
  },
  plugins: [],
};

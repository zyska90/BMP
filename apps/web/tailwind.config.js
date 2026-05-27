/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e8f2fc',
          400: '#3d8fd4',
          500: '#1a6bbd',
          700: '#0f3d6e',
          900: '#0a2540',
        },
        accent: {
          light: '#e4f2ec',
          mid: '#1d9e75',
          dark: '#0d5c46',
        },
        red: {
          100: '#fde8e4',
          500: '#c0392a',
        },
        success: {
          DEFAULT: '#059669',
          bg: '#d1fae5',
        },
        warn: {
          DEFAULT: '#d97706',
          bg: '#fef3c7',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#0a0a0f',
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'sans-serif'],
        display: ['var(--font-display)', 'Sora', 'sans-serif'],
      },
      borderRadius: {
        lg: '10px',
        md: '8px',
        sm: '6px',
      }
    },
  },
  plugins: [],
}

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f9f4ff',
          100: '#f3e4ff',
          500: '#7c3aed',
          700: '#5b21b6',
          900: '#3b0d72'
        }
      }
    }
  },
  plugins: []
};

export default config;

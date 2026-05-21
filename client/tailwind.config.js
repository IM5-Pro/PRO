/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        danger: '#EF4444',
        warning: '#F59E0B',
        dark: '#1F2937',
        light: '#F3F4F6',
        im5: {
          canvas: '#eef2f7',
          subtle: '#f4f7fb',
          surface: '#ffffff',
          inset: '#f8fafb',
          hover: '#f1f5f9',
          'accent-tint': '#eff6ff',
          'accent-muted': '#e8f0fa',
          border: '#e2e8f0',
          'border-soft': '#e8edf3',
        },
      },
      backgroundImage: {
        'im5-canvas': 'linear-gradient(145deg, #eef2f7 0%, #f8fafc 52%, #eef4f9 100%)',
        'im5-banner': 'linear-gradient(90deg, #eff6ff 0%, #ffffff 42%, #fffbeb 100%)',
        'im5-header': 'linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(248,250,252,0.95) 100%)',
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#1F2937',
          },
        },
      },
    },
  },
  plugins: [],
};

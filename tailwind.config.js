module.exports = {
    content: [
      "./pages/*.{html,js}",
      "./index.html",
      "./js/*.js",
      "./components/*.{html,js}"
    ],
    theme: {
      extend: {
        colors: {
          // Primary Colors - Vigilant Blues
          primary: {
            DEFAULT: "#2563EB", // blue-600
            50: "#EFF6FF", // blue-50
            100: "#DBEAFE", // blue-100
            200: "#BFDBFE", // blue-200
            300: "#93C5FD", // blue-300
            400: "#60A5FA", // blue-400
            500: "#3B82F6", // blue-500
            600: "#2563EB", // blue-600
            700: "#1D4ED8", // blue-700
            800: "#1E40AF", // blue-800
            900: "#1E3A8A", // blue-900
          },
          // Secondary Colors - Professional Depth
          secondary: {
            DEFAULT: "#1E40AF", // blue-800
            50: "#EFF6FF", // blue-50
            100: "#DBEAFE", // blue-100
            200: "#BFDBFE", // blue-200
            300: "#93C5FD", // blue-300
            400: "#60A5FA", // blue-400
            500: "#3B82F6", // blue-500
            600: "#2563EB", // blue-600
            700: "#1D4ED8", // blue-700
            800: "#1E40AF", // blue-800
            900: "#1E3A8A", // blue-900
          },
          // Accent Colors - Progress Indicators
          accent: {
            DEFAULT: "#F59E0B", // amber-500
            50: "#FFFBEB", // amber-50
            100: "#FEF3C7", // amber-100
            200: "#FDE68A", // amber-200
            300: "#FCD34D", // amber-300
            400: "#FBBF24", // amber-400
            500: "#F59E0B", // amber-500
            600: "#D97706", // amber-600
            700: "#B45309", // amber-700
            800: "#92400E", // amber-800
            900: "#78350F", // amber-900
          },
          // Background Colors
          background: "#FAFBFC", // slate-50
          surface: {
            DEFAULT: "#F1F5F9", // slate-100
            hover: "#E2E8F0", // slate-200
          },
          // Text Colors
          text: {
            primary: "#1E293B", // slate-800
            secondary: "#64748B", // slate-500
            muted: "#94A3B8", // slate-400
          },
          // Status Colors
          success: {
            DEFAULT: "#059669", // emerald-600
            50: "#ECFDF5", // emerald-50
            100: "#D1FAE5", // emerald-100
            500: "#10B981", // emerald-500
            600: "#059669", // emerald-600
            700: "#047857", // emerald-700
          },
          warning: {
            DEFAULT: "#D97706", // amber-600
            50: "#FFFBEB", // amber-50
            100: "#FEF3C7", // amber-100
            500: "#F59E0B", // amber-500
            600: "#D97706", // amber-600
            700: "#B45309", // amber-700
          },
          error: {
            DEFAULT: "#DC2626", // red-600
            50: "#FEF2F2", // red-50
            100: "#FEE2E2", // red-100
            500: "#EF4444", // red-500
            600: "#DC2626", // red-600
            700: "#B91C1C", // red-700
          },
          // Border Colors
          border: {
            DEFAULT: "#E2E8F0", // slate-200
            light: "#F1F5F9", // slate-100
            dark: "#CBD5E1", // slate-300
          },
        },
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
          mono: ['JetBrains Mono', 'monospace'],
        },
        fontSize: {
          'xs': ['0.75rem', { lineHeight: '1rem' }],
          'sm': ['0.875rem', { lineHeight: '1.25rem' }],
          'base': ['1rem', { lineHeight: '1.5rem' }],
          'lg': ['1.125rem', { lineHeight: '1.75rem' }],
          'xl': ['1.25rem', { lineHeight: '1.75rem' }],
          '2xl': ['1.5rem', { lineHeight: '2rem' }],
          '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
          '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
          '5xl': ['3rem', { lineHeight: '1' }],
          '6xl': ['3.75rem', { lineHeight: '1' }],
        },
        spacing: {
          '18': '4.5rem',
          '88': '22rem',
          '128': '32rem',
        },
        borderRadius: {
          'xl': '0.75rem',
          '2xl': '1rem',
          '3xl': '1.5rem',
        },
        boxShadow: {
          'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          'medium': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          'large': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
        animation: {
          'fade-in': 'fadeIn 0.3s ease-out',
          'slide-up': 'slideUp 0.3s ease-out',
          'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
        transitionDuration: {
          '200': '200ms',
          '300': '300ms',
        },
        transitionTimingFunction: {
          'out': 'cubic-bezier(0, 0, 0.2, 1)',
        },
      },
    },
    plugins: [],
  }
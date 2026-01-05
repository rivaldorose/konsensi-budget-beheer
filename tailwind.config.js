/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			DEFAULT: '1rem',
  			lg: '1.5rem',
  			xl: '2rem',
  			'2xl': '2.5rem',
  			'3xl': '3rem',
  			full: '9999px',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			primary: '#10b981',
  			'primary-hover': '#34d399',
  			'primary-active': '#059669',
  			'primary-dark': '#059669',
  			'primary-darker': '#047857',
  			secondary: '#B2FF78',
  			// Dark mode colors
  			'bg-main': '#0a0a0a',
  			'card-bg': '#1a1a1a',
  			'card-elevated': '#2a2a2a',
  			'border-main': '#2a2a2a',
  			'border-accent': '#3a3a3a',
  			'text-primary': '#ffffff',
  			'text-secondary': '#a1a1a1',
  			'text-tertiary': '#6b7280',
  			'text-disabled': '#4b5563',
  			// Konsensi brand colors
  			'konsensi-primary': '#10b981',
  			'konsensi-hover': '#34d399',
  			'konsensi-dark-green': '#059669',
  			'konsensi-bg-green': 'rgba(16, 185, 129, 0.1)',
			success: '#10B981',
			info: '#60A5FA',
			warning: '#F59E0B',
			'status-green': '#10B981',
			'status-blue': '#60A5FA',
			'status-orange': '#F59E0B',
			'status-red': '#EF4444',
			'status-purple': '#8B5CF6',
			'konsensi-green': '#10B981',
			'konsensi-green-light': '#34d399',
			'konsensi-green-dark': '#059669',
			'accent-red': '#EF4444',
			'bg-base': '#0a0a0a',
			'bg-card': '#1a1a1a',
			'bg-card-elevated': '#2a2a2a',
			'border-base': '#2a2a2a',
			'border-accent': '#3a3a3a',
			'text-primary': '#ffffff',
			'text-secondary': '#a1a1a1',
			'text-tertiary': '#6b7280',
			'accent-yellow': '#fbbf24',
			'dark-bg': '#0a0a0a',
			'dark-card': '#1a1a1a',
			'dark-card-elevated': '#2a2a2a',
			'dark-border': '#2a2a2a',
			'dark-border-accent': '#3a3a3a',
			'primary-green': '#10b981',
			'light-green': '#34d399',
			'active-green': '#059669',
  			'konsensi-dark': '#3D6456',
  			'brand-dark': '#3D6456',
  			'konsensi-bg': '#F8F8F8',
  			'background-page': '#F8F8F8',
  			'background-light': '#f6f8f7',
  			'background-dark': '#10221c',
  			'surface-dark': '#1a1a1a',
  			'border-dark': '#2a2a2a',
  			'text-gray': '#a1a1a1',
  			'text-gray-dark': '#6b7280',
			'accent-blue': '#3b82f6',
			'accent-orange': '#F59E0B',
			'accent-purple': '#8B5CF6',
  			'purple-badge': '#8B5CF6',
  			'surface-white': '#FFFFFF',
  			'text-main': '#3D6456',
  			'gray-text': '#4B5563',
  			'gray-sub': '#9CA3AF',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		fontFamily: {
  			display: ['Plus Jakarta Sans', 'Montserrat', 'Inter', 'sans-serif'],
  			header: ['Montserrat', 'Inter', 'sans-serif'],
  			body: ['Lato', 'Inter', 'sans-serif'],
  			montserrat: ['Montserrat', 'sans-serif'],
  			lato: ['Lato', 'sans-serif'],
  			sans: ['Inter', 'sans-serif']
  		},
		boxShadow: {
			'soft-dark': '0 4px 24px rgba(0,0,0,0.4)',
			'modal-dark': '0 8px 32px rgba(0,0,0,0.7)',
			'glow-green': '0 0 15px rgba(16, 185, 129, 0.15)',
			soft: '0 4px 24px rgba(0,0,0,0.06)',
			subtle: '4px 0 24px rgba(0,0,0,0.04)',
			glow: '0 0 0 3px rgba(16,185,129,0.1)',
			button: '0 4px 12px rgba(16,185,129,0.2)',
			card: '0 2px 8px rgba(0,0,0,0.2)',
			float: '0 20px 60px rgba(61,100,86,0.3)',
			nav: '0 2px 4px rgba(0,0,0,0.1)',
			hover: '0 4px 12px rgba(0,0,0,0.1)',
			modal: '0 4px 12px rgba(0,0,0,0.5)'
		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'fade-in': {
  				'0%': { opacity: '0', transform: 'translateY(10px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'fade-in': 'fade-in 0.5s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
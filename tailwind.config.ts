import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'playfair': ['Playfair Display', 'serif'],
				'urbanist': ['Urbanist', 'sans-serif'],
				'proxima': ['Nunito Sans', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				'chicago-blue': 'hsl(var(--chicago-blue))',
				'chicago-red': 'hsl(var(--chicago-red))',
				'chicago-light-blue': 'hsl(var(--chicago-light-blue))',
				'chicago-dark-blue': 'hsl(var(--chicago-dark-blue))',
				'chicago-gunmetal': 'hsl(var(--chicago-gunmetal))',
				'chicago-gold': 'hsl(var(--chicago-gold))',
				'chicago-gold-dark': 'hsl(var(--chicago-gold-dark))',
				'chicago-yellow': 'hsl(var(--chicago-yellow))',
				'chicago-green': 'hsl(var(--chicago-green))',
				'chicago-orange': 'hsl(var(--chicago-orange))',
				'chicago-grey': 'hsl(var(--chicago-grey))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
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
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
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
				'pulse-emergency': {
					'0%, 100%': {
						opacity: '1',
						transform: 'scale(1)'
					},
					'50%': {
						opacity: '0.7',
						transform: 'scale(1.05)'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'train-city': {
					'0%': {
						transform: 'translateX(-250px)'
					},
					'100%': {
						transform: 'translateX(800px)'
					}
				},
				'float-logo': {
					'0%, 100%': {
						transform: 'translateX(-50%) translateY(0px)'
					},
					'50%': {
						transform: 'translateX(-50%) translateY(-10px)'
					}
				},
				'float-towards-screen': {
					'0%': {
						transform: 'scale(0.2) translateZ(-300px) rotateY(20deg) rotateX(10deg)',
						opacity: '0',
						filter: 'blur(12px)'
					},
					'100%': {
						transform: 'scale(1) translateZ(0) rotateY(0deg) rotateX(0deg)',
						opacity: '1',
						filter: 'blur(0px)'
					}
				},
				'zoom-in-text': {
					'0%': {
						transform: 'scale(0.7) translateX(0)',
						opacity: '0'
					},
					'50%': {
						transform: 'scale(0.85) translateX(0)',
						opacity: '0.7'
					},
					'100%': {
						transform: 'scale(1) translateX(0)',
						opacity: '1'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-emergency': 'pulse-emergency 1s ease-in-out infinite',
				'fade-in': 'fade-in 0.3s ease-out',
				'train-city': 'train-city 8s linear infinite',
				'float-logo': 'float-logo 3s ease-in-out infinite',
				'float-towards-screen': 'float-towards-screen 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
				'zoom-in-text': 'zoom-in-text 3s ease-out forwards'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;

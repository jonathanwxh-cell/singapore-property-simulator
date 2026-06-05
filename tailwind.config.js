/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // ===== Property Lah! warm playful theme =====
        paper: "#FFF7EE",        // warm cream base
        "paper-2": "#FFE9D6",    // deeper cream for gradients
        cloud: "#FFFFFF",        // card surface
        ink: "#211D33",          // primary text (deep plum)
        "ink-soft": "#585074",   // secondary text (WCAG-AA on cream)
        "ink-faint": "#8C86A0",  // tertiary text
        line: "#EFE7DC",         // hairline border on cream
        "line-2": "#E4DACB",
        coral: "#FF5B5B",        // brand / primary action
        "coral-deep": "#E23E3E",
        gold: "#F4A93B",         // premium / accent
        "gold-soft": "#FFF1DD",
        money: "#15A65B",        // positive money
        "money-soft": "#E6F7EE",
        loss: "#E5484D",         // negative money / danger
        "loss-soft": "#FCEBEC",
        teal: "#10B4AC",         // HDB / info
        grape: "#7C5CFF",        // condo / accent
        sky: "#3B9EFF",          // EC / info-2
        slate: "#5B6472",        // commercial
        night: "#1A1726",        // dark surfaces (event cards, endings)
        "night-2": "#272235",
        "night-soft": "#3A3450",

        // ===== legacy tokens (kept for dead components; harmless) =====
        "deep-space": "#060B14",
        "void-navy": "#0B1628",
        "cyan-glow": "#00F0FF",
        "neon-blue": "#2979FF",
        success: "#00E676",
        warning: "#D7B95B",
        danger: "#FF1744",
        "purple-glow": "#7C4DFF",
        "pink-accent": "#FF4081",
        "orange-warm": "#B87952",
        "glass-border": "rgba(255,255,255,0.08)",
        "glass-fill": "rgba(255,255,255,0.03)",
        "glass-hover": "rgba(255,255,255,0.06)",
        "text-primary": "#FFFFFF",
        "text-secondary": "#8899AA",
        "text-dim": "#4A5568",
        divider: "rgba(255,255,255,0.06)",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        display: ['"Fredoka"', '"Plus Jakarta Sans"', 'sans-serif'],
        jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
        inter: ['"Inter"', 'sans-serif'],
        // legacy
        orbitron: ['"Plus Jakarta Sans"', 'sans-serif'],
        rajdhani: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"Inter"', 'monospace'],
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        card: "20px",
        button: "14px",
        chip: "999px",
        sheet: "26px",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(33, 29, 51, 0.06)",
        card: "0 8px 24px rgba(33, 29, 51, 0.08), 0 1.5px 4px rgba(33, 29, 51, 0.05)",
        "card-lift": "0 18px 44px rgba(33, 29, 51, 0.16), 0 3px 10px rgba(33, 29, 51, 0.08)",
        pop: "0 12px 30px rgba(255, 91, 91, 0.32)",
        sheet: "0 -10px 40px rgba(33, 29, 51, 0.14)",
        inner1: "inset 0 1px 0 rgba(255,255,255,0.6)",
      },
      keyframes: {
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "count-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "60%": { transform: "scale(1.06)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(14px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        wiggle: {
          "0%,100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
        sheen: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(120%)" },
        },
        "pulse-soft": {
          "0%,100%": { transform: "scale(1)", boxShadow: "0 12px 30px rgba(255,91,91,0.30)" },
          "50%": { transform: "scale(1.025)", boxShadow: "0 16px 40px rgba(255,91,91,0.44)" },
        },
        shake: {
          "0%,100%": { transform: "translateX(0)" },
          "20%,60%": { transform: "translateX(-6px)" },
          "40%,80%": { transform: "translateX(6px)" },
        },
        "ken-burns": {
          "0%": { transform: "scale(1) translate(0,0)" },
          "50%": { transform: "scale(1.08) translate(-1%,-1%)" },
          "100%": { transform: "scale(1) translate(0,0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out forwards",
        "slide-up": "slide-up 0.45s cubic-bezier(0.22,1,0.36,1) forwards",
        "count-up": "count-up 0.5s ease-out forwards",
        pop: "pop 0.42s cubic-bezier(0.22,1.4,0.4,1) forwards",
        rise: "rise 0.4s cubic-bezier(0.22,1,0.36,1) forwards",
        wiggle: "wiggle 0.4s ease-in-out",
        sheen: "sheen 1.1s ease-in-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        shake: "shake 0.45s ease-in-out",
        "ken-burns": "ken-burns 28s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

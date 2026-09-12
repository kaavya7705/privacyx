import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Core dark backgrounds
        "px-bg": "#0a0e1a",
        "px-bg-secondary": "#0f1629",
        "px-bg-tertiary": "#151d35",
        "px-surface": "#1a2342",
        "px-surface-hover": "#1f2b50",
        "px-border": "#243056",
        "px-border-light": "#2d3a66",

        // Neon accents
        "px-cyan": "#00f0ff",
        "px-cyan-dim": "#00a3ad",
        "px-magenta": "#ff006e",
        "px-magenta-dim": "#b3004d",
        "px-emerald": "#00ff88",
        "px-emerald-dim": "#00b35f",
        "px-purple": "#9945ff",
        "px-amber": "#ffb800",
        "px-blue": "#3b82f6",

        // Risk levels
        "risk-low": "#00ff88",
        "risk-medium": "#ffb800",
        "risk-high": "#ff6b35",
        "risk-critical": "#ff006e",

        // Text
        "px-text": "#e2e8f0",
        "px-text-secondary": "#94a3b8",
        "px-text-muted": "#64748b",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "Consolas", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-cyber": "linear-gradient(135deg, #0a0e1a 0%, #151d35 50%, #0f1629 100%)",
        "glow-cyan": "radial-gradient(circle, rgba(0,240,255,0.15) 0%, transparent 70%)",
        "glow-magenta": "radial-gradient(circle, rgba(255,0,110,0.15) 0%, transparent 70%)",
      },
      boxShadow: {
        "glow-cyan": "0 0 20px rgba(0,240,255,0.3), 0 0 60px rgba(0,240,255,0.1)",
        "glow-magenta": "0 0 20px rgba(255,0,110,0.3), 0 0 60px rgba(255,0,110,0.1)",
        "glow-emerald": "0 0 20px rgba(0,255,136,0.3), 0 0 60px rgba(0,255,136,0.1)",
        "card": "0 4px 24px rgba(0,0,0,0.4)",
        "card-hover": "0 8px 32px rgba(0,0,0,0.6)",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "number-tick": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "border-glow": {
          "0%, 100%": { borderColor: "rgba(0,240,255,0.3)" },
          "50%": { borderColor: "rgba(0,240,255,0.8)" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "scan-line": "scan-line 3s linear infinite",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "slide-in-right": "slide-in-right 0.4s ease-out forwards",
        "number-tick": "number-tick 0.4s ease-out forwards",
        "border-glow": "border-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;

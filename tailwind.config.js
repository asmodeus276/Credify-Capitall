import tailwindcssForms from '@tailwindcss/forms';
import tailwindcssContainerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./*.html",
    "./blogs/**/*.html",
    "./personal-loan-faq/**/*.html",
    "./js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        "on-secondary": "#ffffff",
        "surface-container": "#e5eeff",
        "surface": "#ffffff",
        "on-tertiary-fixed-variant": "#5e4109",
        "tertiary-fixed": "#ffdeac",
        "outline-variant": "#c5c6d0",
        "tertiary-fixed-dim": "#eac07d",
        "outline": "#757680",
        "surface-bright": "#f8f9ff",
        "on-error-container": "#93000a",
        "on-secondary-container": "#fffbff",
        "tertiary": "#362300",
        "primary-fixed": "#dbe1ff",
        "inverse-primary": "#b6c5fb",
        "surface-container-high": "#dce9ff",
        "surface-tint": "#4e5d8c",
        "primary-fixed-dim": "#b6c5fb",
        "tertiary-container": "#523700",
        "primary-container": "#2b3a67",
        "primary": "#142450",
        "on-tertiary-fixed": "#281900",
        "on-secondary-fixed": "#410004",
        "on-primary-fixed-variant": "#364572",
        "secondary-container": "#da3437",
        "on-error": "#ffffff",
        "secondary-fixed": "#ffdad7",
        "error": "#ba1a1a",
        "on-primary-fixed": "#061845",
        "inverse-on-surface": "#eaf1ff",
        "error-container": "#ffdad6",
        "secondary": "#b61722",
        "surface-container-highest": "#d3e4fe",
        "surface-dim": "#cbdbf5",
        "surface-variant": "#d3e4fe",
        "on-tertiary-container": "#c8a061",
        "background": "#f8f9ff",
        "surface-container-lowest": "#ffffff",
        "on-background": "#0b1c30",
        "on-primary": "#ffffff",
        "secondary-fixed-dim": "#ffb3ad",
        "on-surface": "#0b1c30",
        "on-secondary-fixed-variant": "#930013",
        "surface-container-low": "#eff4ff",
        "inverse-surface": "#213145",
        "on-tertiary": "#ffffff",
        "on-surface-variant": "#45464f",
        "on-primary-container": "#96a5d9"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "xl": "8rem",
        "lg": "4rem",
        "md": "2rem",
        "sm": "1rem",
        "margin-desktop": "3rem",
        "margin-mobile": "1rem",
        "gutter": "24px"
      },
      boxShadow: {
        "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        "DEFAULT": "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
        "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
        "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)"
      },
      fontFamily: {
        "headline-lg": ["Inter", "sans-serif"],
        "headline-md": ["Inter", "sans-serif"],
        "label-md": ["Inter", "sans-serif"],
        "display-md": ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "headline-sm": ["Inter", "sans-serif"]
      },
      fontSize: {
        "headline-lg": "32px",
        "headline-md": "28px",
        "label-md": "14px",
        "display-md": "36px",
        "body-md": "16px"
      }
    }
  },
  plugins: [
    tailwindcssForms,
    tailwindcssContainerQueries
  ]
};

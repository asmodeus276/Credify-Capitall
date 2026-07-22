---
name: Credify Capital Core
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464f'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#757680'
  outline-variant: '#c5c6d0'
  surface-tint: '#4e5d8c'
  primary: '#142450'
  on-primary: '#ffffff'
  primary-container: '#2b3a67'
  on-primary-container: '#96a5d9'
  inverse-primary: '#b6c5fb'
  secondary: '#b61722'
  on-secondary: '#ffffff'
  secondary-container: '#da3437'
  on-secondary-container: '#fffbff'
  tertiary: '#362300'
  on-tertiary: '#ffffff'
  tertiary-container: '#523700'
  on-tertiary-container: '#c8a061'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b6c5fb'
  on-primary-fixed: '#061845'
  on-primary-fixed-variant: '#364572'
  secondary-fixed: '#ffdad7'
  secondary-fixed-dim: '#ffb3ad'
  on-secondary-fixed: '#410004'
  on-secondary-fixed-variant: '#930013'
  tertiary-fixed: '#ffdeac'
  tertiary-fixed-dim: '#eac07d'
  on-tertiary-fixed: '#281900'
  on-tertiary-fixed-variant: '#5e4109'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style
The design system is engineered for **Credify Capital**, a fintech platform where trust, precision, and speed are paramount. The brand personality is "Institutional yet Progressive"—combining the stability of a traditional bank with the velocity of a modern startup.

The visual style follows a **Corporate Modern** aesthetic. It prioritizes clarity and functional efficiency, using heavy whitespace to reduce cognitive load during complex financial tasks. The interface relies on structured grids, subtle tonal layering, and high-contrast typography to evoke an emotional response of security and professional competence.

## Colors
The palette is dominated by **Corporate Navy (#2B3A67)**, used for primary branding, navigation backgrounds, and high-level headings to establish authority. 

**Vibrant Red (#EF4444)** is reserved strictly for primary Call-to-Action (CTA) elements and critical alerts. This high-contrast pairing ensures that the path to conversion is unmistakable.

- **Primary Text:** Navy (#2B3A67) for maximum legibility and brand alignment.
- **Secondary/Legal Text:** Slate Gray (#64748B) to create visual hierarchy without sacrificing readability.
- **Success/Warning:** Use standard semantic greens and ambers, but keep them desaturated to ensure the Primary Navy and Accent Red remains the focal point.

## Typography
**Inter** is the sole typeface for this design system, chosen for its exceptional legibility in data-heavy financial environments. 

- **Weight Strategy:** Use Bold (700) and Semi-Bold (600) for headlines to anchor the page. Regular (400) is used for all body copy to ensure a clean, airy feel.
- **Readability:** Maintain a generous line height (1.5x) for body text to assist in scanning financial statements and terms of service.
- **Micro-copy:** Small labels and legal text should never drop below 12px. Use Medium (500) weight for small labels to maintain contrast against gray backgrounds.

## Layout & Spacing
The layout employs a **12-column fixed grid** on desktop (max-width 1280px) and a **4-column fluid grid** on mobile. 

- **Rhythm:** An 8px base unit governs all spatial relationships. 
- **Containers:** Use 24px (md) internal padding for cards and modals to create "breathable" financial data displays.
- **Vertical Spacing:** Use 40px (lg) or 64px (xl) between major sections to prevent the UI from feeling "cramped," which can trigger user anxiety in financial contexts.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and extremely subtle **Ambient Shadows**. This design system avoids heavy drop shadows to maintain a sleek, professional "SaaS-plus" look.

- **Level 0 (Background):** #F8FAFC (Light Slate).
- **Level 1 (Cards/Surface):** White (#FFFFFF) with a 1px border in #E2E8F0.
- **Level 2 (Active/Hover):** White with a soft, diffused shadow (Y: 4px, Blur: 12px, Color: rgba(43, 58, 103, 0.05)). 
- **Modals:** Use a backdrop blur (12px) with a semi-transparent Navy overlay (20% opacity) to keep the user focused on the transaction at hand.

## Shapes
The shape language uses **Rounded (0.5rem)** corners as the standard. This softens the serious nature of the Navy/Red palette, making the platform feel approachable and modern.

- **Standard Elements:** Buttons, Input fields, and small Chips use the 0.5rem (8px) radius.
- **Large Elements:** Dashboard cards and Modals scale up to 1rem (16px) to emphasize the containerized nature of the content.
- **Strictness:** Do not use fully pill-shaped buttons; the 8px radius maintains the "architectural" integrity of a financial tool.

## Components
- **Buttons:** Primary buttons are Solid Red (#EF4444) with White text. Secondary buttons are Outline Navy (#2B3A67) with a 1.5px border.
- **Input Fields:** Use a 1px border (#E2E8F0) that transitions to Navy (#2B3A67) on focus. Labels are always persistent (not floating) to ensure clarity during data entry.
- **Chips:** Used for transaction statuses (e.g., "Pending", "Cleared"). These use a desaturated background of the semantic color with high-contrast text.
- **Data Tables:** Row-based with subtle dividers. Header rows should be slightly tinted with #F1F5F9. No vertical grid lines.
- **Cards:** White background, 1px border, 16px corner radius. Used for summarizing account balances and credit limits.
- **Progress Indicators:** Linear bars are preferred over circular spinners for "loading" states to imply a horizontal "flow" of data and capital.
# Shoe AI Commerce Design System

## Positioning

Shoe AI Commerce is a premium AI design and procurement workflow for footwear teams. The interface must feel modern, calm, production-ready, and fast. Use flat premium surfaces with strong typography, restrained amber accent, and clear workflow hierarchy.

## Visual Direction

- Style: modern flat SaaS, premium editorial hero, minimal decoration.
- Mood: clean, confident, creative, operational.
- Primary palette: stone/near-black foundation with amber procurement accent.
- Avoid: emoji icons, random gradients, low-contrast gray text, decorative animation, mixed icon styles.

## Color Tokens

| Token | Value | Use |
| --- | --- | --- |
| `--color-primary` | `#1C1917` | Primary actions, brand anchors, active states |
| `--color-on-primary` | `#FFFFFF` | Text/icons on primary |
| `--color-secondary` | `#44403C` | Secondary copy and subtle controls |
| `--color-accent` | `#A16207` | AI/procurement highlight, badges, selected emphasis |
| `--color-background` | `#FAFAF9` | Page background |
| `--color-foreground` | `#0C0A09` | Primary text |
| `--color-surface` | `#FFFFFF` | Cards, dialogs, form surfaces |
| `--color-surface-muted` | `#F5F5F4` | Panels, history rows, empty states |
| `--color-border` | `#D6D3D1` | Borders/dividers |
| `--color-destructive` | `#DC2626` | Destructive/error actions |
| `--color-ring` | `#1C1917` | Focus ring |

Use semantic tokens or Tailwind stone/amber mappings. New components must not introduce raw per-screen hex values unless they extend this table.

## Typography

- Font stack: DM Sans fallback through system UI.
- H1: 48-72px desktop, 36-48px mobile, weight 900, tight tracking.
- Page/section titles: 18-28px, weight 700-900.
- Body: 16px minimum, line-height 1.5-1.75.
- Labels/buttons: 14px, weight 600-700.
- Data and money: use tabular numbers where tables or balances are dense.

## Layout

- Container: `max-w-7xl`, horizontal padding `px-4 sm:px-6 lg:px-8`.
- Spacing rhythm: 4/8px scale. Common gaps: 12, 16, 24, 32, 40.
- Cards: `rounded-3xl`, stone border, white translucent surface, restrained shadow.
- Mobile-first: no horizontal scroll at 375px. Grids collapse to one column before desktop.
- Fixed/sticky UI must not cover content. Header includes skip link and stable height.

## Components

- Buttons: min-height 44px, rounded 16px, clear default/outline/ghost/destructive variants, visible disabled state.
- Inputs/selects/textareas: min-height 44px, visible label, focus ring, semantic autocomplete/input mode when applicable.
- Dialogs: 55% dark scrim with blur, max-width dialog, visible title and recovery path for errors.
- Tables: readable padding, subtle row hover, headers use small uppercase labels.
- Badges: amber accent only for status/category; do not use badge color as the only state indicator.
- Icons: Lucide only, consistent stroke family, aria-hidden for decorative icons, aria-label for icon-only buttons.

## Interaction

- All clickable elements need cursor pointer and keyboard focus visibility.
- Micro-interactions: 150-300ms; use color/opacity/transform only.
- Respect `prefers-reduced-motion`; no decorative infinite animations.
- Async actions must show success/error feedback. Errors sit near the related field or action.

## Accessibility Gates

- Normal text contrast >= 4.5:1; large UI glyphs/data marks >= 3:1.
- Full keyboard access; skip link on nav-heavy shell.
- Form controls require visible labels or an explicit accessible label.
- Color cannot be the only status signal; pair color with text/status labels.
- Touch targets >= 44x44px.

## Page Patterns

### Landing
Hero-centric. One dominant CTA above the fold, secondary action visually subordinate, proof/value cards below.

### Workbench
Three-column desktop workflow: assets, prompt/config, results. Collapse to one column on mobile. Keep errors inside the active panel.

### Procurement
Catalog grid + selected-order panel. Color swatches need text labels; selection state should be visible beyond color alone.

### Recharge
Amount presets use selected state, payment provider selection is clear, success state confirms balance impact.

### Admin
Sidebar on desktop, content-first on mobile. Tables/cards must keep operational status visible without relying on color alone.

## Future Development Rule

Before building a new page, read this file first. If `design-system/pages/<page>.md` exists, that page file may override this master. Otherwise this master is the source of truth.

---
name: design-system
description: The Beauty CRM visual language — sea-wave teal + peach palette, light/dark theme tokens, typography, layout (sidebar → burger drawer), components, icons and illustrations. Use whenever creating or restyling any frontend page, component or CSS in this repo.
---

# Beauty CRM design system

The look is a calm beauty-salon / cosmetology brand: soft teal ("морська хвиля") with peach accents, airy cards and an elegant serif for headings. It must work in **both** light and dark theme.

## Where things live

| What | File |
|---|---|
| Tokens (colors, radii, shadows, fonts) and base element styles | `frontend/src/index.css` |
| Component styles | `frontend/src/App.css` |
| Theme state (`useTheme`, `toggleTheme`) | `frontend/src/shared/theme/theme.ts` |
| No-flash theme bootstrap | inline `<script>` in `frontend/index.html` |
| Icons | `frontend/src/shared/components/Icon.tsx` |
| Illustration (device, serum, pump bottle, jar, eucalyptus) | `frontend/src/shared/components/BeautyIllustration.tsx` |
| Background line pattern (used as a mask) | `frontend/src/assets/beauty-pattern.svg` |
| Shell: sidebar, burger drawer, theme and language switches | `frontend/src/shared/components/Layout.tsx` |

## Rules

1. **No hex or rgb colors in `App.css` or in components.** Use tokens: `--color-primary`, `--color-accent`, `--color-surface`, `--color-text-muted` and so on. A new color means a new token, defined in both `:root` and `:root[data-theme='dark']` in `index.css`.
2. **Text on peach uses `--color-accent-strong`.** Plain `--color-accent` is for fills and decoration only; it fails contrast as text.
3. **Text on `--color-primary` backgrounds uses `--color-on-primary`.** It's white in light theme and dark in dark theme, never hard-coded `#fff`.
4. **Status colors:** success, danger and warning, each with a `-bg` pair. Use pending = peach, paid = success, cancelled = muted.
5. **Typography:**
   - `--font-display` (Cormorant Garamond) for `h1`, brand, big KPI numbers and hero text.
   - `--font-sans` (Manrope) for everything else.
   - `h2` is the bold sans card title.
6. **Shape:** cards use `--radius-lg`, inputs and buttons `--radius-sm`, chips and tabs `--radius-pill`. Shadows come only from `--shadow-sm/md/lg`.
7. **Buttons:** the bare `<button>` is already styled as a secondary (outlined) button, and `type="submit"` as the primary one. Only add a class for a genuinely different control (tab, icon button, link-like).
8. **Icons:** `<Icon name="…" />` from `Icon.tsx` (24px grid, stroke `currentColor`, width 1.8). Add new icons there, in the same style. No emoji as icons, and no icon fonts.
9. **Illustrations:** `BeautyIllustration` colors itself through `illu-*` classes and `--illu-*` tokens. Extend it the same way: shapes get a class, never a fill color. Decorative SVGs get `aria-hidden="true"`.
10. **Photos:** there are no stock photos in the repo. To add one, put it in `frontend/public/images/`, credit its license in the commit, and expose it through a CSS variable (example: `--auth-photo` on `.auth-visual`) so it can be swapped per theme. Never hot-link images.

## Layout and breakpoints

- **≥ 1025px:** fixed left sidebar (`--sidebar-width`), content max `--content-max-width`.
- **≤ 1024px:** sidebar becomes an off-canvas drawer behind the burger in `.mobile-topbar`. The overlay, Escape and navigating to another page all close it. When closed it is `visibility: hidden`, so it stays out of the Tab order.
- **≤ 860px:** form rows stack, detail grid is one column, the hero illustration hides.
- **≤ 480px:** tighter paddings, KPIs in two columns.
- Wide content (tables) scrolls inside `.table-scroll`, never the page.

## Theme

- `data-theme="light|dark"` on `<html>`. The choice is stored in `localStorage['crm.theme']`; without one, the app follows the system theme.
- `ThemeToggle` (icon-only in the top bar, labelled in the sidebar) is the only way to switch. Don't add another.

## Accessibility

- All UI text and every `aria-label` goes through i18next, with keys in both `uk.json` and `en.json`.
- Focus is visible via `--focus-ring`; don't remove it.
- Respect `prefers-reduced-motion` (already global in `index.css`). Keep animations short (`--transition`).

## Before you finish

Run `cd frontend && npm run lint && npm test && npm run build`, then use the **ui-check** skill to screenshot the changed pages in both themes and at 1440 and 390 width, and look at the screenshots.

# Storefront fonts

The storefront uses **Oxanium** for English display typography (hero and major section headings).

Oxanium is distributed under the **SIL Open Font License 1.1 (OFL-1.1)**.

## Required self-hosted file

Place the upstream Google Fonts variable font at this exact repository path:

- `apps/storefront/public-safe/fonts/Oxanium[wght].ttf`

At runtime, Vite/GitHub Pages serves it from:

- `/mouher-lab/fonts/Oxanium[wght].ttf`

The corresponding `@font-face` declaration lives in:

- `apps/storefront/src/styles/fonts.css`

The face is configured for the Oxanium weight range `200 800` with `font-display: swap`.

## Upstream source and license

Canonical Google Fonts directory:

- `google/fonts/ofl/oxanium/Oxanium[wght].ttf`
- `google/fonts/ofl/oxanium/OFL.txt`

Keep the upstream OFL license information with the font when distributing or modifying it. Do not replace this asset with demo, personal-use-only, or otherwise incompatible font files.

## Typography policy

- English hero and major section headings: `Oxanium`
- Navigation, buttons, product information, prices, search and other UI: Apple/system sans-serif stack
- Farsi typography remains controlled separately by the Farsi font stack

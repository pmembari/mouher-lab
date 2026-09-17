# Storefront licensed fonts

Place the commercially licensed techno display webfont files in this directory using these filenames:

- `techno-display.woff2` (preferred)
- `techno-display.woff` (optional fallback)

The storefront references them from `src/styles/fonts.css` through the GitHub Pages base path:

- `/mouher-lab/fonts/techno-display.woff2`
- `/mouher-lab/fonts/techno-display.woff`

Do not add demo, personal-use-only, or otherwise unlicensed font files to this directory.

If your licensed font uses a different family name or supports only a single weight, update the `@font-face` declaration in `src/styles/fonts.css` accordingly.

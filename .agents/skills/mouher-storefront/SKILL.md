---
name: mouher-storefront
description: Build and refine Mouher's customer-facing ecommerce storefront. Use for homepage, product pages, collections, navigation, cart, checkout, account UX, responsive behavior, motion, imagery, RTL/LTR, accessibility, and visual design. Preserve Mouher's existing Persian blue, red, gold, and neutral color system while applying Apple-inspired UX principles such as product focus, large imagery, restrained motion, progressive disclosure, whitespace, and polished interactions. Keep all commerce behavior compatible with the Medusa Store API.
---

# Mouher Storefront

Build Mouher's public storefront as a premium, product-led ecommerce experience.

## Core Direction

Use:

* Apple-inspired UX discipline.
* Large product imagery.
* Editorial product storytelling.
* Restrained, purposeful motion.
* Strong typography hierarchy.
* Generous whitespace.
* Progressive disclosure.
* Simple navigation.
* Smooth transitions.
* Clear purchasing paths.

Do not copy:

* Apple branding.
* Apple visual identity.

The goal is to learn from Apple's interaction quality with some modifications.

## Mouher Brand Must Stay

Preserve Mouher's existing color system.

Use approximately:

```text
primary / persian-blue: #1C39BB
accent-red / persian-red: #CC3333
accent-gold / persian-gold: #F4C430
ink: #111111
surface: #FFFFFF
surface-muted: #F6F6F4
border: #E5E5E0
```

Use Persian blue for primary actions.

Use Persian red for urgency, errors, destructive actions, and sale emphasis.

Use Persian gold for premium highlights, selected states, loyalty, and editorial emphasis.

Keep large surfaces neutral so product photography remains dominant.

Do not replace Mouher's palette with generic Apple black-and-white styling.

## UX Principles

Prefer this hierarchy:

```text
discover
  -> explore
  -> understand
  -> configure
  -> purchase
```

Each screen should have a clear primary action.

Avoid showing every control and piece of information at once.

Reveal secondary details progressively.

Reduce visual noise around products.

Prefer fewer, stronger sections over many small cards.

## Homepage

The homepage should feel editorial rather than like a dense marketplace.

Preferred flow:

```text
hero story
-> featured collection
-> product story
-> featured products
-> motion-led visual section
-> category or collection story
-> trust / delivery / service
```

The first viewport should communicate brand and product value before showing dense product grids.

Use large imagery wherever real product photography is available.

A hero may use:

`data/Mouher_Data/data/videos/1-parnian.webm`

or a lightweight derivative.

Do not commit private raw media.

Do not read private media unless the current task explicitly requires it.

## Visual Merchandising Rules

Homepage merchandising must be visual, editorial, and immediately understandable.

Do not render important discovery entities as plain text rows with only
a title and product count.

Collections and categories should normally have visual representation.

Preferred homepage collection treatment:

- large image-led cards
- one strong image or collage per collection
- collection name
- optional restrained product count
- optional short merchandising line
- clear click target to the dedicated collection route

Example:

```text
┌──────────────────────────────┐
│                              │
│       collection image       │
│                              │
│  Unisex                      │
│  180 pieces             →    │
└──────────────────────────────┘
```
For two collections, prefer an asymmetric editorial composition rather
than two small utility cards.
For example:
```
┌───────────────────────────────┬───────────────┐
│                               │               │
│                               │ Accessories   │
│          UNISEX               │               │
│                               │ collection    │
│       large visual story      │ image         │
│                               │               │
│ View collection →             │ Explore →     │
└───────────────────────────────┴───────────────┘
```
Unisex       180
Accessories    1

as a primary homepage merchandising treatment.
Counts are supporting metadata, never the visual focus.
Product Card Restraint
Product listing imagery should remain clean.
Avoid:
- image zoom on hover
- aggressive scale effects
- image tilt
- floating badges everywhere
- glass overlays over product photography
- gradient overlays unless text readability requires them
- multiple hover actions appearing on top of the image
- unnecessary animation on every card
Preferred product card interaction:
- image remains stable
- subtle border/shadow/text change if needed
- entire card or product title links to product detail
- product name and price remain easy to scan
- sold-out or sale state may appear as small restrained text/badge
Do not make product browsing feel like an effects demo.
Search And Filter Visual Style
Search and filters should feel calm, lightweight, and familiar.
Search:
- prefer a clean expanding header search or top sheet
- one clear field
- one clear submit action
- no oversized modal unless necessary
- no decorative chips by default
- no excessive blur or glassmorphism
Filters:
- default product browsing should prioritize imagery
- keep filters behind a clear "Filters" control when possible
- use a drawer or sheet for detailed filters
- keep sorting visible but compact
- do not show a permanent dense filter sidebar unless the information
  architecture clearly benefits from it
The visual reference is modern fashion ecommerce with Apple-like
restraint, not experimental UI.

## Homepage Navigation Contract

The homepage is a merchandising and discovery surface, not the full catalog browser.

Homepage links must land on real browsing routes:

- "Shop", "Shop All", catalog CTAs -> `#/shop`
- featured product cards -> `#/products/<handle>`
- category cards -> `#/categories/<slug>`
- collection cards -> `#/collections/<slug>`
- search submissions -> `#/search?q=<query>`

Do not make catalog entities such as categories or collections merely scroll
to another homepage section.

Homepage sections may preview products, categories, and collections, but
deeper exploration must transition to the dedicated catalog route.

Do not duplicate filtering behavior between HomePage and ShopPage.
HomePage may provide curated previews; ShopPage owns full filtering,
sorting, pagination, and catalog discovery.

## Storefront CSS Architecture

Do not grow `src/index.css` into a monolithic stylesheet.

Keep `index.css` for:
- reset
- design tokens
- typography
- global primitives
- shared layout foundations

Prefer scoped files for major surfaces:

- `styles/header.css`
- `styles/home.css`
- `styles/search.css`
- `styles/shop.css`
- `styles/products.css`

When redesigning a surface, remove or migrate obsolete rules instead of
stacking multiple generations of CSS overrides.

Prefer semantic class names tied to component responsibility.

UI implementation should preserve:
- responsive behavior
- RTL/LTR
- keyboard focus
- reduced motion
- loading / empty / error states

## Multi-Video Hero

Mouher has multiple portrait-oriented product/lifestyle videos rather than a single widescreen hero asset.

Do not stretch, distort, or aggressively crop portrait media merely to imitate a traditional widescreen hero.

When multiple related portrait videos are available, prefer a composed multi-panel visual story.

Desktop may display up to three portrait videos together with intentional spacing and hierarchy.

Tablet should reflow the composition rather than shrink all videos excessively.

Mobile should generally show one primary portrait video at a time, with swipe/carousel or sequential presentation when the other clips are useful.

Treat the three videos as one coordinated storytelling section rather than three unrelated autoplay elements.

Performance rules:

- use optimized WebM/MP4 rather than GIF
- provide poster images
- lazy-load non-primary media
- pause videos when outside the viewport
- avoid downloading every high-resolution source immediately
- use muted autoplay only
- respect prefers-reduced-motion
- preserve original aspect ratio
- avoid unnecessary cropping
- prioritize page interactivity and LCP over motion

Motion should feel coordinated and restrained. Do not animate all three panels aggressively at once.

## Motion

Motion must improve understanding or perceived quality.

Good uses:

* image reveals
* subtle fades
* content entrance
* product transitions
* scroll-linked storytelling
* gallery transitions
* cart drawer transitions
* variant-selection feedback
* sticky sections where they improve product storytelling

Avoid:

* constant decorative animation
* excessive parallax
* motion that delays interaction
* large JavaScript animation systems without clear benefit
* effects that cause layout shift
* motion that harms accessibility

Respect `prefers-reduced-motion`.

Prefer CSS transitions and lightweight browser-native techniques before adding animation libraries.

## Large Imagery

Product photography should dominate:

* homepage hero
* collection stories
* product detail pages
* editorial sections

Images should:

* have stable dimensions
* avoid layout shift
* use responsive image sizing
* use meaningful alt text
* load appropriately for viewport position
* preserve product color accurately
* remain visually useful on mobile

Do not use abstract decorative artwork when real Mouher product imagery can communicate the product better.

## Product Detail Page

Prefer:

```text
large product imagery
-> name / price / essential purchase information
-> variant choice
-> add-to-cart
-> additional imagery / story
-> material / sizing / care
-> shipping / returns
-> related products
```

Do not overwhelm the first viewport with every detail.

Variant selection must correctly map to Medusa product variants.

Show stock state truthfully.

Handle:

* many variants
* missing images
* sold-out variants
* size/color options
* loading
* API failure
* incomplete product metadata

## Collections And Search

Collection and category pages should feel spacious and product-led.

Product cards should emphasize:

1. image
2. product name
3. price
4. relevant state such as sold-out or promotion

Avoid excessive badges and controls.

Filters should remain accessible without dominating the page.

Search must support both Persian and English text.

Always provide useful:

* loading states
* empty states
* error states
* no-result states

## Cart And Checkout

Keep cart interactions fast and predictable.

Cart mutations must use Medusa-compatible behavior.

Preserve:

* selected variant
* quantity
* current price
* inventory state

Checkout should minimize unnecessary decisions.

Handle:

* payment failure
* payment cancel
* delayed response
* inventory changes
* expired cart state
* invalid address
* network errors

Errors must be recoverable whenever possible.

## Medusa Compatibility

Medusa is the commerce backend.

Do not recreate commerce state in the storefront.

Use Medusa Store API behavior for:

* products
* variants
* collections
* categories
* cart
* customers
* checkout
* orders
* fulfillment data
* pricing
* promotions
* inventory availability

Keep API interaction behind typed adapters or API clients.

Do not scatter raw HTTP calls across UI components.

Do not depend directly on Medusa's database schema.

## Internationalization

Support:

* Persian / RTL
* English / LTR

The language switch must remain discoverable in the upper navigation area.

Verify both directions for:

* navigation
* product cards
* forms
* prices
* tables when applicable
* drawers
* breadcrumbs
* icons
* carousels

Do not implement RTL merely by changing text alignment.

Layout direction itself must work correctly.

## Accessibility

Require:

* keyboard navigation
* visible focus states
* semantic HTML
* accessible labels
* sufficient contrast
* reduced-motion support
* usable touch targets
* alt text
* clear form errors

Visual polish must never depend on inaccessible interactions.

## Performance

Large imagery and motion must not make the store feel slow.

Prefer:

* responsive images
* lazy loading below the fold
* lightweight animation
* code splitting
* stable layout
* selective preloading
* minimal client-side dependencies

Prioritize interaction responsiveness over decorative effects.

## Existing References

Use `.agents/skills/vercel-commerce/` for ecommerce completeness and storefront lifecycle patterns.

Use this skill for Mouher-specific UX and brand decisions.

If the two conflict:

* preserve Medusa compatibility
* preserve Mouher branding
* preserve accessibility
* prefer the simpler architecture

## Customer Account Guardrails

- Customer account UX lives in `apps/storefront/`.
- Customer authentication uses Medusa email/password authentication.
- Mobile phone is required during account creation.
- CAPTCHA is not currently required; do not add it unless explicitly requested.
- GitHub Pages is the public development storefront host; real accounts require a separately reachable Medusa backend/database.
- Do not create a second backend/BFF solely for GitHub Pages.

## Agent Workflow

Before changing storefront code:

1. Read the relevant `PLANS.md` section.
2. Identify the smallest set of relevant storefront files.
3. Use `graphify-out/` only when explicitly requested or when a concrete architecture question cannot be answered from targeted source/document reads.
4. Do not broadly crawl the repository.
5. Write or update tests for behavior changes.
6. Implement the smallest useful change.
7. Verify responsive, RTL/LTR, loading, empty, and error states where applicable.

Follow `AGENTS.md` for canonical context exclusions and file-size limits. Do not widen them here.

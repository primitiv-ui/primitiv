# Client brief — three-page site

You've been brought in to build a small marketing/showcase website for a
client. Pick the business yourself — anything plausible (a studio, a
product, a small service business, a local brand — your call) — but it
must be **fictional**: no real company names, logos, trademarks, or
photography of real people/places/products. Write real copy for it, not
placeholder text — headings and body copy should read like an actual page
for an actual business, even though the business itself is invented.

## What to build

Exactly **three pages**:

1. **A landing/home page.** First impression matters here: a strong hero,
   an overview of what the business offers, some kind of credibility
   signal (testimonial, stats, logos — whatever suits it), and a clear
   call to action.
2. **A page that sells the offering in depth** — pricing, plans, services,
   or a product line-up, whichever fits. At least one section on this page
   should be genuinely information-dense (a comparison, a detailed list, a
   table — your call), and give visitors a way to get answers without
   leaving the page (an FAQ works well here, but isn't mandatory).
3. **A third page of your choice** that rounds the site out — About,
   Contact, Case Studies, whatever the business needs.

Across the three pages (not necessarily one-per-page), include at least
one section that's the opposite of dense — generous whitespace, a single
strong statement, minimal UI. A real site has both rhythms; this one
should too.

Use images to make it feel like a real site or app, not a wireframe — hero
art, feature shots, avatars, whatever fits. For imagery, use a placeholder
image service keyed by a fixed seed and size (e.g.
`https://picsum.photos/seed/<your-seed>/<width>/<height>`) rather than
sourcing real photography — keeps things legally clean and reproducible.

## Your toolkit

Your client has one non-negotiable requirement: the site's components come
from **Primitiv**, their in-house component library, and nothing else —
no other UI/component package. Two more hard rules, both non-negotiable:

- **Install and update Primitiv only via its official CLI or your package
  manager** (`primitiv`, `npm`/`pnpm`/`yarn install`) — never by copying
  component source out of its GitHub repo by hand.
- **Pin every Primitiv package to exactly `0.1.29`** — not a caret range,
  the literal version — so nothing shifts under you mid-build.
- **Type is fixed too:** load **Khand** and **Asta Sans** from Google
  Fonts (a `<link>` in your generated `index.html`) and use nothing else.
  These happen to be the same two typefaces Primitiv's own default theme
  is built around, so this isn't an arbitrary restriction — it's "use the
  system's default type," which is what most projects that don't
  hand-roll their own type scale would do anyway.

**Styling comes from the library's design tokens, not invented values.**
Whatever base styles, component styles, and custom properties Primitiv
gives you access to in your setup are your palette — colours, type sizes,
spacing, radii, all of it. Don't hand-write a hex colour, a one-off
font-size, or an arbitrary spacing value that isn't resolving one of those.
The one place this doesn't apply is pure structural CSS — flexbox/grid
mechanics, positioning, media-query breakpoints you define yourself — where
there's nothing token-shaped to reach for. Your library doesn't ship a
ready-made helper for every layout situation; where you hit that, write
plain structural CSS for the shape of it, but keep every colour/type/space
value on a token.

## Delivery hygiene

Keep a `NOTES.md` in the project root as you go — the same way you would
on any real engagement. Whenever you make a decision because the obvious
approach didn't pan out (a component didn't cover what you needed, a
default clashed with something, you had to fall back to plain CSS for
something), jot a line or two: what happened, what you did instead. This
isn't a design document — a running list is fine.

## Done means

- All three pages build and render with no console errors.
- `NOTES.md` exists in the project root.
- You've taken a screenshot of each page at three widths — 390px, 768px,
  and 1440px — and saved them somewhere obvious in the project (a
  `screenshots/` folder is fine).
- A one-paragraph summary at the top of your `NOTES.md` (or a short
  `README.md`) describing what you built and how to run it.

This is a fixed-scope engagement — get it done well, not exhaustively.
Once the checklist above is met, you're done.

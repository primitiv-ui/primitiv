# `breadcrumb` — registry entry

The artefacts `primitiv add breadcrumb` resolves and copies into a consumer
repo. Breadcrumb is a **structural compound** like Tabs and Avatar (RFC 0004
§3, D56): the styled surface is a root plus five consumer-composed
subcomponents (`List` / `Item` / `Link` / `Page` / `Separator`), flowing
through the same `primitiv-emit` generators (D54) rather than a hand-authored
escape hatch.

## Files

| File | Authored? | Role |
|---|---|---|
| `contract.json` | **authored** | The styling contract (RFC 0004 §3.4) — the single API source the recipe + wrapper are generated from. |
| `styles.css` | **authored** | The canonical default theme (the muted-trail / primary-current-page visual design). |
| `styles.scss` | generated | The canonical CSS re-expressed for SCSS consumers (from `styles.css`). |
| `breadcrumb.recipe.ts` | generated | One `cva` per styled part (from `contract.json`). |
| `breadcrumb.tsx` | generated | The styled wrappers — `Breadcrumb` / `BreadcrumbList` / `BreadcrumbItem` / `BreadcrumbLink` / `BreadcrumbPage` / `BreadcrumbSeparator` (from `contract.json`). |

Only `contract.json` (the API) and `styles.css` (the design) are **authored**;
the SCSS form, recipe and wrapper are **generated** by `primitiv-emit` and pinned
to their source by drift-guard tests, so they can't fall out of sync (D53).

## The contract (`contract.json`)

A **hybrid** document with two halves and two sources of truth (D15):

- **`dataAttributes`** — `source: "auto"`. `Page` carries `aria-current="page"`,
  unconditionally, mirroring the headless `Breadcrumb.Page`. `Root`, `List`,
  `Item`, `Link` and `Separator` carry no ARIA/data hooks of their own.
- **`root` / `subcomponents` / `modifiers` / `customProperties`** — authored
  styling conventions the headless layer does not emit: the `.primitiv-breadcrumb`
  root and the `__list` / `__item` / `__link` / `__page` / `__separator` BEM
  parts, the root's single `size` modifier, and the `--primitiv-breadcrumb-*`
  custom-property API.

`subcomponents` is what tells the generators this is a **structural compound**:
instead of one element (Button) or an auto-rendered subtree (Switch), the styled
surface is thin per-part wrappers the consumer composes themselves (D56), exactly
mirroring how the headless `Breadcrumb.Root` / `.List` / `.Item` / `.Link` /
`.Page` / `.Separator` compose. None of the five subcomponents carries its own
modifiers or opts into `wrapTextChildren` — every part's text is styled directly
on its own class, since none of them read as a button/pill shape needing a
trimmed label span.

## The default theme (`styles.css`)

**The current-page/ancestor-link distinction is new** (2026-07-27) — the live
Figma component (`436:12220`, the `Item` set) previously rendered every entry,
link or current page alike, on the identical `content/secondary` foreground.
That gap was closed on both sides together (design-first, code-second, per the
`figma-bridge-token-sync` philosophy): a real `State` **variant** (`link` /
`current`, not a boolean — Figma booleans can only toggle layer visibility, not
rebind a fill) was added to `Breadcrumb/Item` in Figma, the trailing "Page" item
in all 10 composed-set variants was switched to `State=current`, and the final
colour pairing was tuned live against screenshots: `content/muted` for every
ancestor `Link` and the `Separator` glyphs, `content/primary` for the current
`Page` — muted (neutral-500) reads with a bigger perceptual gap against primary
(neutral-900) than secondary (neutral-700) did, and `content/muted` is already
the established token for de-emphasised-but-legible text elsewhere (Field's
helper text, Table's caption, Select's placeholder). The registry mirrors that
exact pairing: `--primitiv-breadcrumb-link-color` / `--primitiv-breadcrumb-separator-color`
default to `content/muted`, `--primitiv-breadcrumb-page-color` to
`content/primary`.

`Link`'s hover state reveals an **underline that is always present in the
layout** (`text-decoration-color: transparent` at rest) rather than toggling
`text-decoration-line` on/off, so the affordance is a pure colour transition —
no reflow, no layout shift — fading in to `currentColor` together with the
muted→primary colour lift on hover (`--primitiv-breadcrumb-link-color-hover`).
The transition uses `motion-duration-control` / `motion-easing-default`, the
same pair Button uses for hover feedback. `Page` has no hover/focus styling —
it isn't a link. `Link`'s `:focus-visible` state gets a simple `outline` (not
the two-layer `box-shadow` ring framed controls use) since it's plain inline
text with no radiused frame for the ring to hug; a small `radii/4` rounds the
outline's corners.

Sizing reuses the shared `body/{size}/*` type scale directly for every part's
text (Asta Sans Regular, weight 400 in both `link` and `current` states — the
Figma design deliberately carries no weight difference, colour alone marks the
current page). The separator's icon size is genuinely component-specific:
`breadcrumb/{size}/icon-size` is its own pre-existing Context token family (not
aliasing `framed-control/*`), matching Figma's own binding exactly. The
inter-item gap (`--primitiv-breadcrumb-gap`) is a flat `space-4` at every
size — Figma's own `itemSpacing` is an unbound literal `4` that does not scale
with size either, so the registry mirrors that rather than inventing a
scaling behaviour the design doesn't have.

Structured per RFC 0008 — the per-component API tokens + resting look in
`primitiv.base`, the `size` re-pointing in `primitiv.variants`, the link hover/
focus affordance in `primitiv.states`.

**It is yours to edit.** The stable surface is the *contract* (classes,
`data-*`, custom-property names), not these values (RFC 0006 Principle 2 —
names are stable, values are not). Requires the token layer (`primitiv tokens`)
for the `--primitiv-space-*`, `--primitiv-breadcrumb-*-icon-size`,
`--primitiv-body-*`, `--primitiv-content-*` and `--primitiv-motion-*` custom
properties it resolves.

## The SCSS form (`styles.scss`)

CSS is canonical; SCSS is the same stylesheet re-expressed for `$`-pipeline
consumers. `styles.scss` is `styles.css` **verbatim** followed by one
`$primitiv-breadcrumb-*` variable per `--primitiv-breadcrumb-*` knob the
stylesheet declares. It is **derived, not hand-maintained**: `primitiv-emit`'s
`emit_component_scss` produces it from `styles.css`, and a drift-guard test
(`crates/primitiv-emit/src/scss_tests.rs`) asserts the committed file is exactly
that output.

## The styled surface (`breadcrumb.recipe.ts` + `breadcrumb.tsx`)

The primary DX is **flat, shadcn-shaped exports** the consumer composes (D56) —
the headless package is the Radix-equivalent (compound `Breadcrumb.Root` /
`.List` / `.Item` / `.Link` / `.Page` / `.Separator`); the styled surface is the
shadcn-equivalent (`Breadcrumb` / `BreadcrumbList` / `BreadcrumbItem` /
`BreadcrumbLink` / `BreadcrumbPage` / `BreadcrumbSeparator`). Both files are
**generated** from `contract.json` (D53):

- **`breadcrumb.recipe.ts`** — one `cva` per styled part: `breadcrumb` (the
  root's `size` axis) and base-only `breadcrumbList` / `breadcrumbItem` /
  `breadcrumbLink` / `breadcrumbPage` / `breadcrumbSeparator`.
- **`breadcrumb.tsx`** — one thin wrapper per part, each applying its part class
  via its recipe and forwarding the rest to the headless
  `Breadcrumb.{Root,List,Item,Link,Page,Separator}`. The consumer writes the
  familiar shape:

  ```tsx
  <Breadcrumb size="md">
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink href="/">Home</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink href="/library">Library</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>Current article</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
  ```

The styled surface is **format-independent** and gated by the **styles opt-in**,
not the format (D55): any styled React consumer (css / scss / tailwind) gets the
same wrappers; the format only selects which stylesheet defines the rules behind
the classes. So `class-variance-authority` is a **styled-surface** dependency
(`registry.json` → `styles.packages`).

Drift guards in `crates/primitiv-emit/src/{recipe,wrapper}_tests.rs` assert each
committed artifact equals the generator's output for the committed contract.

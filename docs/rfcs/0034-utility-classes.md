# RFC 0034 — Utility classes

**Status:** Built (2026-11-14) — `primitiv-emit::utilities`, `primitiv utilities`, `init --utilities`, and the docs site's /utilities/ page
**Decision sought:** ship a small, fixed set of utility classes, generated from
the tokens, that `primitiv` installs on request: enough for everyday layout and
colour in your own markup, in Primitiv's style, without a utility framework.

---

## 1. Why

The components cover the controls, and `Grid`, `Stack`, `Container` and `Box`
cover structured layout. What a page still needs is the small stuff between
them: put two things in a row, push one to the end, give a block some padding,
mute a line of text, centre a heading. Today that means writing CSS that reads
the tokens by hand, which every trial agent did — and which is where a
hand-picked `--primitiv-space-64` that does not exist comes from (trial 4,
finding 14).

A Tailwind project already has an answer: `primitiv tokens --format tailwind`.
This RFC is for everyone else — plain CSS and SCSS projects, and above all
pages built with Primitiv Elements, which have no build step to run a utility
framework through.

## 2. What it is, and what it is not

- **Small and fixed.** About 210 classes (§4), the same in every project. No
  configuration, no prefix option, no purge step. If a page needs something the
  set does not have, that is what the page's own CSS is for.
- **Every value is a token.** A utility is one declaration reading one
  `var(--primitiv-…)`, so it follows theme (`data-theme`) and density
  (`data-density`) exactly as the components do. There are no raw values except
  where the property has no token (`display`, `flex-direction`, alignment,
  percentages).
- **Roles, not ramps.** Colour utilities read the colour roles (`surface`,
  `content`, `border`, `feedback`), never the palette steps, so they stay right
  in dark mode. A page that wants `color-blue-600` writes it in its own CSS.
- **Not Tailwind.** Names follow Tailwind's where one exists, because that is
  what people and agents already know, but there are no state variants
  (`hover:`), no arbitrary values (`p-[13px]`), and no plugins. Responsive
  variants exist only for layout (§4.10).

## 3. Shape

### 3.1 The cascade layer

Utilities live in a new last layer, `primitiv.utilities`. `utilities.css` opens
with the full order every stylesheet already declares (RFC 0008 §3.1), with the
new layer appended:

```css
@layer primitiv.reset, primitiv.tokens, primitiv.theme, primitiv.base,
  primitiv.variants, primitiv.states, primitiv.utilities;
```

Layer order is fixed by each name's first appearance, and every other stylesheet
lists the same six in the same order, so `primitiv.utilities` lands last
whichever file the page loads first. No copied stylesheet needs to change.

So a utility beats any component rule without `!important` —
`class="primitiv-button p-24"` gets the padding — and the page's own unlayered
CSS still beats both.

### 3.2 Names

Bare names, as in Tailwind: `.flex`, `.p-16`, `.text-muted`. Steps are named the
way the tokens are, in pixels at the default root size, so `.p-16` is
`var(--primitiv-space-16)` and reads the same as the token it uses. A page that
also loads Tailwind or Bootstrap does not need this file, and should not load
both — the RFC accepts that collision rather than prefixing every class.

### 3.3 Installing

```sh
npx primitiv-ui@latest init --utilities     # recorded in primitiv.json
npx primitiv-ui@latest utilities            # or on its own, any time
```

- Writes `utilities.css` beside `tokens.css`, and prints its `<link>` line.
  `tokens.css` does not import it: a page opts in by linking it.
- `primitiv tokens` regenerates it whenever `primitiv.json` records it, so the
  two cannot drift.
- Plain CSS in every format: an SCSS project links it like any CSS file. A
  Tailwind project is refused with a pointer to `--format tailwind`, because
  shipping a second, smaller Tailwind into it is never what it wants.

### 3.4 Where it is built

A new `utilities` module in `crates/primitiv-emit`, beside the CSS, SCSS and
Tailwind emitters. The class list is **data in that module** — a curated table
of `(class, property, token)` rows, not an exhaustive walk of the token tree —
because "small and fixed" is a choice the tokens cannot make. The emitter
resolves each row's token against the DTCG source and **fails the build** if
one does not exist, so a renamed token cannot silently leave a dead utility. Its
output is held by a hand-authored golden file, like every other emitter.

## 4. The classes

Spacing utilities use eight steps of the space scale — **0, 4, 8, 12, 16, 24,
32, 48** — written below as `{s}`. The full scale has 28; these eight cover
every gap and padding the components themselves use, and keep the file small.

### 4.1 Display (9)

`block` `inline-block` `inline` `flex` `inline-flex` `grid` `inline-grid`
`contents` `hidden`

`.hidden` is `display: none`, and is the one utility that matters for the
`[hidden]` trap (trial 3): it is in the last layer, so it beats a component's
own `display`.

### 4.2 Flex and grid (21)

- Direction and wrap: `flex-row` `flex-col` `flex-wrap` `flex-nowrap`
- Cross axis: `items-start` `items-center` `items-end` `items-stretch` `items-baseline`
- Main axis: `justify-start` `justify-center` `justify-end` `justify-between`
- Sizing: `grow` (`flex: 1 1 0%`) `shrink-0` `min-w-0` (the overflow fix every
  flex child with long text needs)
- Columns: `grid-cols-1` `grid-cols-2` `grid-cols-3` `grid-cols-4`
  (`repeat(n, minmax(0, 1fr))`)

### 4.3 Gap (8)

`gap-{s}` → `gap: var(--primitiv-space-{s})`

### 4.4 Padding (32)

`p-{s}` `px-{s}` `py-{s}` `pt-{s}` (logical: `padding-inline`, `padding-block`,
`padding-block-start`). `pb`, `pl`, `pr` are left out: `py` and `pt` cover the
cases a page actually has, and four more groups would double the section.

### 4.5 Margin (18)

`m-0` `mx-auto` `mt-{s}` `mb-{s}` (logical, block-start and block-end). Margin is
mostly the flow rhythm's job (`Prose`, RFC 0016); these are for the exceptions.

### 4.6 Width and height (10)

`w-25` `w-33` `w-50` `w-66` `w-75` `w-100` `w-auto` (percentages, as in the
original request: `.w-50`, not `.w-1/2`, which needs an escape in CSS),
`max-w-prose` (`65ch`), `h-100`, `h-auto`.

### 4.7 Text (37)

- Colour, from `content`: `text-primary` `text-secondary` `text-muted`
  `text-disabled` `text-inverse` `text-error`
- Colour, from `feedback/*/soft/foreground`: `text-success` `text-warning`
  `text-info` `text-danger`
- Styles, each setting the whole text style (family, size, weight, line height)
  from the density-aware type tokens: `body-xs` … `body-xl` (5), `label-xs` …
  `label-xl` (5), `heading-1` … `heading-6` (6), `display-lg` `display-xl`,
  `overline`
- Weight: `font-regular` `font-medium` `font-semibold` `font-bold`
- Alignment: `text-start` `text-center` `text-end`
- `truncate` (one line, ellipsis)

### 4.8 Surface, border, radius, shadow (25)

- Background, from `surface`: `bg-default` `bg-subtle` `bg-raised` `bg-sunken`
  `bg-inverse` `bg-selected`; from `feedback/*/soft/background`: `bg-success`
  `bg-warning` `bg-info` `bg-danger`
- Border: `border` (1px, `border/default`), `border-subtle` `border-strong`
  (colour only), `border-0`
- Radius: `rounded-0` `rounded-4` `rounded-8` `rounded-12` `rounded-16`
  `rounded-full`
- Shadow, from `elevation`: `shadow-flat` `shadow-raised` `shadow-overlay`
  `shadow-floating` `shadow-modal`

### 4.9 Accessibility (1)

`sr-only` — visually hidden, still announced.

### 4.10 Responsive layout (51)

The one place a static file can do something hand-written CSS cannot: the
emitter knows the breakpoint values (`breakpoint.*`), so it can write real media
queries, which `var()` cannot appear in. Limited to the classes that change a
layout — display (4.1, `hidden` included), direction and wrap, and the four
column counts, 17 classes — under `sm:` `md:` `lg:` (`.md\:flex`, written
`md:flex` in markup), min-width, mobile first.

### 4.11 Size

160 base classes and 51 responsive ones, about 210 rules at roughly 55 bytes
each: **≈ 12 KB, ≈ 3 KB gzipped.** Smaller
than `tokens.css` by an order of magnitude, so there is no case for purging it.

## 5. Documentation

- A **Utilities** page, generated from the same table the emitter reads (the
  token reference's pattern), listing every class with the token it reads, and
  linked from the Custom elements page, the Tokens page and `llms-elements.txt`.
- `init`'s help, the registry and CLI page, and `llms.txt` name `--utilities`
  and `primitiv utilities`.
- The Custom elements page's Styling section says when to reach for them: your
  own layout and the odd adjustment, never as a second way to style a
  component's internals (that is what its custom properties are for).

## 6. Decisions

Settled 2026-11-14:

1. **The spacing steps stay at eight**, all from the existing scale. Nothing is
   added to the scale for page-level spacing.
2. **Responsive variants ship in v1** (§4.10).
3. **No Figma work.** Utilities are a code-side convenience over tokens that
   Figma already has as variables.

## 7. Build order

1. `primitiv-emit::utilities`: the table, the token check, the golden file.
2. `primitiv utilities` and `init --utilities`, with `primitiv.json` recording it
   and `primitiv tokens` regenerating it. Held at 100% lines, regions and
   functions like the rest of the CLI.
3. The docs page, generated from the table, and the links in §5.
4. A trial whose brief asks for a page built from Elements and utilities alone.

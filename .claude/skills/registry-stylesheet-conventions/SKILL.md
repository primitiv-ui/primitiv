---
name: registry-stylesheet-conventions
description: How to author the copied registry component stylesheets (registry/components/<name>/styles.css and its .scss mirror) — the no-magic-numbers rule (tokenize every literal that maps to a design token, including zeros), the genuine exceptions, how to find a token's emitted custom-property name, the animated focus-ring and open/close (grid-collapse) standards, and the CSS/SCSS/contract sync checklist. TRIGGER when editing or auditing a registry component stylesheet, replacing a literal value with a token, hard-coding a value in styles.css/styles.scss, adding a focus ring or an open/close panel animation, or adding a new registry component's theme. SKIP for headless packages/react component work, the Rust/token-emit engine, and Figma variable work.
---

# Registry stylesheet conventions

For authoring the copied component stylesheets (`registry/components/<name>/styles.css`
and its `.scss` mirror). The layer structure lives in RFC 0008; this skill
captures the **no-magic-numbers** rule and its edges.

## Tokenize literals — don't hard-code values

Every value that maps to a design token must be written as that token's custom
property (`var(--primitiv-…)`), **not** a raw literal. The stable surface is the
token contract; literals bypass it and can't be re-themed (RFC 0006 Principle 2 —
names are stable, values are not).

This applies to **intent-carrying and structural values alike**, including zeros:

| Literal                         | Use instead                                   |
| ------------------------------- | --------------------------------------------- |
| `9999px` (pill radius)          | `var(--primitiv-radii-full)`                  |
| `border: 0`, `border-block: 0`  | `var(--primitiv-border-width-0)`              |
| `padding: 0`                    | `var(--primitiv-space-space-0)` *             |
| `border-radius: 0`              | `var(--primitiv-radii-0)`                     |
| a fixed dimension (e.g. `80px`) | the matching size step, `var(--primitiv-size-size-80)` * |
| `opacity: 0.5` (disabled)       | `var(--primitiv-opacity-50)` †                |
| `transparent` (a colour)        | `var(--primitiv-color-transparent)`           |

\* `size-size-*` / `space-space-*` are doubled today because of a Figma
variable-naming wart — see the deferred item in
`docs/transfer-and-next-steps.md`. Use the doubled names until that is fixed;
they are what the emitter currently produces.

† `--primitiv-opacity-50` is the exact-value primitive. A semantic
disabled-opacity token (`--primitiv-disabled-opacity`, currently 0.4) exists but
is intentionally **not** used yet — revisit when the disabled-state semantics are
firmed up.

## Genuine exceptions — leave as literals

- **No token exists.** Tokenize against an existing family; only leave a literal
  when there is genuinely no token for the value. Motion now has one: transitions
  and animations use `var(--primitiv-motion-duration-*)` (`feedback`/`control`/
  `expand`/`overlay`) and `var(--primitiv-motion-easing-*)`
  (`default`/`enter`/`exit`/`linear`) — never a raw `120ms ease`.
- **Non-design CSS mechanics**, which carry no theming intent: `outline: none`,
  `flex-shrink: 0`, `z-index: 1`, and the `box-shadow` geometry zeros
  (`0 0 0 …`) in the focus ring.

## Mobile tap-highlight on every interactive element

Any rule that styles a genuinely clickable/tappable element — recognisable by
a `cursor: pointer` (or `cursor: default` on a still-clickable row, like
Dropdown's menu items) sitting in the same rule — **must** also set:

```css
-webkit-tap-highlight-color: transparent;
```

Mobile WebKit/Chrome apply a translucent grey/black overlay to any tappable
element on `:active` by default, entirely independent of the component's own
`:hover`/`:active` styling — so without this, a real device shows a jarring
flash on tap that never appears in desktop testing or in Storybook/kitchen-sink
screenshots. It is a **CSS mechanic with no token home** (the value must
literally be `transparent`, like `outline: none`) — leave it as a literal, but
never omit it from an interactive rule.

This is deliberately **per-component**, not a shared reset: `primitiv.reset`
(`crates/primitiv-emit/assets/base.css`) is a narrow, prose-only reset (RFC
0008 §7/D60, "not a Normalize-style blanket") — every interactive control
already owns its base rule in its own registry stylesheet, so the fix belongs
there too, next to the `cursor` declaration it travels with. A trigger that is
a **pass-through** with no styling of its own (Dropdown's `Trigger`, which
takes no className — see its `.tsx` header comment) needs no fix: it inherits
whatever real interactive element the consumer wraps (usually `Button`, which
already carries it).

## Every `:hover` rule needs an `(hover: hover)` guard

A raw `:hover` selector fires on touch devices too: tapping an element
simulates `:hover`, and it **sticks** until the user taps elsewhere (there is
no real pointer to leave). An unguarded rule leaves a just-tapped control
showing its hover shade instead of its resting/selected/active one — on
SegmentedControl this reads as "the background stays on the wrong colour
after tapping". Wrap every `:hover` rule (never `:active` — that clears
correctly on touchend, it isn't the problem) in:

```css
@media (hover: hover) {
  .primitiv-x__item:hover {
    /* … */
  }
}
```

`@media` nests inside `@layer` and keeps the rule's layer membership, so this
is a pure guard, not a restructure. If a selector list mixes a real `:hover`
with a JS/consumer-tracked attribute hook (e.g. Carousel's thumbnail
`[data-group-hover]`), split them: guard the `:hover` half, leave the
attribute half alone (it isn't this stylesheet's concern). Check every new
`:hover` rule against this — grep the file for `:hover` before calling a
stylesheet done.

## Animating a grid-collapse row that also clamps to a fixed preview height

The grid-row open/close technique (`grid-template-rows: 0fr` closed, `1fr`
open — see "Animating open/close" below) only interpolates between **the same
track-sizing function type**. `0fr ↔ 1fr` animates smoothly; a fixed length
(e.g. an animated `Npx` clamp) mixed with `1fr` on the same property does
**not** — the transition staggers or jumps instead of animating (caught on
Collapsible's `collapsedHeight` read-more variant). If a component needs a
"clamped preview, not fully closed" state (Collapsible's `collapsedHeight`),
don't try to fold the clamp value into the row track. Instead:

- Keep the row unconditionally `1fr` whenever the clamp is active (a `data-*`
  flag the wrapper sets from the relevant prop, e.g. `data-clamped`) — the row
  itself never needs to shrink.
- Put the actual clamp on the **clip** (the grid item inside the row) as a
  `max-block-size` transition between the clamp length and a generous fixed
  length (e.g. `100vh` — not `none`, which doesn't interpolate either). This is
  a plain length-to-length transition, which does animate.
- Force the clip's `visibility` back to `visible` under the clamp flag: the
  ordinary "hide on close" rule doesn't apply — a clamped preview is real,
  readable content that is never actually hidden.

## Finding the token name

The custom property is `--primitiv-<dtcg-path-joined-by-dashes>`. Confirm a token
exists (and its exact emitted name) against the generated token layer — run
`primitiv tokens` or grep `apps/workbench/src/primitiv-tokens.css` — rather than
guessing; the path-doubling above is one reason the name isn't always obvious.

## `text-box-trim` on button/pill-shaped labels

Any framed control whose visual shape reads as a **button or pill** — Button,
ToggleGroupItem, Tabs/Trigger, Icon Button's label (if it grows one), and any
future sibling — must trim its label's line-box leading so the text optically
centres regardless of the font's metrics:

```css
text-box-trim: trim-both;
text-box-edge: cap alphabetic;
```

**These two properties must be applied to the element directly wrapping the
text node, never the flex container** — engines don't honour `text-box-trim`
on a box with siblings (an icon + text row). Two shapes exist:

- **Single-element component (Button):** the contract's top-level
  `wrapTextChildren: true` opts a single-element wrapper into rendering a
  `…__label` span around string/number children (element children — icons —
  pass through unwrapped). `text-box-trim`/`text-box-edge` then target
  `.primitiv-{name}__label`.
- **Structural subcomponent (ToggleGroup.Item):** set `wrapTextChildren: true`
  on that subcomponent's own entry in `contract.json`'s `subcomponents` array.
  The generator (`crates/primitiv-emit/src/wrapper.rs`) emits a
  `wrap{Sub}TextNodes` helper scoped to that one part, wrapping into a
  `{part-class}-label` span (e.g. `.primitiv-toggle-group__item-label`) — not
  `__label` again, to avoid a doubled BEM element on a class that's already
  `__item`.

Both shapes are driven entirely by `contract.json` + the generator — never
hand-add the wrapping span or the trim properties without going through
`wrapTextChildren`, or the committed `.tsx` drifts from what
`emit_wrapper(&contract)` produces and the drift-guard test in
`crates/primitiv-emit/src/wrapper_tests.rs` fails.

`text-box-trim`/`text-box-edge` are the one deliberate exception to "tokenize
every literal" above — there is no token family for them (like the motion
literals), so they stay hardcoded keyword values in `primitiv.base`.

**Known gap:** `registry/components/tabs/styles.css`'s `.primitiv-tabs__trigger`
still applies the trim directly to its flex container rather than a label span
— pre-dates this convention being written down. Fix it the same way as
ToggleGroup.Item if you're in that file for another reason; it isn't wired to
`wrapTextChildren` yet.

## Animated focus ring — transition `box-shadow`

The two-layer focus ring is a `box-shadow` swapped in on `:focus-visible`
(`0 0 0 offset surface, 0 0 0 offset+width ring`). **Every control that draws
this ring must also list `box-shadow` in the `transition` on the same element
that carries the ring**, so the ring interpolates in and out as focus moves
between siblings instead of snapping:

```css
transition: box-shadow var(--primitiv-motion-duration-control) var(--primitiv-motion-easing-default);
```

- Use `motion-duration-control` + `motion-easing-default` — the pair Button
  uses; the ring should feel identical system-wide.
- **Append** to the element's existing `transition` list rather than replacing
  it (most controls already transition `background-color` / `border-color` /
  `color`); if the element had no transition (a bare trigger), add one.
- The transition goes on the element the `:focus-visible` box-shadow targets —
  for the input family that's the control itself; for checkbox / radio / switch
  it's the `__control` reached via the sibling combinator (the ring's box-shadow
  lands on `__control`, so the transition does too).
- Controls with a **resting** box-shadow (Button's elevation, ToggleGroup's item
  shadow) already list `box-shadow` in their transition — nothing to add.

This is a system-wide standard, not per-component polish: a new framed control
ships with the ring transition from day one. The ring geometry/colour stay
system tokens (`--primitiv-focus-ring*` / `--primitiv-surface-default`), never a
per-component knob.

**Suppressing a nested control's ring in a composition.** When one component
wraps another and draws a *single* ring on the outer frame (InputGroup around
Input, via `:focus-within`), the inner control must surrender its own ring —
`box-shadow: none` on `.wrapper .inner:focus-visible`. **Put that override in
`@layer primitiv.states`, not `primitiv.base`.** The inner control's ring is a
`:focus-visible` rule that itself lives in `primitiv.states`; a suppression in a
lower layer (`base`) loses to it *no matter how specific the selector*, because
later layers always win — the classic symptom is a second ring hugging the inner
control on keyboard focus. Same layer + higher specificity is what actually hides
it (`.primitiv-input-group .primitiv-input:focus-visible` beat
`.primitiv-input:focus-visible` once both sit in `states`).

## Animating open/close — grid row + clipped padded body

To reveal/hide a panel at its natural height with no `max-height` guess and no
JS measurement (Accordion.Content; any future disclosure surface). It is **three
nested elements**:

- **Panel** — the force-mounted headless part. A single-row grid transitioning
  `grid-template-rows` between `0fr` (closed) and `1fr` (open). Force-mount is
  required so it stays in the DOM when closed and exposes `data-state` —
  otherwise `hidden` removes it and nothing can animate.
- **Clip** — one wrapper div with `overflow: hidden; min-height: 0`: the single
  grid item the row collapses, clipping the body as it shrinks. **No padding.**
- **Body** — a second wrapper *inside* the clip; the panel padding lives here.

- **The padding gotcha (the one that bites):** the grid row only collapses the
  item's *content* box, and an element's own `overflow` never clips its own
  padding. So `padding-block` on the collapsing item — or on the grid container —
  sits outside the row and **floors** how far it can shrink, leaving a strip that
  holds a closed item open. Moving `overflow` onto the container does *not* fix
  it; animating the padding to `0` closes fully but makes the copy visibly shift.
  Put the padding one level down, on the body *inside* the clip, so it is clipped
  away with the row: **constant, un-animated padding that still closes to zero.**
- Flip the clip to `visibility: hidden` when closed (transitioned, so it stays
  visible through the close then switches) so collapsed content leaves the tab
  order and the a11y tree.
- Guard the whole thing under `@media (prefers-reduced-motion: reduce)` with
  `transition: none`.
- Expose the timing as `--primitiv-<name>-*-transition-duration` / `-easing`
  knobs (defaulting to a `motion/*` token) and register them in `contract.json`.

`registry/components/accordion/styles.css` + `accordion.tsx` are the reference
implementation.

**On the horizon — `interpolate-size`.** The whole three-element dance exists
only because CSS can't yet animate to `height: auto`. Once `interpolate-size:
allow-keywords` (set on `:root`) has cross-browser support, a disclosure can
`transition: height` from `0` to `auto` directly — folding the grid + clip back
toward a single element (put the padding on an inner child, or `overflow: clip`
+ a padded body, so it still collapses cleanly). It generalises well past
disclosures too: **any** open/close or size-to-content transition (menus,
tooltips, toasts growing to fit) becomes a plain `height` / `width` transition.
It's Chromium-only as of this writing, so the grid-row technique stays the
portable default — but when Baseline covers `interpolate-size`, this is the
simplification to reach for across the library.

## When you touch a stylesheet

- Keep the **CSS and SCSS bodies byte-identical** (the `.scss` is the `.css` plus
  the trailing `$primitiv-*` alias block).
- Update the file header's *"Requires the token layer for …"* list when you
  reference a **new token family**.
- If the value is an API token's default (a `--primitiv-<component>-*` knob),
  mirror the change into `contract.json`'s `defaultsTo`.
- Adding a new clickable/tappable rule (anything with `cursor: pointer` or a
  clickable `cursor: default`)? Pair it with
  `-webkit-tap-highlight-color: transparent;` — see above.
- Adding a new `:hover` rule? Wrap it in `@media (hover: hover)` — see above.
- Animating a grid-collapse row to a fixed clamp height (a read-more /
  collapsedHeight-style preview)? Don't mix a length with `1fr` on
  `grid-template-rows` — clamp on the clip's `max-block-size` instead. See
  above.

## Horizontally-scrolling code (`code-block`)

Any block that scrolls sideways (the `<pre>` scroll surface) **must** pin
`text-size-adjust`, or iOS Safari inflates the text in portrait — rescaling
wrapped/indented lines a step so they look mis-sized (a real bug caught on
device, invisible in landscape and on desktop):

```css
.primitiv-code-block__pre {
  overflow-x: auto;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%; /* CSS mechanics — no token home, like the skew angle */
}
```

## Syntax highlighting is a code-only theme

`code-block` colours Prism's token classes (`.token.keyword`, `.token.string`,
…) from seven **registry-only** `--primitiv-code-syntax-*` roles — there is no
Figma variable for them (highlighting can't be expressed in Figma). Define them
on `.primitiv-code-block` (light) with a `[data-theme="dark"] .primitiv-code-block`
override, so the theme re-colours through the cascade when the mode flips. The
`oklch(…)` literals here are the token *definitions* (their source of truth), so
they are exempt from "tokenize every literal" — but everything else in the sheet
still resolves from `var(--primitiv-…)`. The wrapper hands Prism an **empty
theme** so only the class names land and our CSS wins (never Prism's inline
styles, which wouldn't switch with the mode — the reason Prism was chosen over
Shiki).

# Design in Figma — copy and illustration briefs

> **Status:** Draft for review, 2026-09-02. Written to
> [`voice-and-tone.md`](./voice-and-tone.md); page defined in
> [`docs-site-content-plan.md`](./docs-site-content-plan.md) §3.8.
> **Brief schema:** defined once in
> [`docs-site-home-copy.md`](./docs-site-home-copy.md).
> **Route:** `/figma` — absorbs the dead `/#harmoni` anchor's design half.
> The Harmoni product page (`/figma/harmoni`) is a separate page, still
> to be written.

---

## What this page is for

**Argument:** the Figma library is not a drawing of the components. Both
are built from the same tokens, so they cannot quietly disagree. Here is
what is in it, and here is what it cannot promise.

**Primary reader: a designer.** This is the one page on the site written
for someone who may never open a terminal. No install commands, no JSX,
no prop tables. The register stays plain but the vocabulary is Figma's —
variants, variables, component sets, auto layout.

---

# Section 1 — What it is

**Heading** — `heading/h1`: `Design in Figma`

**Lede** — `body/lg`:

> The Figma library holds the same components as the code, built from the
> same tokens. What you draw is what gets built.

**Body** — `body/md`:

> That is a stronger claim than most design systems can make, so it is
> worth saying what it rests on. The colours, spacing, type sizes and
> corner radii in the file are not values someone typed in. They are
> Figma variables generated from the same source as the CSS. When a token
> changes, both sides move together.

---

# Section 2 — What is in the library

**Heading** — `heading/h2`: `What is in the library`

**Body** — `body/md`:

> Component sets covering the same ground as the code: framed controls
> like Button, Input and Select; content components like Table,
> Blockquote and List; and full compositions like Card, Navigation Menu
> and Confirm Dialog.

**Second block:**

> Every set carries the axes you would expect. Size runs `xs` to `xl`.
> Variants cover the states a component genuinely has, and interaction
> states are drawn rather than implied. Layout primitives are there too,
> so a page can be built from real components rather than anonymous
> frames.

**Third block:**

> The variables come in modes. Colour has Light and Dark. Sizing has the
> four density modes, so you can switch a frame from Comfortable to Dense
> and watch it reproportion, exactly as the code does.

```yaml
id: FIGMA-P01
type: screenshot
placement: >
  Directly beneath the three blocks, full content width.

rhetorical-job: >
  Show a designer what they are actually getting, in their own
  environment. A list of component names does not convey scale or
  quality. A real screenshot of a real page of the file does both in a
  second, and proves the library exists rather than being promised.

composition:
  - A genuine Figma canvas screenshot showing one component set laid out
    as its full variant grid, with row and column labels visible.
  - Enough Figma chrome to be recognisably Figma - the layers panel on
    the left, the properties panel on the right - but cropped so the grid
    dominates.
  - The properties panel should be showing the set's variant axes, since
    that is what a designer is really asking about.
  - Choose a set with a rich but legible grid. Button is the right
    choice: five variants by five sizes reads clearly and everyone knows
    what a button should look like.

contents:
  - "The Button component set, arranged as its documented size x variant
    grid, with the generated row and column labels visible."
  - "Left panel - the layer tree, showing the set and a few variants
    named in the real convention."
  - "Right panel - the variant properties, showing the Variant and Size
    axes with their values."
  - "No selection marquee, no cursor, no comment pins, no other user's
    avatar."

assets:
  - A genuine screenshot of the Primitiv Figma file. Never a recreation,
    and never a mock-up of Figma's interface - the audience for this page
    would spot it instantly.

tokens:
  frame: border/subtle at 1px, radius from card/md/radius
  caption: body/sm, content/muted

frame:
  ratio: "16:10"
  width: full content width
  below-48rem: >
    Crop tighter to the grid alone and drop both panels. The panels are
    illegible below this width and the grid is the substance.

themes:
  light: light Figma canvas
  dark: dark Figma canvas

alt: >
  The Button component set open in Figma, laid out as a grid of every
  variant at every size, with the variant properties visible in the
  right-hand panel.

must-not:
  - Recreate or approximate the Figma interface.
  - Show a canvas with unresolved layers, red error badges, or anything
    mid-edit.
  - Pick a component set whose grid is too dense to read at this size.

craft-notes:
  - The generated row and column labels are worth keeping in frame. They
    signal that the file is maintained by tooling rather than by hand,
    which is the substance of the parity claim.
```

---

# Section 3 — How it stays in step

**Heading** — `heading/h2`: `How it stays in step`

**Body** — `body/md`:

> The token values are the shared source. They live in one place, emit to
> CSS for the code, and sync to Figma variables for the file. Neither
> side is copied from the other by hand.

**Second block:**

> That is what keeps a colour honest. A designer picking
> `action/primary/default` in Figma and a developer writing
> `--primitiv-action-primary-default` in CSS are naming the same value,
> not two values that were once the same.

```yaml
id: FIGMA-P02
type: diagram
placement: >
  Beside the two blocks, right-hand half of a two-column layout.

rhetorical-job: >
  Show that neither side is downstream of the other. Designers are used
  to design systems where the file is the source and code lags, or where
  code is the source and the file rots. This is a third arrangement and
  it needs drawing to be believed.

composition:
  - One source at the top, two outputs beneath it, forming a shallow Y.
  - The source is a single block: the token definitions.
  - Two arms descend to Figma variables on one side and CSS custom
    properties on the other.
  - Both arms are identical in weight and length. Any asymmetry implies
    one side is primary, which is the misreading this diagram exists to
    prevent.
  - Beneath each output, a small example of what it looks like there.

contents:
  - "Top block - 'Token definitions' with a sub-line 'one source, in the
    repository'."
  - "Left arm, down to - 'Figma variables', with an example beneath:
    action/primary/default shown as a Figma variable chip."
  - "Right arm, down to - 'CSS custom properties', with an example
    beneath: --primitiv-action-primary-default shown as a line of CSS."
  - "One sentence beneath: 'Same name. Same value. Two places it can be
    used.'"

assets:
  - Real token names on both sides.
  - Pure diagram otherwise.

tokens:
  source-block: action/primary/soft with content/primary label
  output-blocks: surface/raised with border/default
  arms: border/default at 1px
  examples: the mono face at font-size/12, content/secondary
  closing-line: body/sm, content/muted

frame:
  ratio: "4:3"
  width: half the content width
  below-48rem: full width beneath the prose

themes:
  light: as described
  dark: same, dark values

alt: >
  A diagram showing one set of token definitions feeding both Figma
  variables and CSS custom properties, with the same token name appearing
  on each side.

must-not:
  - Draw an arrow between Figma and CSS. They do not talk to each other,
    and an arrow between them is the exact misunderstanding to avoid.
  - Make one arm longer, thicker or more prominent.
  - Add the Harmoni engine to this diagram. It generates colour values
    upstream of all this, and including it makes a simple picture busy.

craft-notes:
  - Showing the SAME token name rendered in both a Figma chip and a line
    of CSS is the detail that makes this concrete. Two abstract boxes
    prove nothing; two representations of one name prove everything.
```

---

# Section 4 — Two things the file cannot match

**Heading** — `heading/h2`: `Two things the file cannot match`

**Body** — `body/md`:

> Two components genuinely differ between Figma and the browser, and it
> is better to know now than to find out during handoff.

> **Grid is an approximation.** Figma cannot apply CSS grid layout inside
> a component slot, so the Grid component is built with wrapping instead.
> It looks right in most layouts and it will not behave identically to
> the real thing in every case.

> **Aspect Ratio is fixed, not fluid.** In the browser the component
> holds a ratio at any width. In Figma it holds specific pixel
> dimensions.

**Second block:**

> Everything else matches. Both limits are Figma's rather than choices,
> and both are recorded in the components' own descriptions in the file,
> so a designer who never reads this page still finds out.

---

# Section 5 — Working with a developer

**Heading** — `heading/h2`: `Working with a developer`

**Body** — `body/md`:

> Handoff is lighter than usual here, because most of what you would
> normally write down is already shared.

> **Name components as they are named.** If you used Select, say Select.
> The developer has a component with that name and the same variants.
> **Say the token, not the value.** "Surface, subtle" survives a theme
> change and a dark mode. `#f4f4f5` does not.
> **Say which density.** It is a real setting on their side, and it
> changes every measurement you might otherwise be asked for.
> **Do not redline spacing.** The spacing is a token. Naming it is
> enough, and measuring it invites a number that will drift.

---

# Section 6 — Where the colour comes from

**Heading** — `heading/h2`: `Where the colour comes from`

**Body** — `body/md`:

> The palette in the file is generated rather than picked. A colour
> engine called Harmoni builds each scale from one seed colour, choosing
> the text colour that pairs with every step and checking contrast as it
> goes.

> Harmoni is also a Figma plugin, for teams who want to generate their
> own palettes this way. You do not need it to use the library — the
> palette it produced is already in the file.

**Link:** `Harmoni →` → the Harmoni page

> **Note for the writer:** this section is a pointer, not the Harmoni
> page. Keep it to two paragraphs. The product page is written
> separately, and its scope is still to be agreed.

---

## Notes for review

1. **Two illustrations, and one of them must be a genuine screenshot.**
   The audience for this page uses Figma daily and would detect a
   recreated interface immediately, which would undermine the parity
   claim the page is making.
2. **Section 4 volunteers the limitations.** A designer who discovers the
   Grid approximation on their own trusts everything else less. Stating
   it costs one short section and buys the rest of the page.
3. **Section 5 is the most immediately useful thing here** and has no
   equivalent anywhere else on the site. It is also the section most
   likely to be shared with a colleague, so it should read well out of
   context.
4. **No install commands, no JSX, no prop tables on this page.** A
   designer who wants those has the rest of the site. Mixing them in is
   what makes design-system docs feel written for someone else.
5. **The Figma node ids and file link are not in this draft.** They need
   filling in from the real file before publishing, along with whether
   the library is publicly accessible or request-only — which is a
   decision, not a lookup.

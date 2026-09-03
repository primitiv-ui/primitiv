# Concepts — copy and illustration briefs

> **Status:** Draft for review, 2026-09-02. Written to
> [`voice-and-tone.md`](./voice-and-tone.md); pages defined in
> [`docs-site-content-plan.md`](./docs-site-content-plan.md) §3.2–§3.6.
> **Brief schema:** defined once in
> [`docs-site-home-copy.md`](./docs-site-home-copy.md).
>
> **Five pages, one file**, because they cross-reference each other
> constantly and share a register. Routes:
> `/concepts/what-primitiv-is` · `/concepts/tokens` ·
> `/concepts/density` · `/concepts/composition` ·
> `/concepts/accessibility`

---

## The register these five pages share

Explanatory and patient. Longer paragraphs than the home page. Analogies
are welcome here and nowhere else on the site. The test from
`voice-and-tone.md` §4: **could someone learn this here, not having
known it?**

These are also the pages where jargon gets **introduced**. After a term
is defined on its concept page, component pages may assume it. Terms
introduced here: token, density, headless, registry, compound component,
controlled and uncontrolled.

---
---

# Page 1 — What Primitiv is

**Route:** `/concepts/what-primitiv-is`
**Argument:** four things share one name. Here is how they fit together.

## Section 1 — The short version

**Heading** — `heading/h1`: `What Primitiv is`

**Lede** — `body/lg`:

> Primitiv is four things that share one name, built on one set of design
> tokens. Most people only ever need two of them.

## Section 2 — The four parts

**Heading** — `heading/h2`: `The four parts`

Four blocks, `heading/h4` plus `body/md`:

> **Primitiv — the design system.**
> The components themselves, and the tokens underneath them. When someone
> says "we use Primitiv", this is what they mean.

> **Harmoni — the colour engine.**
> It generates the palette. Give it one colour and it builds a full scale
> around it, choosing the text colour for each step and checking the
> contrast as it goes. It is also a Figma plugin you can buy separately,
> but you do not need it: Primitiv ships the palette it produced.

> **The registry and the CLI — how you get the code.**
> `primitiv add button` copies a component into your project. Not a
> dependency, a file. The registry is the catalogue it copies from.

> **The Figma library — the same components, to design with.**
> Built from the same tokens as the code, so a mockup and a build cannot
> quietly disagree about a colour or a spacing value.

```yaml
id: FAMILY-01
type: diagram
placement: >
  Directly beneath the four blocks, full content width. It is the reason
  this page exists - the relationship is genuinely confusing in prose and
  obvious in a picture.

rhetorical-job: >
  Show that the four parts are not four products. One token layer sits
  underneath everything, Harmoni feeds it, and the three consumption
  surfaces sit on top. A reader who leaves this page still thinking
  "which one do I buy?" has not been served.

composition:
  - Four horizontal tiers, read top to bottom, each the full width.
  - Tier 1 (top) - the three surfaces a person actually uses, side by
    side as three blocks.
  - Tier 2 - one wide band: the design tokens. It spans the full width,
    directly under all three, so the shared foundation is visually
    literal.
  - Tier 3 - Harmoni, drawn to the SIDE feeding into the token band with
    a single connector, not underneath it. It is an input, not a layer.
  - Tier 4 - a short caption strip naming what is open source and what is
    paid.
  - The token band is the visual anchor and should be the most confident
    element in the diagram.

contents:
  - "Tier 1, three blocks - '@primitiv-ui/react (headless)', 'The
    registry (styled, copied to you)', 'The Figma library'."
  - "Under each block, one line of what it gives you: 'behaviour and
    accessibility', 'behaviour, accessibility and the design', 'the
    design, to work with'."
  - "Tier 2, one band spanning all three - 'Design tokens: colour,
    spacing, type, density'."
  - "Tier 3, to the left and slightly below, connected into the band -
    'Harmoni' with the sub-line 'generates the colour'."
  - "Tier 4 caption - 'Open source (MIT): the components, the tokens, the
    CLI, the colour engine. Paid: the Harmoni Figma plugin.'"

assets:
  - Pure diagram. Type and spacing from the system.

tokens:
  token-band: action/primary/soft with content/primary label
  surface-blocks: surface/raised with border/default
  harmoni-block: surface/subtle with border/default, sitting apart
  connector: border/default at 1px
  block-labels: label/md
  sub-lines: body/sm, content/muted
  caption-strip: body/sm, content/muted
  tier-gap: space/space-24

frame:
  ratio: "3:2"
  width: full content width
  below-48rem: >
    Stack the three surface blocks vertically. The token band becomes a
    left-hand spine running beside all three, which preserves the "one
    shared foundation" reading.

themes:
  light: neutral surfaces, brand only on the token band
  dark: same structure, dark values

alt: >
  A diagram of the four parts of Primitiv. The headless package, the
  styled registry and the Figma library all sit on one shared band of
  design tokens, which Harmoni generates the colour for.

must-not:
  - Draw Harmoni as a layer in the stack. It is an input that runs before
    everything else, and drawing it underneath implies a runtime
    dependency that does not exist.
  - Give the three surfaces different visual weight.
  - Add the CLI as a fifth box. It is how the registry reaches you, not a
    separate thing, and a fifth box is what makes this diagram confusing.

craft-notes:
  - The token band spanning the full width under all three surfaces is
    the whole diagram. If a reader takes only one thing away, it should
    be that the same foundation is under every path.
  - The open-source-versus-paid caption is worth its space. It is the
    question a team lead will have, and answering it plainly here saves
    a support conversation later.
```

## Section 3 — What you actually need

**Heading** — `heading/h2`: `What you actually need`

**Body** — `body/md`:

> Most teams use two parts: the Figma library to design with, and the
> registry to build with. Everything else is optional.

> You do not need Harmoni to use Primitiv. The palette it generated
> already ships with the system. You would only want the plugin if you
> intend to generate your own palettes from your own brand colour.

**Links:** `Tokens and theming →` · `The registry and CLI →` ·
`Design in Figma →`

---
---

# Page 2 — Tokens and theming

**Route:** `/concepts/tokens`
**Argument:** change one value, and the right things change everywhere.

## Section 1 — What a token is

**Heading** — `heading/h1`: `Tokens and theming`

**Lede** — `body/lg`:

> A token is a named design decision. Instead of writing a colour into
> forty stylesheets, you name it once and point at the name.

**Body** — `body/md`:

> That sounds like a variable, and technically it is one. What makes
> tokens worth a page of their own is how they are layered. Primitiv has
> three tiers, and each one only ever points at the tier below it.

## Section 2 — The three tiers

**Heading** — `heading/h2`: `The three tiers`

Three blocks, `heading/h4` plus `body/md`:

> **Palette — the raw colours.**
> Six scales of ten steps: neutral, brand, success, warning, danger and
> info. This is the only tier that holds an actual colour value. Harmoni
> generates it.

> **Intent — what a colour is for.**
> `surface/default` is the page background. `content/primary` is body
> text. `border/subtle` is a hairline. None of them holds a value. Each
> points at a Palette step. Light and dark are two modes of this tier,
> which is why switching theme is a mode swap rather than a second
> stylesheet.

> **Context — how big things are.**
> Control heights, padding, gaps, corner radius, type size. This tier has
> four modes, one per density setting. That is the whole density system.

```yaml
id: TOKENS-01
type: diagram
placement: >
  Directly beneath the three tier blocks, full content width. This is the
  page's central diagram.

rhetorical-job: >
  Make the pointing visible. The rule that only the bottom tier holds a
  value is what makes theming cheap, and it is impossible to hold in your
  head from prose alone. One traced path from a raw colour to a rendered
  button teaches it in a second.

composition:
  - Three stacked tiers, bottom to top - Palette at the bottom, Intent in
    the middle, Context alongside, and the rendered component at the top.
  - ONE path is traced through the whole stack in a highlighted state,
    while the rest of the tiers are present but quiet. A diagram that
    highlights everything highlights nothing.
  - The traced path reads upward, which matches "points at the tier
    below".

contents:
  - "Bottom tier, Palette - a row of swatches with brand/500 called out
    and its hex shown."
  - "Middle tier, Intent - a row of role names, with
    action/primary/default highlighted and a connector down to
    brand/500."
  - "A second connector from content/on-action down to its own palette
    step, so the reader sees the button needs two roles, not one."
  - "Top - a rendered primary Button, with two thin leaders pointing at
    its background and its label text, each meeting the role it came
    from."
  - "To the right of the stack, Context shown separately as a short list
    - framed-control/md/height, framed-control/md/padding-inline - with
    a leader to the button's geometry rather than its colour."
  - "One line beneath: 'Only the bottom tier holds a value. Everything
    above it points.'"

assets:
  - Real token names, real palette values, a real rendered Button.
  - Every name shown must exist in
    packages/tokens/src/{palette,intent,context}.json.

tokens:
  tier-labels: overline, content/muted
  token-names: the mono face at font-size/12
  highlighted-path: border/focus for connectors, content/primary for names
  quiet-rows: content/muted
  closing-line: body/sm, content/muted
  tier-gap: space/space-40

frame:
  ratio: "4:3"
  width: full content width
  below-48rem: >
    Keep the vertical stack; drop the Context column to its own row
    beneath rather than beside.

themes:
  light: as described
  dark: same structure, and the traced path resolves to DIFFERENT palette
        values, which is itself worth seeing

alt: >
  A diagram of the three token tiers. A primary button's background is
  traced up from a raw palette colour, through the intent role that
  points at it, to the rendered component. Only the palette tier holds a
  value.

must-not:
  - Highlight more than one path. The second path is what turns a clear
    diagram into a wiring schematic.
  - Invent token names. Every one is checkable.
  - Draw Context as a fourth tier in the vertical stack. It answers a
    different question (how big) and stacking it implies it points at
    Intent, which it does not.

craft-notes:
  - Showing BOTH the background and the label-text roles is the detail
    that teaches the most. It makes "a component is a set of roles"
    concrete, and it quietly explains why foreground pairing matters.
  - The dark-mode version resolving to different palette values is worth
    building deliberately rather than recolouring. It is the clearest
    possible demonstration of why the middle tier exists.
```

## Section 3 — Why the layering matters

**Heading** — `heading/h2`: `Why the layering matters`

**Body** — `body/md`:

> Because only the bottom tier holds a value, a rebrand is a change to
> one tier. Every role above it keeps pointing where it pointed, and the
> new colour arrives everywhere at once.

> The same rule gives you dark mode. `surface/default` means "the page
> background" in both themes and resolves to a different palette step in
> each, so a theme is a set of values rather than a set of overrides.

## Section 4 — Changing your tokens

**Heading** — `heading/h2`: `Changing your tokens`

**Body** — `body/md`:

> To change the brand colour, regenerate the theme:

```
npx primitiv theme --brand "#0a7755"
```

> That produces a full light and dark palette from your colour, with
> every semantic role reassigned by contrast. It writes into its own
> layer, so it beats the base tokens without you editing them.

> To change something the generator does not own, such as a spacing value
> or a font, override the custom property in your own stylesheet. Token
> names are the contract, and they do not change under you.

**Second block:**

> Tokens emit in three formats. Set it once in `primitiv.json`:

> **CSS** — custom properties. The default, and what the rest of the docs
> assume.
> **SCSS** — the same values as SCSS variables.
> **Tailwind** — a theme extension.

## Section 5 — What is in the token layer

**Heading** — `heading/h2`: `What is in the token layer`

**Body** — `body/md`:

> Colour is the tier most people meet first, but it is not the only one.
> The system also tokenises spacing, type, corner radius, shadows,
> motion, breakpoints and interaction states. All of it emits together.

**Links:** `Density and the Context tier →` · `Design in Figma →`

---
---

# Page 3 — Density

**Route:** `/concepts/density`
**Argument:** proportion is a feature, not a preference.

> **This page absorbs a piece of boilerplate.** *"Sized xs–xl;
> `data-density` scales each size further"* currently appears verbatim on
> **12 of 63** component descriptions. It is deleted from all twelve and
> explained here once. `voice-and-tone.md` rule 6.

## Section 1 — What density is

**Heading** — `heading/h1`: `Density`

**Lede** — `body/lg`:

> Density is how tightly the interface is packed. Primitiv has four
> settings, and changing one attribute reflows everything beneath it.

**Body** — `body/md`:

> Most component libraries are tuned for one kind of product. Use them
> for something denser and everything feels bloated. Use them for
> something roomier and it feels cramped. Four settings is a statement
> that proportional control is a feature rather than an afterthought.

## Section 2 — The four modes

**Heading** — `heading/h2`: `The four modes`

**Body** — `body/md`:

> **Dense** for data-heavy screens where fitting more on screen is the
> point: admin tables, trading screens, dashboards.
> **Compact** for productive application UI.
> **Comfortable** is the default, and suits most product interfaces.
> **Spacious** for marketing pages and editorial content, where room to
> breathe is the point.

```yaml
id: DENSITY-C01
type: screenshot
placement: >
  Directly beneath the four descriptions, full content width.

rhetorical-job: >
  Let a reader choose. The home page demo proved the mechanism; this page
  has to help someone decide which mode their product wants, which means
  showing all four at once rather than one at a time.

composition:
  - Four columns side by side, one per mode, same width.
  - Each column shows the SAME small composition, so the only variable is
    density.
  - Mode name above each column; its numeric proof beneath.
  - Aligned to a shared top edge, so the vertical growth across the four
    is directly comparable.

contents:
  - "Each column contains - one Input with a label, one primary Button,
    and a three-row table fragment. Small enough to read at quarter
    width, real enough to judge."
  - "Above each column - the mode name in overline."
  - "Beneath each column - two figures: the md control height and the
    resulting corner radius, real values from the token layer."
  - "One line beneath all four: 'Same components. Same markup. One
    attribute.'"

assets:
  - Registry components - input, field, button, table - rendered under
    each of the four real Context modes.

tokens:
  mode-labels: overline, content/secondary
  figures: the mono face at font-size/12, content/muted
  column-separators: border/subtle
  closing-line: body/sm, content/muted
  column-gap: space/space-24

frame:
  ratio: "16:9"
  width: full content width
  below-48rem: two columns of two, keeping Dense next to Compact and
                Comfortable next to Spacious so neighbours stay comparable
  below-36rem: >
    A horizontally scrolling row of four. Do not stack to one column -
    the whole value is the side-by-side comparison.

themes:
  light: as described
  dark: same, dark values

alt: >
  The same input, button and table shown at all four density settings -
  Dense, Compact, Comfortable and Spacious - with the control height and
  corner radius for each.

must-not:
  - Vary anything except density between columns. Same content, same
    words, same component sizes.
  - Stack to a single column at any breakpoint.
  - Use lorem ipsum. Real labels make the density judgeable.

craft-notes:
  - The numeric proof beneath each column is what makes this a reference
    rather than a picture. Someone deciding which mode to use wants the
    actual control height.
  - Keep the table fragment in every column even when space is tight. A
    table is where density is most visible and most consequential.
```

## Section 3 — How to set it

**Heading** — `heading/h2`: `How to set it`

**Body** — `body/md`:

> Density is one attribute, and it is inherited. Set it high up for the
> whole application:

```html
<body data-density="comfortable">
```

> Or set it on any part of a page that needs to be different:

```html
<div data-density="dense">
  <!-- a packed table inside an otherwise roomy page -->
</div>
```

> Anything inside picks it up. That is the whole API.

```yaml
id: DENSITY-C02
type: diagram
placement: >
  Beside the two code blocks, right-hand half of a two-column layout.

rhetorical-job: >
  Show that density is scoped by containment, not set globally. This is
  the single most useful thing on the page and the easiest to miss, since
  the code makes it look like a page-level setting.

composition:
  - A simplified page wireframe, drawn as nested boxes.
  - The outer box labelled with its density; one inner box labelled with
    a different one.
  - A subtle tint distinguishes the two regions, so the scope boundary
    is visible.
  - Deliberately abstract. Boxes, not components - this is about
    containment, and rendering real components would invite the reader
    to read the components instead of the nesting.

contents:
  - "Outer box - labelled data-density=\"spacious\", containing a page
    heading bar, two paragraph bars and the inner box."
  - "Inner box - labelled data-density=\"dense\", containing a table
    drawn as tight rows."
  - "The visual contrast between the loose outer bars and the tight inner
    rows is the entire point, so exaggerate the difference slightly more
    than the real tokens would."
  - "One line beneath: 'The nearest setting wins.'"

assets:
  - Abstract wireframe shapes, not components.

tokens:
  outer-region: surface/default with border/default
  inner-region: surface/subtle with border/default
  labels: the mono face at font-size/11, content/muted
  bars: content/disabled
  closing-line: body/sm, content/muted

frame:
  ratio: "4:3"
  width: half the content width
  below-48rem: full width beneath the code blocks

themes:
  light: as described
  dark: same, dark values

alt: >
  A page set to spacious density containing a region set to dense. The
  nearest setting wins, so the inner table is tightly packed inside an
  otherwise roomy page.

must-not:
  - Render real components. Abstract bars keep the attention on nesting.
  - Show more than two levels. Two proves inheritance; three is showing off.

craft-notes:
  - Exaggerating the contrast slightly beyond the real token difference
    is the right call here. It is a diagram of a concept, not a specimen
    sheet, and the concept is what has to land.
```

## Section 4 — Why radius follows

**Heading** — `heading/h2`: `Why radius follows`

**Body** — `body/md`:

> Corner radius is not a value assigned per size. It is a fraction of the
> control's height, so when density changes the height, the radius
> follows on its own:

```
radius = height × 0.1875
```

> That fraction is fixed across the whole system. It is why controls stay
> in proportion at every density without a fourth table of values for
> someone to keep in step.

## Section 5 — What density does not change

**Heading** — `heading/h2`: `What density does not change`

**Body** — `body/md`:

> Density changes proportion, not identity. Colours do not move. Font
> families do not change. Component behaviour is untouched, so a keyboard
> shortcut works the same at every setting.

> It is also separate from a component's own `size` prop. Size picks
> which slot on the scale a component uses. Density scales the whole
> scale. A medium button in Dense is smaller than a medium button in
> Spacious, and both are still medium.

**Links:** `Tokens and theming →` · `Browse components →`

---
---

# Page 4 — Composition

**Route:** `/concepts/composition`
**Argument:** a few patterns repeat across every component, so learn them
once.

## Section 1 — Why this page exists

**Heading** — `heading/h1`: `Composition`

**Lede** — `body/lg`:

> Four patterns turn up in nearly every Primitiv component. Learning them
> once means every component page afterwards reads faster.

## Section 2 — Rendering as something else

**Heading** — `heading/h2`: `Rendering as something else`

**Body** — `body/md`:

> Sometimes you want a button that is really a link. Not a link that
> looks like a button, an actual `<a>` that carries the button's styling
> and behaviour. Every component takes `asChild` for this:

```tsx
<Button asChild>
  <Link href="/pricing">See pricing</Link>
</Button>
```

> The Button renders nothing of its own. It hands its props, classes and
> behaviour to the child you gave it, and that child is what appears in
> the page.

**Second block:**

> This matters more than it looks. It is what lets Primitiv work with
> your router, your analytics wrapper, or any component you already have,
> without the library needing to know they exist.

```yaml
id: COMPOSE-01
type: diagram
placement: >
  Beside the asChild explanation, right-hand half of a two-column layout.

rhetorical-job: >
  Show what asChild actually does to the DOM. Readers coming from other
  libraries expect an `as` prop that swaps a tag name, and asChild is a
  different mechanism. Showing the rendered output removes the confusion
  in one look.

composition:
  - Two rows, one above the other. Upper - without asChild. Lower - with.
  - Each row shows the JSX on the left and the resulting DOM on the right,
    with a thin connector between them.
  - The lower row's DOM is visibly SHORTER, which is the point: one
    element, not two.

contents:
  - "Upper row, JSX: <Button><Link href=\"/x\">Go</Link></Button>"
  - "Upper row, DOM: a <button> element containing an <a> element. Two
    nested boxes, with a small warning-toned note: 'a link inside a
    button'."
  - "Lower row, JSX: <Button asChild><Link href=\"/x\">Go</Link></Button>"
  - "Lower row, DOM: a single <a> element carrying the button's class.
    One box."
  - "One line beneath: 'asChild merges them. It does not nest them.'"

assets:
  - Code set in the site's code-block styling.
  - DOM shown as labelled nested boxes, not as more code - the contrast
    between two boxes and one is the argument, and a second code block
    would bury it.

tokens:
  dom-boxes: surface/subtle with border/default
  warning-note: feedback/warning/soft/foreground
  row-labels: label/sm, content/secondary
  closing-line: body/sm, content/muted

frame:
  ratio: "4:3"
  width: half the content width
  below-48rem: full width beneath the prose

themes:
  light: as described
  dark: same, dark values

alt: >
  Without asChild, a Button wrapping a Link renders a button containing a
  link. With asChild, the same JSX renders a single link element carrying
  the button's styling.

must-not:
  - Show the DOM as code. Boxes make the nesting difference visible;
    code makes the reader parse it.
  - Label the upper row as an error. It is valid JSX that produces
    invalid HTML, which is a subtler and more useful thing to show.

craft-notes:
  - The size difference between the two DOM columns is doing the
    teaching. Make the upper one visibly taller.
```

## Section 3 — Who holds the value

**Heading** — `heading/h2`: `Who holds the value`

**Body** — `body/md`:

> Any component with a value can work two ways, and you pick per
> instance.

> **Let the component hold it.** Pass `defaultValue` and forget about it.
> The component tracks its own state and tells you when it changes.

```tsx
<Tabs defaultValue="account" />
```

> **Hold it yourself.** Pass `value` and `onValueChange`, and the
> component renders whatever you give it.

```tsx
<Tabs value={tab} onValueChange={setTab} />
```

> Use the first unless you need the second. You need the second when
> something outside the component has to change the value, or when the
> value belongs in a URL or a form you already manage.

**Callout** — an `Alert` at `info` tone:

> Pass one or the other, not both. `defaultValue` is the starting value
> for a component managing itself. `value` is a value you are managing.
> Supplying both is contradictory, and the props tables cannot show that
> constraint because it flattens into a plain list.

## Section 4 — Components made of parts

**Heading** — `heading/h2`: `Components made of parts`

**Body** — `body/md`:

> Simple components are one element. Anything with structure is several,
> and you assemble them:

```tsx
<Tabs.Root defaultValue="account">
  <Tabs.List>
    <Tabs.Trigger value="account">Account</Tabs.Trigger>
    <Tabs.Trigger value="billing">Billing</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="account">...</Tabs.Content>
</Tabs.Root>
```

> That is more typing than a single component taking an array of tabs,
> and it is deliberate. You can put anything between the parts, style
> each one, and reorder them, without the library having anticipated it.

**Second block:**

> The parts share state through React context, so `Tabs.Trigger` knows
> which tab is open without you passing anything down.

**Third block:**

> Part names differ slightly between the two paths, and the docs follow
> whichever you are reading. Headless gives you one export with parts
> hanging off it (`Tabs.Trigger`). The copied styled file gives you flat
> exports (`TabsTrigger`).

## Section 5 — Styling against state

**Heading** — `heading/h2`: `Styling against state`

**Body** — `body/md`:

> Components describe their own state in the DOM, as data attributes.
> An open panel carries `data-state="open"`. A disabled control carries
> `data-disabled`. You style against those:

```css
.my-trigger[data-state="open"] .chevron {
  transform: rotate(180deg);
}
```

> This is why the styled layer needs no JavaScript to know what to look
> like, and why you can restyle any component without touching its
> behaviour. Every component page lists the attributes it publishes.

**Links:** `Browse components →` · `Accessibility →`

---
---

# Page 5 — Accessibility

**Route:** `/concepts/accessibility`
**Argument:** here is what we guarantee, here is what stays yours, and
here is how to check.

> ⚠️ **Do not publish this page before the deferred accessibility pass
> has run.** The session handoff records it as deferred until after the
> first build. Every commitment below is believed true and none has been
> audited end to end. Verify each, then publish. An accessibility page
> that overclaims is worse than no page.

## Section 1 — The position

**Heading** — `heading/h1`: `Accessibility`

**Lede** — `body/lg`:

> Accessibility is not a pass someone does at the end here. It is a
> property of the components, checked continuously.

**Body** — `body/md`:

> That claim is worth being precise about, because "accessible" is
> claimed by nearly every component library and means different things.
> Here is what we guarantee, and what remains yours.

## Section 2 — What we guarantee

**Heading** — `heading/h2`: `What we guarantee`

Four blocks, `heading/h4` plus `body/md`:

> **Every interactive component follows its WAI-ARIA pattern.**
> Not an approximation. Tabs behave like the tabs pattern, a tree like
> the tree view, a combobox like a combobox. Roles, states and properties
> are set for you.

> **Keyboard support is built in.**
> Arrow keys, Home and End, Escape, type-ahead, and correct focus
> movement when things open and close. It is part of the component, not
> something you add.

> **Contrast is guaranteed by the engine that generates the colour.**
> Every step of every generated scale has a text colour that clears its
> minimum, and the semantic roles are derived by contrast rather than
> chosen by eye.

> **Focus is always visible.**
> On every control, in both themes.

## Section 3 — What stays yours

**Heading** — `heading/h2`: `What stays yours`

**Body** — `body/md`:

> A component library cannot make a product accessible on its own. These
> are yours, and no library can do them for you:

> **Labels.** We cannot know what your field is called. An input with no
> label is inaccessible however good the input is.
> **Reading order and headings.** The structure of your page, and picking
> heading levels that nest properly.
> **Alternative text.** For your images and icons.
> **Colour choice.** The generated palette holds its contrast, but you
> can still put text on a background it was never paired with.
> **Content.** Plain language, sensible link text, error messages that
> say what to do.

```yaml
id: A11Y-C01
type: diagram
placement: >
  Between the two lists, full content width, acting as the hinge between
  "ours" and "yours".

rhetorical-job: >
  Draw the line honestly. Most accessibility pages imply the library
  handles it. Being explicit about the boundary builds more trust than
  claiming more would, and it tells a team where to spend their own
  effort.

composition:
  - A single horizontal band divided into two regions by one clear
    vertical line.
  - Left region - what the component owns. Right - what the product owns.
  - Both regions equally weighted. Neither is the lesser half, and making
    the left one dominant would undo the point.
  - Items listed as short labels, not sentences.

contents:
  - "Left, headed 'The component handles' - roles and ARIA states,
    keyboard navigation, focus management, contrast of the generated
    palette, visible focus."
  - "Right, headed 'You handle' - labels, heading structure, reading
    order, alt text, link text, error wording."
  - "The dividing line labelled vertically, quietly: 'the line'."
  - "One sentence beneath the whole band: 'Both halves are required.
    Neither is optional.'"

assets:
  - Pure diagram. Type and spacing from the system.

tokens:
  region-headings: label/md, content/primary
  items: body/sm, content/secondary
  divider: border/strong at 1px
  closing-line: body/sm, content/muted
  region-padding: space/space-24

frame:
  ratio: "3:1"
  width: full content width
  below-48rem: stack the two regions, divider becomes horizontal

themes:
  light: as described
  dark: same, dark values

alt: >
  A diagram dividing accessibility responsibilities. The component
  handles roles, keyboard navigation, focus management and contrast. You
  handle labels, heading structure, reading order, alt text and content.

must-not:
  - Make the component's side longer or more prominent. The honesty is
    the point.
  - Use a tick and cross treatment. Both sides are required work, not
    pass and fail.
  - Add a third "shared" region. It sounds more accurate and it makes the
    diagram useless.

craft-notes:
  - Equal visual weight either side of the line is the whole design. A
    reader should come away knowing they still have work to do, and
    feeling that this is a straight answer rather than a disclaimer.
```

## Section 4 — How the guarantees are kept

**Heading** — `heading/h2`: `How the guarantees are kept`

**Body** — `body/md`:

> The behaviour layer is tested to full coverage, and then
> mutation-tested. Mutation testing changes the code deliberately and
> checks that a test fails. It is the difference between a keyboard model
> that is merely covered and one that is actually asserted on.

> Colour is checked at the source. The contrast floors live in the engine
> that generates the palette, and the semantic roles are pinned to what
> that engine derives, so they cannot drift quietly.

## Section 5 — Checking your own work

**Heading** — `heading/h2`: `Checking your own work`

**Body** — `body/md`:

> Three checks catch most of what matters, and none needs a specialist:

> **Unplug your mouse.** Tab through the page. If you cannot reach
> something, or you lose track of where you are, that is a real bug.
> **Zoom to 200%.** Text should reflow rather than clip.
> **Read your labels aloud.** If a link says "click here", it says
> nothing useful out of context.

**Links:** `Composition →` · `Browse components →`

---
---

## Notes for review

1. **Six illustrations across five pages.** Fewer per page than the
   home page, deliberately: these are reading pages, and a diagram here
   has to teach a mechanism rather than carry an argument. Where prose
   does the job alone, there is no picture.
2. **The density page absorbs the boilerplate sentence** from twelve
   component descriptions. That deletion and this page should land in the
   same pass, or the sentence briefly exists nowhere.
3. **The accessibility page carries a publication block.** It must not
   ship before the deferred audit runs. That is recorded at the top of
   the page above, and it is the only page here with a hard gate.
4. **Composition introduces the terms component pages assume** —
   `asChild`, controlled and uncontrolled, parts, data attributes. After
   this page, component pages may use them without explanation.
5. **The controlled-and-uncontrolled callout exists because the props
   table cannot show it.** `docs-site-planning.md` §1.20.2 records that
   the discriminated union flattens during extraction, so the constraint
   has to be stated in prose. This is where it gets stated once.
6. **Page 2 §4 states that token names are the contract.** That is a real
   commitment and worth checking against the versioning policy before
   publishing, since it constrains what a future release may rename.

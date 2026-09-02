# Home page — copy and illustration briefs

> **Status:** Draft for review, 2026-09-02. Copy written to
> [`voice-and-tone.md`](./voice-and-tone.md); section structure from
> [`docs-site-content-plan.md`](./docs-site-content-plan.md) §2.
>
> **Two audiences read this file.** A human reviews the words. A design
> model reads the illustration briefs and produces the artwork, so every
> brief sits in its true position in the page flow and is written to be
> executed **without reading anything else in the repository**.

---

## How to read this file

Copy is given as **final text**, not as a description of text. Where a
line is a heading, an overline or a button, it says so.

Illustration briefs sit **exactly where the artwork appears in the
page**, never in an appendix. Position in the flow is context the maker
needs: an image's job is set by the sentence above it.

### Brief schema

| Field | What it is for |
| --- | --- |
| `id` | Stable reference. Never reused, never renumbered |
| `type` | `screenshot` · `diagram` · `animation` · `live demo` |
| `placement` | Where in the section, relative to the copy |
| `rhetorical-job` | The argument this image carries. **Read this first** — every other decision serves it |
| `composition` | Layout, focal point, eye path, negative space |
| `contents` | Every element, in reading order. Exhaustive |
| `assets` | Real components, with the exact variant, size and density |
| `tokens` | Real token names for colour, space, type, radius, elevation |
| `frame` | Aspect, rendered width, behaviour at breakpoints |
| `themes` | What light and dark each do |
| `motion` | Beat-by-beat with timings. Animations only |
| `reduced-motion` | The still shown when motion is suppressed |
| `alt` | The alt text that ships, or `decorative` |
| `must-not` | Failure modes. Things that would make it wrong |
| `craft-notes` | What separates competent from outstanding |

### Rules that apply to every brief

1. **Build from real Primitiv components, tokens and type styles.** Never
   redrawn approximations, never a generic illustration style, never
   stock. If an image contains a button, it is *the* button.
2. **Every token named in a brief exists.** They are listed in
   `packages/tokens/src/{intent,primitives,context,elevation}.json`. Do
   not invent a token name; if something needs a value with no token,
   flag it rather than hardcoding, because that is a finding.
3. **Every animation needs a still that carries the same argument.**
   `prefers-reduced-motion` is honoured across this site, and a reader
   who suppresses motion must not lose the point.
4. **Nothing is in a hover or focus state unless the brief says so.**
   States are meaningful in this system. An accidental hover reads as a
   deliberate one.
5. **Density is Comfortable unless stated.** It is the default mode and
   the one a reader will meet.
6. **Type is only ever the real scale.** `display/lg`, `display/xl`,
   `heading/h1`–`h6`, `body/xs`–`xl`, `label/xs`–`xl`, `overline`.
   Khand for display, heading, label and overline. Asta Sans for body.
   Khand never runs at body size — that contrast is the identity.

---

# Section 1 — Hero

**Headline** — `display/xl`, Khand, two deliberate lines:

> Interfaces that look designed,
> and prove they're accessible.

**Lede** — `body/lg`, `content/secondary`, measure capped around 60ch:

> Colour generated to hold its contrast. Spacing that scales on one
> dial. 63 components your designers already have in Figma and your
> developers already have in code.

**Buttons** — `Get started` (primary, `lg`) · `Browse components`
(secondary, `lg`)

**Under-CTA line** — `body/sm`, `content/muted`:

> Open source · MIT · Copy the code into your repo and own it

```yaml
id: HERO-01
type: screenshot
placement: >
  Below the CTA row, bleeding to the right edge of the viewport. It is
  the first thing below the fold on a laptop and partly visible above it.

rhetorical-job: >
  Establish, before a single argument is made, that this is a finished
  system rather than an intention. A visitor arriving from a comparison
  with Radix or shadcn is asking "is this real?" — this answers it in
  under a second, without a word.

composition:
  - A "specimen board": one large rounded panel holding a curated
    arrangement of real components at rest, viewed straight on, rotated
    by a very slight amount (2-3 degrees anticlockwise) so it reads as a
    physical artefact rather than a screenshot.
  - A second board, the same composition in the opposite theme, sits
    behind and offset up-and-right by roughly 8% of the board's width.
    It is cropped by the right edge of the viewport.
  - Focal point is the button row, which sits on the optical third,
    upper-left of the front board.
  - Eye path - button row, down to the form field, right across the
    badges, into the table. Arrange so this reads as a natural Z.
  - Generous negative space inside the board. Roughly 25% of the board's
    area is empty surface. Crowding is the main way this fails.

contents:
  - "Row 1 - five buttons, left to right: primary, secondary, ghost,
    danger, link. All size md, all label 'Continue' except danger which
    reads 'Delete'."
  - "Row 2 - one complete Field: label 'Work email', an Input holding
    'ada@example.com', helper text 'We only use this for sign-in.'"
  - "Row 3 - four Badges: Stable (success), Beta (info), Deprecated
    (warning), Breaking (danger). Then two Tags: 'design-system',
    'accessibility'."
  - "Row 4 - a Table, header row plus four body rows, three columns:
    Component / Category / Status. Rows read Button/Actions/Stable,
    Select/Forms/Stable, Combobox/Forms/Beta, Tree/Navigation/Stable.
    The Status column holds real Badges, not text."
  - No cursor, no focus rings, no open menus, no tooltips.

assets:
  - button (registry) - variants primary, secondary, ghost, danger, link; size md
  - field + input (registry) - size md, valid state
  - badge (registry) - tones success, info, warning, danger; variant label; size sm
  - tag (registry) - neutral tone; size sm
  - table (registry) - size sm

tokens:
  board-surface: surface/raised
  board-border: border/subtle at framed-control/border-width
  board-elevation: elevation/floating
  board-radius: the card/lg/radius value, not an invented radius
  page-ground: surface/default
  gap-between-rows: space/space-32
  board-padding: space/space-40
  table-row-border: border/subtle

frame:
  ratio: 16:10
  width: full-bleed right, starting at the xl container's left gutter
  below-64rem: >
    Drop the rear board entirely and centre the front board at the
    container width. Two overlapping boards at phone size is mush.
  below-36rem: >
    Crop to rows 1-3 only. The table is illegible under 400px and a
    shrunken table reads as a texture, not a table.

themes:
  dark: front board dark, rear board light. This is the default.
  light: front board light, rear board dark. Same composition, swapped.

alt: >
  A board of Primitiv components - buttons, a form field, badges and a
  table - shown in dark theme, with the same board in light theme behind it.

must-not:
  - Show any component mid-interaction. This is the system at rest.
  - Use a perspective transform or a 3D tilt. The slight flat rotation
    is the whole permitted gesture.
  - Add a glow, a gradient wash, or a mesh behind the boards. The
    surface tokens are the background.
  - Include a component that is not in the registry.
  - Let the two boards overlap so much that the rear one reads as a
    shadow rather than a second theme.

craft-notes:
  - The rear board is the argument for theming and it only works if a
    reader can see it is the SAME composition. Align the two boards so
    the button row of each is visibly parallel and identically ordered.
  - Resist filling the board. The negative space is what makes it read
    as considered rather than as a component dump.
  - The table's Status column holding real Badges is the detail that
    proves composition - a small thing that rewards a second look.
```

> **Fallback if the specimen board proves fussy at small sizes:** drop to
> the stacked lockup and type alone over the existing dot-grid. A clean
> typographic hero beats a cluttered visual one, and this is the one
> section where restraint is a legitimate answer.

---

# Section 2 — Proof strip

No heading. A single row directly beneath the hero, on `surface/subtle`
so it reads as a band rather than as page content.

> **63 components** — in code and in Figma
> **4 density modes** — one attribute changes all of them
> **CSS, SCSS or Tailwind** — the tokens emit to all three
> **100% test coverage** — lines, branches and functions
> **MIT** — engine and components both

Figures are `display/lg`; the qualifiers are `body/sm` in
`content/muted`. Separated by `Divider` at `vertical` orientation.

> ⚠️ **Every figure re-verified against the repo immediately before
> publishing.** Do not copy these from this document. Content plan §7.3.

**No illustration.** The figures are the visual, and adding marks to
them would dilute a row whose whole power is that it is unadorned.

---

# Section 3 — The problem

**Overline** — `overline`, `content/muted`: `Why this exists`

**Heading** — `heading/h2`:

> You are already paying for a design system.

**Body** — `body/lg`:

> Most teams do not decide to build one. They build one by accident, a
> component at a time, and pay for it in ways that never show up on a
> roadmap.

Four blocks, each a `heading/h4` lead-in and a `body/md` line:

> **Three developers build three different buttons.**
> Nobody meant to. There was no shared one on the day each was needed.

> **The design file and the app drift apart.**
> The mockup says 16px, the build says 14px, and by the third release
> nobody trusts either.

> **Accessibility becomes a panic before launch.**
> Contrast and keyboard support get checked at the end, when fixing them
> costs the most.

> **A rebrand costs a quarter.**
> Because the colours live in hundreds of files instead of being derived
> from one.

**Closing line** — `body/lg`, `content/primary`:

> Building the layer that fixes all four takes a team the better part of
> a year. This is that layer.

```yaml
id: PROBLEM-01
type: screenshot
placement: >
  Directly beneath the first block ("Three developers build three
  different buttons"), full content width, before the second block.

rhetorical-job: >
  Make drift visible. Everyone nods along to "inconsistent components"
  in the abstract and pictures something obvious. The real thing is
  subtle, which is exactly why it survives review and ships. Show the
  subtlety and the reader recognises their own product.

composition:
  - Three buttons on one horizontal line, evenly spaced, vertically
    centred on their own optical centres rather than their bounding
    boxes (their heights differ, and aligning boxes would hide that).
  - Each has a small caption directly beneath it.
  - Wide, quiet margins. The image is mostly empty. The three objects
    are small in the frame, which is what makes the comparison feel
    forensic rather than decorative.
  - No frame, no card, no container. They sit on the page ground.

contents:
  - "Button 1 - label 'Save changes'. Caption beneath: 'Billing'."
  - "Button 2 - label 'Save changes'. Caption beneath: 'Onboarding'."
  - "Button 3 - label 'Save changes'. Caption beneath: 'Settings'."
  - The differences, which must be present and must be subtle -
    corner radius roughly 4px / 6px / 10px; three near blues that are
    close in hue but not equal; heights differing by about 2px and 3px;
    the third button's label at semibold where the others are medium;
    horizontal padding differing by a few pixels on the second.
  - No annotations. No red marks. No arrows. No "before and after".
    Nothing labels the differences, because in real life nothing does.

assets:
  - button (registry), primary variant, size md, deliberately
    mis-configured per instance via inline overrides.
  - The captions are label/sm in content/muted.

tokens:
  captions: label/sm, content/muted
  ground: surface/default
  gap-between-buttons: space/space-56
  caption-gap: space/space-12
  blues: >
    Three points near the brand hue but NOT from the ramp - the point is
    that these were guessed, not derived. Take the brand hue and shift
    each by a small amount in both hue and chroma.

frame:
  ratio: "3:1"
  width: content width
  below-36rem: stack to a vertical column, captions still directly beneath

themes:
  light: as described
  dark: same composition on dark surfaces, same three blues adapted

alt: >
  Three "Save changes" buttons from three different teams, each with a
  slightly different colour, height and corner radius.

must-not:
  - Exaggerate the differences. A reader who thinks "no team would ship
    that" has stopped believing the section. If in doubt, make them
    MORE similar, not less.
  - Annotate anything. No callouts, no measurement lines, no crosses.
  - Use obviously different colours - three unrelated hues would be a
    different, less true point.
  - Frame it as a comparison against a "correct" fourth button. The
    section is about the cost of drift, not yet about the fix.

craft-notes:
  - The captions carry more weight than they look. Team names rather
    than component names is what makes this organisational rather than
    technical, which is the register this whole section is written in.
  - Getting the differences to sit right at the edge of perceptible is
    the entire craft of this image. Test it by looking away and back -
    the reader should notice something is off before they can say what.
```

---

# Section 4 — Colour

**Overline:** `Colour`

**Heading** — `heading/h2`:

> Every swatch already knows what text colour goes on it.

**Body** — `body/lg`:

> The letters on each colour below are not a design flourish. They are
> the actual text colour the engine chose for that swatch, and every one
> of them clears its contrast minimum.

> That is not a promise we check occasionally. It is a test that runs on
> every change, across all 100 generated colours in both themes. If a
> single pairing dropped below the line, the build would stop.

```yaml
id: COLOUR-01
type: screenshot
placement: >
  Immediately after the two opening paragraphs, full content width. It
  is the centrepiece of the section and the largest single object on the
  page. Everything after it is explanation of what the reader is
  looking at.

rhetorical-job: >
  Prove the claim by showing the real thing rather than a demonstration
  of it. This is the actual shipped palette, and the "Ag" on every
  swatch is the actual foreground the engine paired with it. A reader
  can scan a hundred swatches in three seconds and see that not one of
  them is hard to read - which is a far stronger argument than any
  sentence, and it needs no interaction to make it.

composition:
  - Six ramps stacked as six rows, each row ten swatches wide, flush,
    with no gaps between swatches within a row so each ramp reads as one
    continuous scale.
  - A ramp name sits to the left of each row, vertically centred,
    outside the swatches.
  - Small gaps between rows so the six ramps stay distinct from each
    other.
  - The whole block sits on a Card so it reads as a specimen sheet
    rather than as page decoration.
  - The eye should travel left-to-right along a ramp and then down. The
    dark-to-light progression within each row is what makes that natural.

contents:
  - "Six rows, in this order - Neutral, Brand, Success, Warning, Danger,
    Info."
  - "Ten swatches per row, steps 50 through 900, left to right."
  - "On every swatch, centred - the letters 'Ag' at swatch/md/sample-size,
    painted in that swatch's own best_foreground from the engine. Not
    a hardcoded black or white choice, and not one colour used across a
    whole row."
  - "Beneath the 'Ag' on each swatch - the step number (50, 100, ... 900)
    at swatch/md/sample-caption-size, in the same best_foreground."
  - "Ramp names at the left of each row, in label/sm, content/secondary."
  - "Nothing else. No hex values, no contrast figures, no legend, no
    annotations on the sheet itself."

assets:
  - The REAL shipped palette from packages/tokens/src/palette.json.
    Not a regenerated one, not an approximation, not a sample.
  - The foreground on each swatch is the engine's own best_foreground
    for that swatch. If the value is not available in the emitted token
    layer, take it from the engine rather than choosing by eye - a
    hand-picked foreground here would make the image a lie about the
    exact thing it is claiming.
  - The swatch/* Context token family already exists and defines this
    anatomy - box, sample-size, sample-caption-size, radius,
    padding-inline, padding-block, gap. Use it. It was authored for
    exactly this specimen and the docs site would be its first code
    consumer.

tokens:
  swatch-box: swatch/md/box
  ag-size: swatch/md/sample-size
  step-caption-size: swatch/md/sample-caption-size
  swatch-radius: swatch/md/radius
  swatch-gap: swatch/md/gap
  row-gap: space/space-16
  ramp-labels: label/sm, content/secondary
  card: surface/raised, elevation/raised, border/subtle
  card-padding: space/space-32

frame:
  ratio: roughly 5:3
  width: full content width
  below-48rem: >
    Keep all ten steps in a row and let the swatches shrink. A ramp that
    wraps stops reading as a ramp, which destroys the whole image.
  below-36rem: >
    Drop the step captions and keep the 'Ag'. The foreground pairing is
    the argument; the step numbers are reference.

themes:
  light: the light palette, on a light card
  dark: the dark palette, on a dark card. These are genuinely different
        colour values, not the same sheet dimmed - and a reader toggling
        the site theme seeing both hold is itself part of the proof.

alt: >
  The full Primitiv colour palette - six ramps of ten steps each - with
  the letters "Ag" on every swatch in the text colour the engine paired
  with it, and the step number beneath.

must-not:
  - Use a hardcoded black-or-white foreground rule. The engine picks a
    real colour per swatch and the whole point is that it did the
    choosing. A naive threshold would produce a visually similar sheet
    that is dishonest.
  - Add contrast ratios to the swatches. They would clutter a sheet whose
    power is that it is scannable at a glance, and the numbers belong in
    the proof line below the image.
  - Space the swatches within a row. Flush is what makes it a scale.
  - Include the alpha ramps, white, black or transparent. They are real
    parts of the palette and they would confuse a sheet that is making
    one specific point about foreground pairing.
  - Imply that the neutral ramp is covered by the same guarantee - see
    craft-notes.

craft-notes:
  - "Ag" is the right specimen string and it is worth keeping exactly.
    The ascender and the descender together show the full vertical
    extent of the type, which is what makes legibility judgeable rather
    than merely assertable.
  - The most persuasive part of this sheet is the point in each ramp
    where the foreground FLIPS from dark to light. It happens at a
    different step in different ramps, because the engine decided per
    swatch rather than at a fixed midpoint. Do not tidy this into a
    straight line - the ragged flip point is the evidence that something
    is actually thinking.
  - A precision point, and the one place this image could quietly
    overclaim - the 100-swatch guarantee covers the five GENERATED ramps
    (brand, success, warning, danger, info) across both themes. Neutral
    comes from a different part of the engine and is not in that seed
    manifest. Showing neutral in the sheet is correct, because it is
    part of the shipped palette and it is where most interface colour
    comes from. Just never write a caption that extends the guard to it.
```

**Second block — harmonious, not just legible** — `body/md`:

> Legible is the low bar. The harder problem is that a colour scale
> should look like one family, and most do not. Ramps tend to drift in
> hue as they get lighter, so the pale end of your blue arrives slightly
> purple. Or they lose their colour and fade toward grey.

> Neither happens here, and neither is left to judgement. The hue is
> held fixed by construction, the steps are checked to stay visibly
> distinct from one another, and a ramp that started greying out would
> fail its test rather than ship.

```yaml
id: COLOUR-02
type: diagram
placement: >
  Beside the "harmonious" paragraphs, right-hand half of a two-column
  layout. The prose sits on the left.

rhetorical-job: >
  Show what "harmonious" means, because it is the one claim in this
  section a reader cannot verify by looking at COLOUR-01. Drift is
  invisible unless you see the alternative beside it. This is the only
  place on the page where a deliberately WRONG example is useful, and it
  works because the wrong version is what most systems actually ship.

composition:
  - Two rows, one above the other, same width, same ten steps.
  - Upper row labelled "drifting", lower row labelled "held".
  - Beneath each row, a small hue readout - a thin horizontal track with
    a marker per step showing where that step's hue sits.
  - On the drifting row the markers scatter across the track. On the
    held row they stack on one point.
  - The hue track is what makes the invisible visible, and it is the
    part of this diagram that has to be right.

contents:
  - "Upper row - a ten-step blue ramp with realistic hue drift, roughly
    30 degrees across the scale, so the light end reads faintly purple
    and the dark end faintly green. Label: 'drifting'."
  - "Lower row - Primitiv's real brand ramp, same ten steps. Label:
    'held'."
  - "Under each row - a hue track spanning the same width, with ten small
    markers. Scattered on the upper, coincident on the lower."
  - "One quiet line beneath both: 'The same ten steps. One of them is a
    family.'"
  - No degree figures on the diagram. The scatter is the argument and a
    number would invite arithmetic instead of looking.

assets:
  - The lower row is the REAL brand ramp from palette.json.
  - The upper row is a constructed counter-example. It must look
    plausible - this is what a hand-built ramp really looks like, not a
    caricature.

tokens:
  row-labels: label/sm, content/secondary
  hue-track: border/subtle at 1px, markers in content/muted
  closing-line: body/sm, content/muted
  row-gap: space/space-24

frame:
  ratio: "4:3"
  width: half the content width
  below-48rem: full width beneath the prose, rows still stacked

themes:
  light: as described
  dark: same structure, dark values, real dark brand ramp on the lower row

alt: >
  Two ten-step blue ramps compared. The upper one drifts in hue across
  the scale, shown by scattered markers on a hue track beneath it. The
  lower one, Primitiv's own, holds a single hue, its markers stacked on
  one point.

must-not:
  - Caricature the drifting ramp. If it looks obviously broken the
    comparison proves nothing, because no reader believes they would
    ship that. Drift of roughly 30 degrees is realistic and was
    measured on real ramps before this was fixed.
  - Label the upper row as any competitor, or as any named product.
  - Add degree figures, arrows, or a "before and after" frame.
  - Use the same ramp for both rows with one recoloured. Build the
    counter-example honestly.

craft-notes:
  - The hue track underneath is doing all the work. Without it this is
    two blue ramps that look broadly similar and the reader shrugs. With
    it, the difference is instant and unarguable.
  - Keep the counter-example subtle enough that a reader has to look at
    the track to be sure. That moment of "actually, yes" is worth more
    than an obvious difference.
```

**Third block — where the colour comes from** — `body/md`:

> The palette is generated rather than picked. A colour engine called
> Harmoni takes one seed colour per ramp and builds the ten steps
> around it, deciding the foreground pairings as it goes. Primitiv
> ships the result, so you get an accessible palette without running
> anything.

> Harmoni is a Figma plugin and a product in its own right, for teams
> who want to generate their own palettes this way. You do not need it
> to use Primitiv.

**Link** — `Harmoni →` → the Harmoni site (external)
**Link** — `How tokens and theming work →` → `/concepts/tokens`

> **Proof line**, small, beneath the links, `body/sm` in `content/muted`:
>
> 100 generated swatches. Every one has a foreground that clears its
> contrast minimum, every ramp holds its hue, and no two steps collapse
> onto the same colour — all checked on every change.

---

# Section 5 — Density

**Overline:** `Proportional control`

**Heading** — `heading/h2`:

> One dial changes the whole interface.

**Body** — `body/lg`:

> Some products need to fit as much on screen as possible. Some need
> room to breathe. Most need both, in different places. Primitiv makes
> that a setting rather than a redesign.

> There are four modes: Dense, Compact, Comfortable and Spacious.
> Changing one attribute reflows every control beneath it — spacing,
> height, corner radius, even type size. No rebuild, no second
> stylesheet, no component rewritten.

```yaml
id: DENSITY-01
type: live demo
placement: >
  Directly after the two opening paragraphs, full content width.

rhetorical-job: >
  Demonstrate a capability nobody else in the category has, in a form
  where the reader does the work. Reading "four density modes" produces
  a shrug; moving the control and watching a real interface reproportion
  itself produces the reaction this section exists for.

composition:
  - A Card at surface/raised, split into a control strip and a stage.
  - Control strip along the top - four radios in a row, plus the live
    attribute readout on the right of the same strip.
  - A Divider between the strip and the stage.
  - The stage holds a realistic slice of product UI, NOT a component
    gallery. It must look like a screen someone uses.
  - The stage keeps a fixed height across all four modes, so the reader
    sees the content breathe within a constant frame rather than the
    whole panel resizing. This is important - a resizing panel makes the
    page jump and hides the effect.

contents:
  - "Control strip - a radio group, options Dense / Compact /
    Comfortable / Spacious. Comfortable selected on load. Fieldset with
    a visually hidden legend reading 'Density'."
  - "Control strip, right - a mono readout: data-density=\"comfortable\",
    updating live as the selection changes."
  - "Stage, upper left - a small form: two Fields ('Project name',
    'Owner') and a primary Button labelled 'Create project'."
  - "Stage, upper right - a toolbar: a SegmentedControl with three
    options (All / Active / Archived), and a secondary Button
    'Filter'."
  - "Stage, lower - a Table, header plus five body rows, four columns:
    Name / Owner / Updated / Status. Status holds real Badges."
  - Everything reflows together when the mode changes.

assets:
  - field, input, button, segmented-control, table, badge, radio - all
    registry components.
  - The real Context token modes. Nothing hardcoded per mode; the panel
    sets data-density and lets the cascade do the work. If any element
    needs a manual adjustment per mode, that is a token gap and a finding.

tokens:
  panel: surface/raised, elevation/raised, border/subtle
  stage: surface/default
  readout: the mono face at font-size/12, content/muted
  divider: border/subtle
  control-strip-padding: space/space-16

frame:
  ratio: roughly 16:9
  width: full content width
  below-48rem: >
    Stack the form and toolbar vertically inside the stage. Keep all
    four radios on one row - the comparison depends on seeing the four
    options together.
  below-36rem: >
    Reduce the table to three columns (drop Updated). Do not reduce the
    row count; the vertical rhythm change is most of what density does
    to a table.

themes:
  light: as described
  dark: identical composition, dark surfaces

motion: >
  Transition between densities over 200ms with the system's standard
  easing, so the reader can see WHAT moved rather than just that
  something did. No autoplay and no cycling - this demo is convincing
  enough on direct interaction, and an auto-cycling one would deny the
  reader the agency that makes it land.

reduced-motion: >
  Densities swap instantly, no transition. Everything else is unchanged
  and fully interactive.

alt: >
  An interactive panel with four density settings. Choosing one reflows
  a form, a toolbar and a table to match.

must-not:
  - Show a component gallery. A row of buttons at four sizes proves
    nothing a size prop could not do. It must be a scene.
  - Let the panel change height between modes. Fixed stage height.
  - Animate for longer than about 200ms. Slower reads as a toy.
  - Hardcode anything per mode.

craft-notes:
  - The live data-density readout is the detail that converts a
    developer. It says "this is one attribute" more efficiently than a
    paragraph could.
  - Choose the stage content so all four modes are genuinely usable.
    If Dense looks cramped and broken, the demo argues against itself -
    Dense is a legitimate choice for dense products, and must look like
    a deliberate one.
  - Watch the table's row height between Dense and Spacious. That is the
    single clearest signal in the whole panel, and the composition should
    make sure it is on screen at all times.
```

**Second block** — `body/md`:

> Corner radius is worth singling out, because it shows how the system
> thinks. It is not a value someone assigns per size. It is a fraction
> of the control's height, so when density changes the height, the
> radius follows on its own and stays in proportion.

```yaml
id: DENSITY-02
type: diagram
placement: >
  Beside the corner-radius paragraph, right-hand half of a two-column
  layout.

rhetorical-job: >
  Show that the system derives rather than assigns. This is the clearest
  small example of the "mathematical proportion as a through-line"
  principle, and it is what separates Primitiv from a library with a
  size prop.

composition:
  - Four buttons in a horizontal row, one per density mode, at their
    true relative heights so the size difference is real.
  - Beneath each, its height and its resulting radius, as figures.
  - Beneath the row, the formula, once, centred, in the mono face.
  - The four buttons are baseline-aligned along their bottom edge so
    the height difference reads as growth upward.

contents:
  - "Four primary Buttons, all labelled 'Continue', at md size in
    Dense, Compact, Comfortable and Spacious respectively."
  - "Under each - the mode name, then 'height 32px' / 'radius 6px'
    style figures, with the real values for each mode."
  - "Beneath the row, the formula: radius = height x 0.1875"
  - "A single quiet line beneath: 'Nobody assigns these. They fall out.'"
  - A faint radius arc drawn on one corner of each button, showing the
    curve growing with the button.

assets:
  - button (registry), primary, size md, rendered under each of the four
    Context modes.

tokens:
  figures: the mono face at font-size/12, content/muted
  mode-labels: label/sm, content/secondary
  formula: the mono face at font-size/14, content/primary
  arc: border/strong at 1px
  closing-line: body/sm, content/muted

frame:
  ratio: "4:3"
  width: half the content width
  below-48rem: full width beneath the prose, buttons still on one row

themes:
  light: as described
  dark: same, dark values

alt: >
  The same button at four density modes, each with its height and its
  derived corner radius, above the formula radius equals height times
  0.1875.

must-not:
  - Scale the buttons artificially. The heights must be the real token
    values for each mode or the diagram is a lie about the thing it
    is documenting.
  - Draw the radius arcs heavily. They are an annotation, not a feature.
  - Round the figures to make them tidier. Real values, including
    awkward ones.

craft-notes:
  - The constant 0.1875 is Primitiv's roundness coefficient and appears
    nowhere else on the site. Showing it here, plainly, is a small act
    of confidence - it says the system has opinions specific enough to
    have a number.
```

**Link** — `How density works →` → `/concepts/density`

---

# Section 6 — Figma and code

**Overline:** `Design and build`

**Heading** — `heading/h2`:

> Your design file and your code are built from the same tokens.

**Body** — `body/lg`:

> The Figma library is not a drawing of the components. Both are built
> from one set of tokens, so they cannot quietly disagree about a colour
> or a spacing value.

> Designers work with the real component sets, at every size and
> density. Developers get the same components in code. When a token
> changes, both move.

```yaml
id: FIGMA-01
type: screenshot
placement: >
  After the two opening paragraphs, full content width, before the
  caveat block.

rhetorical-job: >
  Turn parity from a claim into an observation. A designer reading this
  section has been promised parity before and been let down; the image
  has to be a genuine screenshot of both sides, not an illustration OF
  both sides, or it confirms their scepticism.

composition:
  - Three vertical zones - Figma on the left (about 45%), a narrow token
    band in the middle (about 10%), the browser on the right (about 45%).
  - The two outer zones are at the same scale, so the components are
    literally the same size on screen. This is the entire trick.
  - The token band is quiet - a thin column of names with hairlines
    running left and right to the corresponding element in each half.
  - No "vs" framing, no divider that implies opposition. The band reads
    as a spine joining them, not a border separating them.

contents:
  - "Left - a real Figma canvas region showing the Button component set
    at md, four variants visible, with Figma's selection outline on one
    of them and the right-hand properties panel showing a bound
    variable name."
  - "Right - the same four buttons rendered in a browser, identical in
    size, order and state."
  - "Middle band - three token names stacked vertically, in the mono
    face: action/primary/default, framed-control/md/height, and the
    radius token. Each has a hairline running to the corresponding
    element on both sides."
  - "A small caption beneath the whole image: 'The same three tokens,
    on both sides.'"
  - Include enough authentic Figma chrome (layer names, the properties
    panel) to be recognisably Figma, but crop out anything irrelevant.

assets:
  - A genuine screenshot of the Primitiv Figma file. Not a recreation.
  - A genuine browser render at matched scale.
  - Both captured at the same density and theme.

tokens:
  band-lines: border/default at 1px
  token-names: the mono face at font-size/12, content/secondary
  caption: body/sm, content/muted

frame:
  ratio: "2:1"
  width: full content width
  below-48rem: >
    Stack vertically - Figma above, browser below, token names as a
    horizontal band between them with the hairlines running up and
    down instead of left and right.

themes:
  light: light Figma canvas beside a light browser render
  dark: dark Figma canvas beside a dark browser render

alt: >
  The Button component set open in Figma beside the same buttons
  rendered in a browser, with the three shared token names listed
  between them.

must-not:
  - Recreate the Figma UI. A drawn approximation of Figma is instantly
    detectable to the exact audience this section is for.
  - Show the two halves at different scales or crops. Same size, same
    order, same state, or the parity claim visibly fails.
  - Add tick marks, "match!" badges, or any celebratory annotation.
  - Include Figma's cursor, comment pins, or another user's avatar.

craft-notes:
  - Matching the scale exactly is worth real effort. A reader will
    instinctively compare edge to edge, and a few pixels of mismatch
    reads as "close enough", which is the opposite of the claim.
  - The properties panel showing a bound VARIABLE name rather than a
    hex value is the single most convincing detail available here.
    Frame the crop to keep it.
```

**Second block — the honest caveat** — `body/md`:

> Two things the design file cannot match exactly, and it is better to
> know now. Figma cannot express CSS grid inside a component slot, so
> the Grid component is approximated with wrapping. And Aspect Ratio is
> fixed-pixel in Figma rather than fluid. Everything else is the same on
> both sides.

**Link** — `Design in Figma →` → `/figma`

---

# Section 7 — Ownership

**Overline:** `No lock-in`

**Heading** — `heading/h2`:

> The code lands in your repository.

**Body** — `body/lg`:

> Run one command and the component becomes a file in your project.
> Real, readable code you can open and change. There is no styling
> engine to fight, and no upgrade that changes your buttons overnight.

```yaml
id: CODE-01
type: animation
placement: >
  Between the opening paragraph and the closing paragraph, full content
  width.

rhetorical-job: >
  Remove the abstraction. "You own the code" is a claim every copy-in
  library makes; showing the actual file arriving, and then being
  edited, converts it from a promise into an observation. The edit at
  the end is the real payload - it demonstrates permission.

composition:
  - A two-pane frame. Terminal on the left (about 45%), editor on the
    right (about 55%). The editor is empty until beat 3.
  - Both panes use the site's own code-block styling, so the animation
    belongs to the page rather than looking like an embedded video.
  - A small preview of the rendered button sits in the lower-right
    corner of the editor pane from beat 3, small but legible.

contents:
  - "Beat 1 - the terminal, empty but for a prompt. The command types
    itself: npx primitiv add button"
  - "Beat 2 - the real CLI output appears, listing the files written.
    Use the genuine output, including its exact wording and any file
    paths it prints."
  - "Beat 3 - the editor pane slides in from the right holding the real
    copied button.tsx. Code is legible at the rendered size, syntax
    highlighted by the site's own code-block theme."
  - "Beat 4 - a text cursor appears in the file, selects one padding
    value, and types a larger one. The button in the corner preview
    grows to match."
  - "A caption holds beneath throughout: 'It is a file. Change it.'"

assets:
  - The genuine CLI output and the genuine copied registry file. Do not
    invent plausible-looking code - a developer will read it.
  - The site's code-block component for both panes, including its
    Prism theme and the --primitiv-code-syntax-* roles.

tokens:
  panes: surface/sunken, border/subtle
  caption: body/sm, content/muted
  preview-frame: surface/default, border/subtle

frame:
  ratio: "16:10"
  width: full content width
  below-48rem: >
    Show the editor pane only, starting at beat 3. The terminal at
    phone width renders the command illegibly and the file is the point.

themes:
  light: light terminal and editor
  dark: dark terminal and editor

motion: >
  Roughly 7 seconds total, played once when scrolled into view.
  Beat 1 - 0.0s to 1.6s, command types at about 22 characters/second.
  Beat 2 - 1.6s to 2.6s, output appears line by line, 120ms apart.
  Beat 3 - 2.6s to 3.4s, editor slides in over 400ms then holds.
  Beat 4 - 4.2s to 6.4s, cursor appears, selects, types, preview updates.
  Hold the final frame. A replay control sits beneath the frame.
  No loop - a looping terminal reads as decoration and stops being read.

reduced-motion: >
  Show the beat-3 state as a still: terminal with its output complete on
  the left, the resulting file on the right, preview visible. The
  replay control is hidden.

alt: >
  Running "primitiv add button" writes a button component file into the
  project, which is then edited directly to change its padding.

must-not:
  - Use fake or simplified code. The file shown is the file shipped.
  - Type unrealistically fast or with a blinking-cursor flourish.
  - Loop the animation.
  - Show a package manager installing a dependency. That is the opposite
    of this section's point.

craft-notes:
  - Beat 4 is the section. If time or budget forces a cut, cut beats 1
    and 2 and open on the file. The command is expected; the edit is the
    argument.
  - The corner preview updating is what makes the edit feel consequential
    rather than cosmetic. It must be visible in the same frame as the
    code change - no cutaway.
```

**Closing paragraph** — `body/md`:

> You are not forking the hard part, either. The keyboard handling, the
> focus management and the ARIA can still come from the npm package, so
> you own the appearance without owning the behaviour. Or take both.
> That choice is the next section.

**Link** — `The registry and the CLI →` → `/registry-cli`

---

# Section 8 — Three ways to build

**Overline:** `Choose your path`

**Heading** — `heading/h2`:

> One design system. Three ways to build.

**Body** — `body/lg`:

> Take as much or as little as you need. All three give you the same
> components underneath.

Three `Card`s. Each **leads with who it is for**, then what it contains.
The "who" line is `heading/h4`; the product name is an `overline` above
it; the description is `body/md`.

> `HEADLESS`
> **You have a design system already, and want the behaviour.**
> Accessible behaviour, keyboard handling and props. No styling at all,
> so nothing fights what you have.
> `npm install @primitiv-ui/react`
> `Headless docs →`

> `STYLED`
> **You want components that already look finished.**
> The behaviour plus the design — copied into your project as files you
> own and can change.
> `npx primitiv add button`
> `Styled docs →`

> `FIGMA`
> **You are designing, not building yet.**
> The full component library in Figma, built from the same tokens as the
> code, with Harmoni generating the colour.
> `Open the Figma library`
> `Design in Figma →`

```yaml
id: PATHS-01
type: diagram
placement: >
  Directly beneath the three cards, full content width. It sits under
  them so it reads as a summary of what was just offered rather than a
  preamble to it.

rhetorical-job: >
  Stop "three ways" reading as fragmentation. A cautious evaluator hears
  three options and worries about picking the wrong one, or about the
  three drifting apart. This shows them as layers over one shared base,
  so the choice is about how much to take, not which product to buy.

composition:
  - A wide base bar running the full width at the bottom.
  - Three blocks rising from it at different heights, evenly spaced.
  - Heights encode completeness, not quality - make this legible by
    keeping the blocks the same width and varying only height.
  - The Figma block is visually separated by a slightly wider gap and a
    different fill treatment, because it draws from the same base but is
    not a code path.
  - Labels sit inside each block, not floating beside it.

contents:
  - "Base bar, labelled across its width: 'one set of tokens, one set of
    accessible behaviours'."
  - "Block 1, shortest - 'Headless'. Inside, beneath the name: 'behaviour
    + props'."
  - "Block 2, tallest of the code pair - 'Styled'. Inside: 'behaviour +
    props + the design'."
  - "Block 3, set slightly apart - 'Figma'. Inside: 'the design, as a
    library'."
  - "Each block shows what it ADDS, stacked visibly - Styled should
    read as Headless plus one more layer, with the shared portion
    aligned to the same height as Block 1."
  - No arrows, no percentages, no comparison ticks.

assets:
  - Pure diagram. Type and spacing from the system.

tokens:
  base-bar: action/primary/soft, with content/primary label
  blocks: surface/raised with border/default outline
  shared-layer-within-styled: the same fill as Block 1, so the stacking reads
  figma-block: surface/subtle with border/default, to sit slightly apart
  labels: label/md inside blocks, label/sm for the sub-lines
  block-gap: space/space-24
  figma-gap: space/space-56

frame:
  ratio: "5:2"
  width: full content width
  below-36rem: >
    Rotate to a vertical stack - the base bar becomes a left-hand
    spine and the three blocks extend rightward at different lengths.

themes:
  light: neutral surfaces, brand used only on the base bar
  dark: same structure, dark values

alt: >
  A diagram showing the headless, styled and Figma paths all built on
  one shared base of tokens and accessible behaviours.

must-not:
  - Make the tallest block look "best". Height is completeness, and
    Headless is the right answer for many readers. Keep the fills
    equally attractive.
  - Use brand colour to rank the blocks.
  - Add a fourth speculative block for a future framework.

craft-notes:
  - The shared portion of the Styled block aligning exactly with the top
    of the Headless block is the detail that makes "layers, not options"
    legible without a word of explanation.
  - The base bar should be the most visually confident element in the
    diagram. It is the thing the section is actually about.
```

---

# Section 9 — Accessibility

**Overline:** `Built in`

**Heading** — `heading/h2`:

> Accessible by default, not by audit.

**Body** — `body/lg`:

> Accessibility is not a pass someone does at the end here. It is a
> property of the components, checked continuously.

Four commitments, each `heading/h4` plus a `body/md` line:

> **Every interactive component follows its WAI-ARIA pattern.** Not an
> approximation of it.

> **Keyboard support is part of the component.** Arrow keys, Home and
> End, Escape, type-ahead. Not something you add afterwards.

> **Contrast is guaranteed by the engine that generates the colour.**
> Not spot-checked once the palette is chosen.

> **Focus is always visible.** On every control, in both themes.

```yaml
id: A11Y-01
type: animation
placement: >
  Beside the four commitments, right-hand half of a two-column layout.
  The commitments are on the left.

rhetorical-job: >
  Accessibility is the one claim on this page that can be shown rather
  than asserted. Everyone says they are accessible; almost nobody shows
  a component being driven entirely by keyboard. The absence of a mouse
  pointer for nine straight seconds is the argument.

composition:
  - A single Card holding a small, realistic form. Not a gallery.
  - A key-cap indicator sits in the lower-left of the frame, using the
    real Kbd component, showing each key as it is pressed.
  - The form is small enough that all of it is visible at all times -
    no scrolling, no elements entering or leaving the frame.
  - Focus rings must be clearly visible at the rendered size. If the
    frame is scaled down for layout, scale the capture up rather than
    thickening the ring.

contents:
  - "The form - a Field 'Full name' with an Input; a Field 'Country'
    with a Select; a Checkbox 'Email me about releases'; a primary
    Button 'Create account'."
  - "Tab moves focus through them in order. Each focus ring appears at
    its true geometry."
  - "At the Select - ArrowDown opens the listbox, ArrowDown twice more
    moves the cursor through options, Enter chooses one and closes it.
    The trigger updates to show the chosen value."
  - "At the Checkbox - Space toggles it. The checked mark appears."
  - "Focus lands on the Button and stops."
  - "The Kbd cap in the corner updates on every keypress: Tab, Tab,
    ArrowDown, ArrowDown, ArrowDown, Enter, Tab, Space, Tab."
  - No pointer, no cursor, no hover state at any point. That is the argument.

assets:
  - field, input, select, checkbox, button, kbd, card - all registry
    components at size md, Comfortable density.
  - The real focus ring, at its true geometry - the transparent gap band
    with the enlarged outer frame. Do not thicken or recolour it.

tokens:
  card: surface/raised, elevation/raised, border/subtle
  focus-ring: focus/ring and border/focus, at the real geometry
  kbd-cap: the real Kbd component's own tokens
  form-gap: space/space-20

frame:
  ratio: "4:3"
  width: half the content width
  below-48rem: >
    Move beneath the commitments at full content width, which also
    makes the focus rings easier to see.

themes:
  light: as described
  dark: identical sequence. Running it in both is the proof for the
        fourth commitment, so the theme toggle should be honoured.

motion: >
  Roughly 9 seconds, looping with a 2 second pause between passes.
  Keypresses land at a human pace - about 700ms apart, with a longer
  1.2s beat after the Select opens so the reader can register the
  listbox before the cursor starts moving.
  Looping is correct here, unlike CODE-01 - this reads as a
  demonstration on repeat rather than as a narrative that has ended.

reduced-motion: >
  A still showing the Select open, the cursor on the second option, the
  focus ring clearly visible, and the Kbd cap reading "Enter". That
  single frame carries the whole claim.

alt: >
  A form being operated entirely by keyboard - tabbing between fields,
  opening a select with the arrow keys, choosing an option with Enter
  and toggling a checkbox with Space - with each key shown as it is
  pressed and the focus ring visible at every step.

must-not:
  - Show a mouse pointer at any point, including at the start.
  - Exaggerate the focus ring. Its real geometry is a signature of the
    system and misrepresenting it here would be self-defeating.
  - Speed the sequence up. It should feel like someone using it, not a
    capability reel.
  - Skip the Select. It is the only element in the form whose keyboard
    model is non-obvious, and therefore the only one that proves anything.

craft-notes:
  - The pause after the listbox opens is the difference between a
    sequence a reader can follow and one they merely watch.
  - Running it in dark mode is worth more than it looks. Focus visibility
    on dark surfaces is where most systems quietly fail, so showing it
    holding is a genuine claim rather than a decorative choice.
```

**Second block — the proof** — `body/md`:

> The behaviour layer is tested to full coverage and mutation-tested,
> which means the tests are themselves checked for whether they would
> actually catch a regression. A keyboard model that is merely covered
> is not the same as one that is asserted on.

**Link** — `Our accessibility commitments →` → `/concepts/accessibility`

---

# Section 10 — Close

**Heading** — `heading/h2`, centred:

> Start with one component.

**Body** — `body/lg`, centred, measure capped around 50ch:

> You do not have to adopt a system to get value from it. Install one
> component, see whether it fits, and go from there.

**Buttons** — `Get started` (primary, `lg`) · `Browse components`
(secondary, `lg`)

**No illustration.** The page ends on the words. After nine sections
carrying images, an unillustrated close reads as confidence and gives
the CTA the whole frame.

---

## Notes for review

1. **Section 3 opens on a negative, deliberately.** It is the only
   section written for the team lead alone and the only place the page
   names a cost. Everything either side of it is positive.
2. **Section 7 hands off to section 8** in its closing line, so the two
   read as one argument about ownership rather than two overlapping
   ones.
3. **The words "primitive", "affordance", "compound component" and
   "contract" never appear.** `voice-and-tone.md` §3 permits the jargon
   once introduced, and the home page is where introduction happens —
   but none of these earns its place here.
4. **Ten illustrations, of which three are live or animated** —
   `DENSITY-01` (live), `CODE-01` and `A11Y-01` (animations). The
   colour section is now entirely static, which removes its dependency
   on the engine running in the browser and makes §7.1 a much smaller
   question than it was.
5. **`HARMONI-01`/`-02` were renamed `COLOUR-01`/`-02` on 2026-09-02**,
   the one deliberate exception to the never-renumber rule in the schema
   above. Nothing had been built from them, and the old names implied
   the section was about the plugin — which is exactly the confusion
   this rewrite exists to remove. Recorded rather than done silently.
6. **Harmoni is a separate commercial product with its own site.** This
   page names it as the source of the palette and links out. It does not
   demonstrate the plugin, show its interface, or explain how to use it.
   Keep it that way — the section's subject is the result, not the tool.
7. **Every figure in section 2 is unverified in this draft.** They come
   from repository notes, not from a measurement taken today. The
   100-swatch figure in section 4 IS verified — it is stated in
   `crates/harmoni-core/tests/ramp_regression.rs` and follows from the
   five-seed manifest.

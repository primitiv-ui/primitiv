# Harmoni plugin v3 — carry-over notes for the code build

Facts established while designing the v3 views in Figma (2026-08-22) that the
TDD build will need and cannot re-derive cheaply. The **spec** is the Figma page
"Wireframes — Harmoni Plugin (v3 — settled)"; this file is what building the
real views against that spec taught us.

Design set: page **"Harmoni Plugin — Views (v3 design)"** — Palette, Picker,
Curve, Export, Setup, Destination. Components: `Harmoni / Panel Header`,
`Harmoni / Context Bar`, `Harmoni / Swatch`, `Harmoni / Axis Slider`.

## 1. Window and chrome — measured, not guessed

- **`figma.showUI({ width: 360, height: 900 })`.** 900 serves every view built
  so far with room to spare; treat the height as fluid until the set is
  complete. (An earlier note said 730 — that was measured before the views were
  built at Compact and is superseded.)
- **Density is Compact, size is `md`, and neither is baked into a component.**
  The frame carries `Context = Compact`; every component instance stays at its
  default `md` unless space genuinely forces smaller. Baking a density into a
  component master was tried and reverted — the whole point of Primitiv is that
  size and density are set at any level, so the *view* chooses, not the part.
  Where smaller is forced, it is recorded: Inputs, Selects and Icon Buttons in
  dense rows run at `sm`; the Audit table runs at `xs` (see §2b).
- **Layout conventions, fixed across every view:**
  - Header: padding `4/12/4/12`, gap 12, Icon Button `md`.
  - Context bar: padding `12` all round, Breadcrumb `md`.
  - Body: a wrapper frame with padding `0/14/0/14`, gap 10, holding the `Tabs`
    instance. **TabList and TabPanel carry no inline padding** — the wrapper
    supplies the 14px gutter, so the tab baseline runs full width while the
    content lines up with the rest of the UI.
  - Footer: padding `12` all round, Button `md`.
- **The header is the whole Harmoni lockup plus a gear. Nothing else.** No
  project Select, no theme toggle, no expand control — those belong to the OLD
  600/960px app (`Harmoni App Header`, `Harmoni App Container`) and must not be
  carried over. Branding is not a label style: the lockup is
  `Lockup [Brand=Harmoni, Layout=Horizontal]`, 96×20 here.
- **The old header's lockup instance is BROKEN** — it points at main component
  `441:401`, an orphan whose `parent` is `null`, which is why it exports blank.
  Not a placeholder; a dangling reference. Don't copy from it.
- **The manifest icon is `Brand Mark [Brand=Harmoni]`** (100×100 vector, export
  at 128×128). A `Favicon` set exists too (Default / Tile).
- **Where you are is a `Breadcrumb`, between the header and the tabs** — above
  them, because the project scopes the tabs. An earlier bespoke
  `Harmoni / Context Bar` component was built and then **deleted**: the design
  system already had the right component. Don't reintroduce it.
- **The tab bar only exists once a project is bound.** Setup and Destination
  have none.
- **Link buttons are the exception, not a style choice** (settled 2026-08-23).
  A discrete action a user is meant to notice gets `Variant=secondary`; five were
  converted (`+ Add ramp`, `+ New project`, `Scan for an existing palette` ×2,
  `Reset to the default curve`). `link` survives in exactly two situations:
  - **the control is a row inside a list** — Destination's `+ New…` sits among
    Miller Columns rows, and a framed button there reads as a row of a different
    kind and breaks the column rhythm;
  - **quiet is the point** — In sync's `Remove 120 variables from this file` is
    destructive and lives in the footer. A framed button makes it easier to hit
    by accident, and `Variant=danger` would be louder still: a filled red button
    is more emphasis than a footer escape hatch should carry.
- **`content/muted` is not used for the plugin's own text.** Every label, value
  and note is `content/primary`; the muted role did not read well at 360px.
  **`figma.createText()` gives a literal black fill, not a token** — every text
  node you create must have its fill bound to `content/primary`
  (`figma.variables.setBoundVariableForPaint`). Easy to miss because it renders
  plausibly on a dark frame; audit with a sweep for TEXT nodes whose
  `boundVariables.fills` is empty, skipping anything inside an INSTANCE (the
  component owns its own colour).
- **The card is the grouping device across every view** (settled 2026-08-23): a
  `surface/subtle` + `border/subtle` frame on `surface/md/{padding,gap,radius}`,
  pinned to `Context = Dense`, cloned from the picker's Value card. Applied to
  Settings (4 cards), Canvas swatches (2), **Roles** (one per role family — which
  is what finally binds each `↳ quietest step reaching AA` line to the family it
  belongs to, instead of floating between groups) and **Export** (`Will create`;
  the `Offer` keeps its own accent fill and stroke deliberately — it is a pitch,
  not a settings group). On **Palette** only `Seeds` is carded: the ramp strips
  already group themselves visually, so an outline around 700px of them buys
  nothing. **Do not card a view that is one table or one list** — Audit is a
  `Table` and needs no frame around it. Also carded: **Setup** (`Projects`,
  `Adopt`), **Destination** (`Where`, `Modes`, `Collision`) and **Curve**
  (`Curve chart`, `Padding`, `Ramp` — which is what separates the thing you edit,
  the bounds you edit it within, and the ramp it produces). Every card is
  `Context = Dense`, with `itemSpacing 16` between them.
- **Setup's `EmptyState` stays bare** — it is a component with its own
  presentation, so a card round it is a box round a box. It does run at
  **`Size=sm`, not `xs`**: `EmptyState` caps its text column with a real measure
  token, `empty-state/{size}/max-inline-size`, which at `xs` in Compact is
  **168 px** and broke "No Harmoni variables here" four words to one. That wrap
  was the token doing its job, not a bug — **the fix is the size axis, not the
  copy**, and the copy is worth keeping because "*Harmoni* variables **here**" is
  exactly what sets up the adopt-what-is-here choice below it.

## 2. Which view owns what

Palette and the picker are separate views, and the split is load-bearing:

- **Palette is multi-ramp.** SEEDS (a list with `+ add ramp`) then RAMPS — per
  ramp a name, step count, a thin colour strip, and `✓ every step has a readable
  foreground`. Footer action is **Create variables**.
- **The picker owns the controls**: the OKLCH value block, the axis tabs
  (lightness · chroma · hue · 3D), one plane, the three painted sliders, the
  steps control (3–32), the ramp it seeds as a strip, and the action.
- **Export** is where the semantic-layer offer appears — next to the variable
  count, never in Settings — carrying its own `don't ask again`.

- **Curve** is the picker's fifth tab, and owns `light_padding` / `dark_padding`
  plus per-step lightness handles. Settled on wireframe panel 08.

**Curve tab — settled (2026-08-22).** Padding and per-step handles are the same
job at two resolutions, so they share one view.

- **Five tabs with full names**: `lightness · chroma · hue · 3D · curve`.
- The **L/C/H sliders are absent** on this tab: it edits the *ramp*, they edit
  the *seed*. A read-only seed swatch + OKLCH line keeps you oriented. This does
  not break "the sliders are always there" — the handles *are* the controls for
  what this tab edits.
- **Overrides are a sparse map of step → lightness, not a full curve.** Padding
  always applies to the *default* curve; the effective curve is
  `padding(default)` with overridden steps substituted; "release" deletes that
  step's entry. That keeps padding live on every un-overridden step and needs
  **no engine change** — build the array and pass it to `generate_with_lightness`,
  which already takes an explicit lightness array. "Reset to the default curve"
  is just clearing the map.
- **A step-count change drops overrides**, because step 7 of 10 has no
  counterpart at 16 steps. Say so in the UI rather than guessing a remap.
- `max_recommended_light_padding(hue)` bounds the light slider and is surfaced as
  a hint. Its only plausible consumer is this control.

**`readable_step` and the contrast grade crossed the wasm boundary (2026-08-23).**
Both existed in `harmoni-core` and neither was reachable from the plugin, so the
Roles and Audit views had no engine behind them.

- **`grade(ratio, use)` is what `get_contrast_rating` could not be.** That one
  returns `{ ratio, display_ratio, rating: String }` — a single stringly-typed
  verdict, which cannot say that 4.71:1 is AA as body copy, AAA at heading size,
  and past the non-text bar all at once. `ContrastUse` is the first mirror type
  that converts **core-ward**, because it is the caller stating what the colour
  is for; `TintMode` is the only precedent.
- **`readable_step` takes the ramp's steps, not a brand colour.** That preserves
  the property the core signature exists for — asking about a ramp the engine did
  not generate, such as the token layer's neutral ramp, which is not reproducible
  from its seed. `Vec<T>` is not a first-class wasm-abi type for anything but
  primitives, so the steps are wrapped in a `Ramp` struct rather than reaching for
  the opaque-handle pattern `Palette` uses.
- **An inbound step has its derived fields rebuilt, not trusted.** `hex`, `rgb`
  and `oklch` follow from `l`/`c`/`h`, and a step assembled in JS can carry values
  that disagree with its own coordinates, so the conversion goes through
  `SwatchStep::from_label`.
- **`harmoni-wasm` entry points ARE natively testable — this was never a
  constraint, just an omission.** All 18 pre-existing tests were mirror-type
  conversions and not one entry point had a test, which reads like a boundary the
  harness could not cross. It is not: `#[wasm_bindgen]` functions are ordinary Rust
  under a native target and `cargo test -p harmoni-wasm` calls them directly. The
  new entry points are driven by tests as a result. **`lib.rs` still sits at ~25%**
  because ~30 older entry points remain untested, and the crate is excluded from
  CI's coverage gate (`--exclude harmoni-wasm`), so nothing catches it.
- **Verified the tests bite**, not just pass: flipping `readable_step`'s `min_by`
  to `max_by` in the core fails the quietest-step test through the wasm layer.

**Curve presets — settled 2026-08-23, engine work still to do.** Researched
against SupaPalette (the reference the request came from), whose list is
`Linear · Quad · Cubic · Quart · Quint · Sine · Expo · Circ · Arc` in one Select
and `EaseIn · EaseOut · EaseInOut` in a second.

- **We match the vocabulary, not the spelling.** Two Selects — `Easing` and
  `Direction` — as one two-column row at the top of the Curve chart card. But
  **full words**: `Linear · Quadratic · Cubic · Quartic · Quintic · Sine ·
  Exponential · Circular · Arc` × `Ease in · Ease out · Ease in-out`. The
  abbreviations are machine names; `EaseInOut` in particular is camel-jammed and
  reads as code, not a label.
- **`Arc` is not from easings.net, and it is not a curve shape at all** — it comes
  from the fettepalette / rampensau lineage, where `arc` is a *sampling* method.
  Its source reduces (at accent 0) to `x = cos(θ)`, `y = sin(θ)` for
  `θ = 0..π/2`: the same quarter-circle `Circular ease-out` traces, but with
  points spaced evenly **in angle** rather than evenly in `t`. For a ramp that is
  a real distinction — where the steps land is exactly what a preset controls —
  but it has a consequence for the UI: **a curve-only glyph cannot distinguish
  Arc from Circular.** The preview glyphs therefore draw **bars at the sample
  positions**, not a line, which shows shape and distribution at once and matches
  how the Curve chart already renders the ramp beneath the curve.
- **Engine consequence:** `Arc` cannot be expressed as `f(t)` like the other
  eight. The easing module needs to return *sampled positions*, not a function —
  `curve(easing, direction, count) -> Vec<f32>` — so a family is free to choose
  its own distribution. Writing the API as `fn ease(t: f32) -> f32` would make
  Arc impossible to add later without breaking the signature.
- **Back, Elastic and Bounce are excluded, and that is correctness not taste.**
  They overshoot past 0/1 and reverse direction, so they would either fail
  `validate_lightness_curve` or scramble step order — 300 coming out darker than
  400. SupaPalette omits them too, which is independent confirmation rather than
  a gap in their list.
- **Their easing runs over HSL, ours runs over the OKLCH lightness curve.** Same
  family name, same mathematical shape, different axis — so `Sine ease-in-out`
  will NOT reproduce SupaPalette's ramp, and should not. Say so somewhere a user
  can find it, or it gets reported as a bug.
- **Engine spec — BUILT 2026-08-23 (`crates/harmoni-core/src/palette/easing.rs`),
  and building it corrected two things below.** What landed: `Easing` (9) ×
  `Direction` (3), `curve(&CurvePreset, count) -> Vec<f32>` returning normalised
  `0..=1` ascending positions, plus `lightness_curve(preset, count, from, to)`
  reading them across a ramp's own endpoints. Opt-in via
  `GenerateOptions.curve: Option<CurvePreset>`, default `None`. 100% lines,
  regions and functions; gated by `crates/harmoni-core/tests/easing_curves.rs`.
  - **`Arc` at accent 0 IS `Sine`, exactly — the original spec below was wrong
    about which family it collides with.** Parametrising a quarter circle evenly
    in angle gives `sin θ` and `1 − cos θ`, which *are* sine's two directions, so
    under any 1-D reading Arc has no shape of its own. The spec compared Arc only
    against `Circular` (0.87 vs 0.71 at the midpoint) and that gap is real — but
    0.71 is `sin(π/4)`, so those very numbers were the collision. The distinction
    survives in fettepalette only because there `x` and `y` feed *different*
    channels. **Resolution (settled with the human): Arc keeps its place and
    gains a user-facing accent**, which sweeps it from Sine ease-out at 0 to Sine
    ease-in at 1. Both ends duplicate sine, so `DEFAULT_ARC_ACCENT` is **0.5** —
    the only default under which Arc contributes something nothing else can make.
    **This added a third control to the Curve card**, built the same day (below).
  - **Two departures from fettepalette's `pointOnCurve`, both forced by what a
    lightness ramp needs.** Its arc branch is `y = cos(-π/2 + i·slice + accent)`,
    i.e. `sin(θ + a)`, then **clamped** into `0..1`. (1) The accent is negated and
    clamped to `0..=1`: `sin` turns over inside the sampled window for a positive
    accent, which would run lightness back down — 300 darker than 400. (2) The
    result is **normalised over its own sampled span, not clamped**: clamping
    parks several samples on one value at any non-zero accent, and colliding
    steps are precisely the defect the anchored model exists to prevent (RFC 0027
    §12.2). Verified the gate catches both by reintroducing the clamp.
  - **The signature grew a struct, and that was forced too.** `curve(easing,
    direction, count)` had nowhere to put an accent, so the choice is carried as
    `CurvePreset { easing, direction, accent }`. The property the spec actually
    cared about — sampled positions rather than `fn ease(t)` — is unchanged.
  - **`None` is not `Some(Linear)`.** The authored `TARGET_LIGHTNESS` /
    `TARGET_LIGHTNESS_DARK` are not straight lines and no preset reproduces them,
    which the gate asserts across all 27 combinations. So the default stays a
    separate case rather than becoming a tenth list entry — and a caller who opts
    in always gets a real change.
  - **`generate_brand_pair` still takes no options**, so a preset cannot reach
    `primitiv theme --brand` or `regen-palette`. Primitiv's own token layer stays
    structurally locked to the authored curve, the same guarantee that keeps the
    step-count knob out of it. The 365 primitiv-emit goldens passing untouched is
    the independent proof.
  - **The accent control landed in the Curve view (2026-08-23).** A full-width
    `label · slider · value` row directly under the two Selects, cloned from the
    Padding card's row so it inherits that shape exactly — and cloned rather than
    built because an instance sublayer cannot be resized (gotcha 14), while
    `pad dark`'s slider already sat at exactly 50% (`range-fill` 117/234, thumb
    111), which is the default accent.
    - **A full-width row, not a third column.** Three controls across 310 px
      gives ~97 px each and the Select triggers already truncate at that width.
      It costs zero height in the other eight states because the accent only
      exists for Arc — which is also why the panel now documents the **Arc**
      state rather than Sine: a control that appears conditionally has to be
      shown in the condition that produces it.
    - **The chart was redrawn from real engine output, not approximated.** The
      panel said Arc while the plot still drew the hand-authored default, which
      is worse than no panel. `cargo run -p harmoni-core --example preset-ramp`
      (added for exactly this loop) prints a preset's lightnesses and hexes; the
      plot's own lightness→y mapping is recoverable from its end handles
      (`TOP 16.68 / BOTTOM 144.6` against `L 0.97 / 0.15`), so columns, curve,
      handles **and** the seeded-ramp strip below all move together.
    - **Copy: "0 and 1 match Sine — the shape lives between them".** A first pass
      read "Arc only · 0 and 1 match Sine", which spends half a 310 px line
      saying something the user can already see — the row is on screen *because*
      Arc is selected. The half that carries information is which values are
      degenerate.
  - **`Exponential`'s first sample is pinned to 0**; `2^(10t−10)` lands on `2^-10`
    at `t = 0`, and anchoring reads the curve's own endpoints, so a ramp whose
    curve starts just off zero starts just off its anchor.

- **Engine spec as originally settled (superseded above where they disagree).** A `palette::easing` module,
  `Easing` (9) × `Direction` (3), exposing
  **`curve(easing, direction, count) -> Vec<f32>`** — sampled positions, not a
  function, for the Arc reason above. It replaces `TARGET_LIGHTNESS` as the shape
  fed to the existing padding → `anchored_lightness` chain, so there is **no
  change to the generation model**; a preset only changes which shape the
  anchoring works from. Note it supersedes `resample` for preset curves: a family
  that can sample itself at any `count` does not need a ten-point shape read at
  another resolution. `Linear` ignores direction. Gate it on the property the
  whole feature rests on: every family × direction × ramp length 3-32 must be
  **monotonic and within 0..1**.
- **The glyphs are a component set, and they follow the direction** (built
  2026-08-23). `Harmoni / Easing Glyph` (`1975:129542`, page "Harmoni Easing
  Glyph") — `Easing` (9) × `Direction` (3) = **27 variants**, drawn as bars bound
  to `content/primary`. **12 px with 3 bars — measured from the slot, not
  guessed.** `Select / Trigger` at `sm` under `Context = Dense` is only **20 px
  tall** and renders its `Leading` slot at **12 × 12**. Three sizes were tried and
  two failed against that: 24 px prints on top of the value text, 16 px overflows
  the input and crowds the 4 px gap before the label. At 12 px four bars fall to
  1.6 px hairlines, so **three bars at 2.5 px** is the legible fit — and three
  samples still separate everything that matters: at the midpoint
  `Circular ease-out` reads 0.87 against `Arc ease-out`'s 0.71.
  **Measure the slot before changing bar count or box size**; the whole sequence
  of failures came from sizing the glyph in isolation and fitting it afterwards.
  **Only the Easing trigger carries a glyph.** It already previews the chosen
  direction, so repeating it on the Direction trigger would show the same mark
  twice in one row; in the open lists both carry glyphs (the family list at the
  current direction, the direction list at the current family). The family Select renders
  each row's glyph *at the currently-selected direction*, so the list never shows
  a curve you would not get; the alternative — canonical ease-in-out glyphs that
  ignore the direction control — defeats the point of having a preview. `Linear`
  keeps three identical variants so the grid stays rectangular, the same
  concession `Tree / Connector` makes for `Style=rail` ignoring `Target`.
- **This is what Rich Select is for.** The family list is nine near-synonyms
  (`Quadratic`, `Cubic`, `Quartic`, `Quintic` differ only by exponent) — names
  alone do not tell you what you are choosing, so the row glyph is the actual
  content and the label is the caption. A native `<select>` cannot carry it.
- **The chart draws the ramp as columns under the curve** (2026-08-23, matching
  SupaPalette). One bar per step, filled with **that step's actual colour**, rising
  from the plot floor to the curve; gridlines over the bars; the curve as a single
  vector; handles on the **bar centres**. Adding bars is not a layer you drop
  behind an existing plot — the handles were on a ~34.7px pitch and the bars are
  on `width / steps`, so the whole plot is generated from one set of positions or
  the handles no longer sit on their own columns. It is the same argument as the
  preset glyph: the curve alone does not tell you what colour you get.
- **The columns are sloped quadrilaterals, and every one of them carries three
  top vertices** (2026-08-23, after two failed passes). A bar chart's idiom —
  flat-topped rectangles, a 1px gutter between them — is wrong here: the gutters
  let the dark card show through as stripes, and each flat top diverges from the
  sloped curve above it, leaving a triangular void per step. So each column is a
  `VECTOR` quad whose top edge *is* the curve. Two rules make it seamless:
  - **Neighbours share the same computed edge value.** Column `i`'s right edge and
    column `i+1`'s left edge both come from one `curveY(x)` call at the same `x`,
    so a seam cannot exist by construction — not "a seam too small to see".
  - **Each column needs a vertex at its own handle, not just at its two edges.**
    A handle sits at its column's *midpoint* (`cx(i) = i·bw + bw/2`), so a
    straight top chords across the bend and dips below the curve. Only the first
    column showed it — that is where the slope change is largest — but every
    column had it. The top is `[x0, curveY(x0)] → [cx(i), cy(i)] → [x1,
    curveY(x1)]`.
- **Handles stay on the bar CENTRES, and the bars stay sloped — both were
  reopened and re-settled by rendering, 2026-08-23.** Handles-at-bar-start was
  proposed and modelled. With sloped tops it is wrong: bar `i` would then run
  from exactly step `i` to exactly step `i+1`, rendering the *interval between*
  two steps while filled with step `i`'s colour, which is only correct at its
  extreme left edge. It also puts every handle on a boundary (ambiguous which
  bar owns it) and clips handle 0 against the plot frame.
  - **Handles-at-start is only right for FLAT treads** — and with flat treads the
    question dissolves, because a tread carries its value across its whole width,
    so the centre is exact too. Centre then wins on clipping and ambiguity alone.
  - **The staircase was built and rejected on the render.** It is the more
    truthful encoding, but this chart exists so a user can choose a *shape*, and
    a staircase makes the easing much harder to read at a glance. A hybrid — flat
    treads plus the smooth curve drawn over them — was also built and is the
    worst of the three: the tread corners poking above the line read as rendering
    artifacts.
  - **The correctness argument for the staircase is weaker than it sounds.**
    Nobody reads this chart as "step 300's lightness varies across its width".
    The bars are a **colour bed for the curve**, not a data encoding to be
    measured off. Legibility of the shape is the thing worth optimising.

- **`curveY` clamps flat past the end handles rather than extrapolating, and the
  curve vector is drawn to the plot edges to match.** The first handle sits half
  a column in from the left, so the outer half of columns 0 and 9 has no curve
  segment over it — inventing a slope there would draw a lightness the ramp never
  produces. Flat is the truthful shape, and running the stroke out to `x = 0` and
  `x = W` is what stops the fill's top edge reading as unfinished at both ends.
- **Two interaction rules, following existing decisions.** Padding still applies
  on top of the preset (padding shapes the default curve; a preset replaces which
  curve is default). And **switching preset drops per-step overrides**, for the
  same reason a step-count change does: an override is keyed to a step of a
  particular curve.

**Open question the wireframes still do not answer:** the soft white / black
anchors appear in the old 600px app but on no v3 panel. They are real
`GenerateOptions` inputs, so they need a home — most likely Settings. Do not
invent a place for them without settling it.

## 2b. Roles and Audit — the two views the semantic layer unlocks

- **Roles** is one row per role: an editable **name** field and a separate
  **rule** Select, because a role is a name plus a rule and renaming must not
  re-run the engine. Rows are grouped by family (surface · content · border ·
  action) under an eyebrow head. Controls run at `sm` — four controls to a row
  at 332px does not fit at `md`.
- **Audit** is one **`Table`**, nothing else. Columns
  `ROLE | AS | PAGE | SUBTLE`; the `AS` column is the `ContrastUse` (`text`,
  `ui`, or `–` where the role carries no floor). Grades are **`Badge`**
  instances — `success` for AAA/AA/PASS, `warning` for AA-LG, `danger` for
  FAIL — and a role with no floor prints `–` rather than a badge, which is the
  visual form of "a divider and a button background get no verdict".
- The grade note lives in the Table's own **Caption**, not a loose paragraph.
- **The Audit table runs at `Size=xs`, and this is forced.** Four columns in
  332px at 12px cell padding leaves 148/48/68/68; `content/secondary` at `sm`
  (14px) already overflows the ROLE column. Column widths are set on the cell
  instances inside the row's `Cells` slot — `Rows=custom` on the Table and
  `Cells=custom` on each Row, since a fixed row's cells take their width from
  the master.
- **Known token gap, found here, not yet fixed:** `table/*` in
  `packages/tokens/src/context.json` carries only `cell.padding-inline` and
  `cell.padding-block`, both density-scaled but **flat across every size**, and
  the Figma set's per-size font sizes (12/14/16/20/22) are **hardcoded literals
  with no bound variable and no text style**. So the Table's `Size` axis changes
  type size only, by magic number. Every other family (`framed-control/*`,
  `card/*`, `tree/*`) scales its padding with size. Fixing it means a
  `table/{size}/*` ladder in code, mirrored to Figma, and rebinding 75 Cell and
  Header Cell variants — flagged rather than done mid-view.

## 2c. Settings — reached from the gear, not a tab

- **No context bar and NO TAB BAR.** Settings is global, not project-scoped, so
  the project Breadcrumb is wrong here — and by the same argument so is the tab
  strip. Wireframe 05 draws tabs with none active, but that panel was drawn at
  600px before the chrome settled, and a tab strip with nothing active is a dead
  control: it reads as a bug. Setup and Destination have no tabs either, so this
  is consistent, not an exception. Footer action is **Done**, which is the way
  back. The Body sits directly in the wrapper — and remember the wrapper is
  HORIZONTAL with `counterAxisAlignItems: CENTER`, so a body that is not
  `layoutSizingVertical = 'FILL'` floats in the middle of the panel.
- **Both tri-states are `Segmented Control [Count=3, Size=sm]`.** `sm` is
  forced: three FILL segments in 332px give 107px each, and `ask each time`
  does not fit at `md`. A Checkbox cannot express "yes, always, stop asking",
  which is the whole reason these are tri-states.
  - Semantic layer: `ask each time · always add · never`
  - Contrast readout: `grades · both · ratios`
  Each carries a one-line `Body / xs` rationale underneath — the setting is
  only legible if you say what the offer *was*.
- **Defaults are `GenerateOptions`, surfaced as label/control rows**: Steps per
  ramp (`Input sm`, with `Engine allows 3 – 32` right-aligned beneath — the
  bound comes from `supported_step_range()`, never hardcoded), Gamut
  (`Select sm`), Modes (`Select sm`).
- **Role schema**: `In use` (`Select sm`) plus two `Button [secondary, sm]`
  actions — `Save current as preset` and `Import schema`. This is the surface
  that makes the role schema portable, which is what "a role is user data"
  buys.
- Row labels are `Body / sm`, **not `Label / sm`** — a settings row is a label
  and its value at equal weight; SemiBold labels read as headings and fight the
  eyebrows.
- **Sections are cards, not eyebrow-plus-divider** (reworked 2026-08-23 to match
  the canvas-swatches view): four `surface/subtle` + `border/subtle` frames on
  `surface/md/{padding,gap,radius}`, each pinned to `Context = Dense`, each headed
  by its own overline. Cloned from the picker's Value card, which is the
  established surface idiom in this view set. It reads as grouped settings rather
  than a list with rules through it, and it is **shorter** — 436 px of content
  against ~600 with dividers, because a card's padding replaces the 20/1/20 gap
  a divider needed either side of it.
- **Two row shapes, and the choice is meaningful.** A *label-above-control cell*
  in a two-column grid for controls that sit side by side (Steps per ramp ·
  Gamut); a *label-left / control-right inline row* for a control that qualifies
  what is above it or stands alone (Modes · In use · Contrast against on the
  canvas view). The inline form also lands the control in the right-hand column,
  so it lines up with the grid above rather than floating.
- **Still unsettled:** `soft_white` / `soft_black` are `GenerateOptions` inputs
  with no home in v3. DEFAULTS is now literally a `GenerateOptions` panel, so
  it is the obvious candidate — but wireframe 05 does not draw them, so do not
  add them without settling it.

## 2d. Canvas swatches — the view, built 2026-08-23

Built at 360 × **912** — 12 over the window, which is fine while the height is
fluid; the layout notes below are what got seven controls plus a live preview
into that at all. Chrome follows the **pushed-view** template, copied
from Picker, not the tabbed one: header → Breadcrumb → Body `20/14/20/14` gap 16
→ Footer `12/14`. Breadcrumb reads `Primitiv / Export / Canvas swatches`, so the
way back is a crumb rather than a bespoke `‹ export` control.

- **The controls are a 2-column grid in two cards, at Dense.** A first pass used
  four cards of full-width label-left/control-right rows and came to 1030 px —
  130 over the window. Three changes bought 260 px back, in this order of value:
  **(1)** the cards pin `Context = Dense`
  (`setExplicitVariableModeForCollection`, Context =
  `VariableCollectionId:369:31958`, Dense = `369:8`) — the panel is tight, so the
  controls give first, and nothing is baked into a component to do it;
  **(2)** two columns with the label *above* its control, which halves the row
  count; **(3)** four cards collapse to two (`Layout & shape`, `Labels & checks`),
  saving two paddings, two eyebrows and two gaps. Only `Value` spans both columns
  — three options will not sit in 144 px.
- **LABELS & CHECKS is three switch pairs plus one inline row.** Each row is a
  coherent pair — `Step labels` / `Ramp title` (what the sheet is labelled),
  `Hex value` / `OKLCH value` (the values), `Foreground swatch` / `A11y badge`
  (the specimen) — then `Contrast against` as a **label-left / select-right**
  row. That lands the select in the right-hand column, directly under the
  `A11y badge` switch it qualifies. An earlier version stacked the bare select
  *inside* the A11y cell, which made that cell taller than its neighbour and left
  `Ramp title` floating; a full-width select was tried next and read far too
  heavy for a three-option control.
- **A `Switch` carries its own label** (`Show label#881:306` + `Label#881:265`),
  so every boolean row needs no separate label cell. That is what makes the
  second column viable at all: `Step labels` / `Hex value` / `OKLCH value` /
  `A11y badge` / `Ramp title` / `Foreground swatch` are self-describing controls,
  not label-plus-control pairs. Splitting `value` into two booleans **shortened**
  the card — the three-option Segmented Control it replaced needed a label above
  it and a full-width row of its own.
- **Gotcha: an empty auto-layout frame is 100 × 100.** Adding a blank spacer cell
  to balance a two-column row inflated the card by 64 px. There is no zero-size
  placeholder — restructure the row instead of padding it.
- **Gotcha: holding a reference to a node does not keep it alive.** Collecting the
  card's controls into a map and *then* removing their parent rows deleted the
  controls too, and the next `appendChild` failed with "node … does not exist" —
  after the rows were already gone. Reparent first, then remove.
- **Gotcha: setting a `Segmented Control` to FILL is not enough** — its items keep
  hugging and the group sits right-aligned inside its own stretched frame, which
  reads as a broken control. Set `layoutSizingHorizontal = 'FILL'` on each **item**
  as well.
- **Segmented Control, not ToggleGroup.** The design guide §5 suggests
  `ToggleGroup` for orientation / shape / ramps, but there is **no composed
  ToggleGroup set in Figma** — only `ToggleGroup Item` (`733:239`), which would
  have to be hand-composed and hand-size-matched. `Segmented Control`
  (`1216:44224`) is composed, size-matched and already the single-select control
  used by the picker's axis tabs and Settings' tri-states. Deliberate deviation.
- **Group cards are plain frames on `surface/subtle` + `border/subtle` with
  `surface/md/{padding,gap,radius}`** — cloned from the picker's Value card, not
  `Card` instances. That is the established idiom across this view set.
- **The preview ground does NOT pin its Intent mode — it inherits the panel's.**
  A first pass pinned it to Light so a light canvas showed inside a dark panel,
  and that was wrong: it conflated two independent things. The canvas
  *background* is the user's Figma window, which follows **their Figma theme**;
  the palette *mode* is which set of ramp values gets drawn, which is what the
  mode chip selects. Pinning the ground froze the first to the second. Consequence
  for the copy: the chip reads **"Light values" / "Dark values"**, never "Light" /
  "Dark" alone, because the word on its own gets read as the canvas colour.
- **`swatch/{size}/panel-cap` is new (2026-08-23), and it fixes a real component
  bug.** The `panel` form is a VERTICAL hug whose cap is `FILL` + locked square,
  so **the cap size was an accident of the widest fact's text width** — fine with
  hex alone (63 px at sm), thin and tall the moment OKLCH was added. Each panel
  variant now binds **`minWidth`** (which is bindable — no magic number) to the
  new token, so the cap is a design decision and the facts wrap under it. Compact
  /sm resolves to **96**, taking the card from 68 × 200 (1 : 2.94) to 96 × 228
  (1 : 2.38). Ladder is monotonic across both axes and gated by
  `packages/tokens/src/swatch-sizing.test.ts`, which grew a `panel-cap` member.
  **Gotcha: on an INSTANCE, `minWidth = null` does not inherit the master's
  binding — it clears the minimum.** Re-bind the variable on the instance.
- **The preview is real `Harmoni / Swatch [Form=panel, Size=sm]` instances**, not
  a drawing — 65 × 171 with a **square 63 × 63 cap** and the facts below it on
  their own bordered card, which is the form the square-cap/meta-below request
  produced in the first place. `block` was tried first and is wrong here: its cap
  is a squat 47 × 32 and the facts run to four lines.
- **The ground is drawn as the Figma canvas, not a panel surface** — `surface/default`
  with a `border/subtle` dot grid at 26 px. The dots are a depiction of an
  external surface, not styling of ours, which is why a dot grid is allowed here
  and nowhere else in the panel. One seeded ellipse is bound to the token and
  then cloned; `clone()` carries the bound fill, so it is one bind, not eighty.
- **The strip overflows on purpose.** Five panels are 337 px against 300 px of
  ground, so the fifth clips and a real `Icon Button [secondary, sm]` sits over it
  as the scroll paddle. That is the signed-off "1:1, and it scrolls rather than
  scales" made literal — a preview that fitted would be lying about the size.
- `Show source` is **off**: the "fg 900" line is not in `SwatchExportConfig`.
  `foregroundSwatch` maps to `Show sample` (the `Aa`) alone.

**Config → Swatch property map** (worked out here, needed by the builder):

| `SwatchExportConfig` | Swatch |
|---|---|
| `stepLabels.show` | `Show step` |
| `value: hex \| oklch` | `Show hex` / `Show OKLCH` |
| `a11yBadge.show` | `Show grade` (+ `Show ratio` for `display_ratio`) |
| `foregroundSwatch` | `Show sample` + `Show source` |
| `title` | the ramp title above the strip — not a Swatch property |
| `orientation`, `ramps`, `swatchSize`, `gap`, `shape`, `cornerRadius` | layout the planner applies — no Swatch property |

**New gap: `SwatchExportConfig` has no `form` field.** The Figma Swatch carries
six forms (`tile / block / card / circle / row / panel`); the config carries only
`shape: square | rounded`. Which form the canvas output uses is unspecified, and
it matters — §4 says only `row` and `tile` print inside the colour. Settle it
with the mode-field question.

**Two Figma gotchas found building this:**

1. **The composed `Breadcrumb`'s third item and its separator ship
   `visible: false`.** The Picker had them off and the clone inherited it, so
   setting the third crumb's Label reported success and rendered nothing. Check
   `visible` on breadcrumb items before trusting a label write.
2. **`Harmoni / Swatch`'s `Grade#1940:535` TEXT property is dead.** Verified
   across all 30 variants: the `Grade` node carries only
   `{"visible": "Show grade#…"}` — nothing bridges the set-level TEXT property to
   the nested `Badge`'s own label, and nothing can, because
   `componentPropertyReferences` cannot be set on an instance sublayer (the same
   limit ConfirmDialog and Card hit). Every badge therefore renders the master's
   `"AA"` no matter what the panel says. **Set it by walking to `Flags → Grade`
   and writing the Badge's own `Label#1389:0`.** The property should be deleted
   or the Badge detached; left in place it is a control that silently does
   nothing.

## 3. Ramp data facts (verified against the engine this session)

- Seeds are `brand #236ce1`, `danger #db2424`, `warning #e88e00`,
  `success #008c11`, `info #008e9d` — five seeds. **`#3b82f6` is not the brand
  seed**; it is a placeholder that has appeared in mockups.
- **`neutral` has no seed** and is not reproducible from one — it is derived
  from brand by hue tinting, and its committed values come from `palette.json`.
  That is why the wireframe separates SEEDS from RAMPS: five seeds, six ramps.
- 6 ramps × 10 steps × 2 modes = **120 variables**, which is exactly what
  Export and CRUD 03 report.
- **The engine's `oklch` string carries a NEGATIVE hue** (`-100.1855` for the
  brand). The UI must normalise to 0–360 (`259.9`). This has already leaked into
  a Figma artefact: `Harmoni LCH Input`'s Hue variant ships `-100.1` as its
  default value.
- The sRGB chroma ceiling at the brand seed is **0.225** — independently
  computed here and matching the wireframe's own note.
- **8 of 10 brand steps sit at the sRGB ceiling** (granted < requested). A
  "gamut limited" flag computed as `granted < requested` is therefore true
  almost everywhere and reads as noise; it needs a threshold or a different
  presentation.
- `warning/600` is the only step across brand/warning/info/neutral that falls
  back to **`fg black`**, at 4.77:1 — the case `get_best_foreground`'s last
  resort exists for, and only visible when real ramps are rendered.

## 4. The Swatch, and the canvas insert

**THE BOX IS A SPECIMEN, NOT A COLOUR CHIP (2026-08-23).** The point of Harmoni
is that the engine finds a foreground that reads on each step, so the swatch has
to show that *literally*: the paired foreground painted **on** the colour. Before
this, `panel`'s Box was an empty 114 × 114 frame and the sample sat in the facts
row **outside** the colour, hidden by default — the component put the foreground
and the background side by side, which demonstrates nothing. Landed across all
30 variants.

- Three TEXT nodes: **`Sample`** ("Ag"), **`Source`** ("fg 900" — *which step*
  the foreground came from) and **`Grade`** ("AAA"). All take the paired
  foreground, which is **data, not a token** — the same category as the Box fill.
- **"Ag", not "Aa"** — cap height plus a descender is the full vertical extent;
  two x-height-ish forms are a weaker legibility test.
- Wired to `Show sample` / `Show source` + `Source#1940:229` / `Show grade` +
  `Grade#1940:535`, with `fontSize` bound to the new
  **`swatch/{size}/sample-size`** and **`/sample-caption-size`** (TDD'd through
  `swatch-sizing.test.ts` like `panel-cap`, aliased to `font-size.*`).
- **This revives the dead `Grade` property.** A plain TEXT inside the master can
  carry a `characters` ref; the nested `Badge` it replaces could not. Correction
  to an earlier note: `Grade#1940:535` was never dead on `row`, which already had
  a real TEXT wired — only on the five forms that used a Badge.
- **How much fits depends on the cap, and that is per form, on purpose.**
  `panel`'s square cap holds all three lines centred. `block` / `card` / `circle`
  have bar or circle caps (24–68px), so **only the `Ag` goes inside**, at caption
  size, and Source + Grade sit in the facts. `tile` and `row` already print their
  facts on the colour, so all three live there. A first pass gave every form the
  full stack and three of them overflowed — a 24px bar cannot hold a
  display-sized `Ag`. Don't "unify" this.
- **The grade takes the paired foreground, not a green/amber pill** — settled
  2026-08-23, "the foreground IS the signal". A failing pair looks bad, which is
  the demonstration; a pill would report a verdict the box is already making.

**Two gotchas this cost.** These TEXT nodes must be
`textAutoResize = 'WIDTH_AND_HEIGHT'` — on `HEIGHT` they keep whatever width they
were measured at, so changing `Aa` to `Ag` silently wrapped to two lines in every
variant. And **rebuilding the nodes clears the per-instance foreground fills**,
since the fill is an instance override on a node that no longer exists; re-apply
them after any master surgery.

`Harmoni / Swatch` — **4 forms × 5 sizes** (20 variants), 18 properties.

**The form list was cut from six to four (2026-08-23).** `block` and `card` were
**removed, not hidden**: they differed from `panel` only by cap size — which
`swatchSize` already controls and `swatch/{size}/panel-cap` already tokenises —
and from each other only by a border. Two near-identical entries in a select,
duplicating a slider that already exists. Checked first that the only instances
anywhere in the file were in the forms-comparison specimen. What remains are four
distinct layout ideas, and this is the list `SwatchExportConfig.form` offers:

| Form | Idea | Where the facts go |
|---|---|---|
| `panel` | colour dominant, facts below | all three specimen lines on the colour |
| `tile` | compact square, everything on the colour | on the colour |
| `row` | full-width bar, everything on the colour | on the colour |
| `circle` | a dot list, **vertical only** | beside the disc |

`circle` and `row` are **vertical-only** layouts, so **`form` constrains
`orientation`** — the same kind of dependency that retired
`stepLabels.placement`. The planner reads orientation from the form for those
two rather than taking it as input.

- **Only `row` and `tile` print inside the colour.** They take the paired
  foreground; `panel`, `block`, `card`, `circle` print on the page and keep the
  content ramp. Applying the foreground to all forms made every light foreground
  vanish on a white canvas — the insert routine must key the override off the
  form.
- **The grade badge label must be set per step.** On every non-`row` form the
  grade is a nested `Badge`; leaving it alone labels an AAA swatch "AA". A
  nested instance *can* be set by script — what cannot be done is bridging its
  property up to the parent panel.
- **Every colour box carries a `border/subtle` hairline.** Without it a
  near-white step (`#F0F5FF`) is invisible on a white canvas; on a saturated
  colour it disappears.
- **Nothing is dimmed on `row`/`tile`.** Opacity would undercut the readability
  the swatch exists to prove; hierarchy comes from the `code/*` size ramp.
- The ramp strip needs no separate component: it is `Form=row` with every fact
  toggled off. Use `Size=sm` — at ~33px wide, `md`'s radius 8 reads as a pill.
- **`panel`'s cap is square by locked aspect ratio**, not a pinned height, so it
  stays square at any width and needs no `cap-height` token.

**Canvas insert** (`/insert`): a frame of Swatch **instances**, never detached —
a detached instance stops tracking, so later token or geometry changes never
reach it. Consequence for the build: **the plugin must create the Swatch master
in the user's file on first insert and instance it from there**, which makes the
Figma component set a specification for a builder function, not a library the
user imports.

Ownership stamps, verified end-to-end on real inserted nodes:
`setSharedPluginData("harmoni", …)` on the ramp frame carries `project`, `kind`,
`ramp`, `mode` and the **appearance config as JSON** (so "update" can re-render
with the same settings); each swatch carries `step`, `value`, `oklch`.

`circle` only works as a vertical list — in a horizontal strip the facts column
collides with the next chip.

## 4a. Wording — "stamp" is internal, never user-facing

`setSharedPluginData("harmoni", …)` is a good name for what the mechanism does,
and the wrong word for a user. It is not about *when* (so never "timestamp") and
users need no noun for it at all. Every message it appears in reads better as a
sentence about Harmoni:

| don't write | write |
| --- | --- |
| variables with no stamp | variables that **weren't made by Harmoni** |
| every stamped variable still holds… | every variable **Harmoni manages** still holds… |
| no longer match their stamp | no longer match **what Harmoni wrote** |
| THE STAMP MAKES THIS VISIBLE | **ALL 120 VARIABLES** (label the counts, not our mechanism) |

Where a single word is genuinely needed — a Settings toggle, a menu item, a doc
heading — it is **"managed"**: "Harmoni-managed variables". That is the
established phrasing in tooling for this exact relationship, and it carries both
halves the stamp encodes: authorship *and* an ongoing claim. "Tracked" is vaguer
about by whom; "linked" implies a live connection that does not exist.

The row Tags never had the problem — `in sync` and `hand-edited` are plain. It is
only prose that leaks the internal term.

## 5. Destination

- **There is no createGroup API.** A group exists because variables are *named*
  `color/brand/500`, so "choose a group" is "choose a name prefix" — which is why
  `+ new…` belongs on COLLECTION and GROUP but never on INSIDE.
- Mode mapping is decided **on the destination screen**, not in a dialog after
  the write. That is what "asked once, gets the whole panel" buys.
- Compose three `Miller Columns / Column` instances directly. The composed
  `Miller Columns` set is 590px wide and carries a preview panel this view does
  not want.

## 6. Still to design

Every wireframed panel is now built. What is left has **no wireframe at all**,
so each needs settling before it is drawn:

- **The project switcher.** Its entry point exists (the Breadcrumb's project
  crumb) but there is no view behind it.
- **Loading / generating**, and **error** — write refused, missing permission,
  library-imported (`remote: true`) variables.
- **The canvas insert — settled 2026-08-23.** Design record: page **"Wireframes —
  Harmoni Plugin (canvas insert — exploration)"**, five panels plus a decisions
  frame. The *output* was already specified (RFC 0013 §3.2/§4.5 — config,
  planner, renderer, controls, Generate placement); only what that RFC could not
  answer was explored, and all of it is now signed off:
  1. **The canvas output is a view, pushed from Export** — not a fifth tab, not
     a second footer button. Export keeps one primary; the secondary pushes to a
     full view with a `‹ export` crumb, the route the picker already takes out
     of Palette. RFC 0013 assumed a 600px section with two `Switch`-headed
     cards; v3 has no such shell.
  2. **The controls are `SwatchExportConfig`, with three changes.** RFC 0013
     §3.2 needs all three.
     - **Grouping** — nine controls sized for 600px fit at 360 only as two Dense
       two-column cards above the preview.
     - **`value`** stops being a `'none' | 'hex' | 'oklch'` enum and becomes two
       booleans, so one swatch can print both. "None" is both off.
     - **`form` is added** (`tile | block | card | circle | row | panel`) and
       **`stepLabels.placement` is removed.** The config exposed `cornerRadius`,
       the smallest visual decision, while hard-coding the largest one; and
       inside-vs-below is a **property of the form**, not an independent axis —
       §4 says only `row` and `tile` print on the colour, and `panel` cannot
       print inside without becoming `tile`. The built view proved the overlap
       was real: `Inside` was selectable on a `panel` and silently did nothing.
       `shape` / `cornerRadius` stay — corner treatment genuinely is independent
       of form, and it is the taste knob the form axis is not.
  3. **O7 — the default is the contact sheet**: separate · rounded 4 · size 56 ·
     gap 8 · step labels below · **hex and oklch** · a11y badge auto · foreground
     swatch on · title on. The badge and paired foreground are free data the
     engine already carries, so a default that hides them spends nothing and
     proves nothing. **O7 is closed** — update RFC 0013's open-questions list
     when that RFC is next touched.
     **Amended 2026-08-23**, reversing the original "oklch off": the sheet is the
     artefact people hand around, and decision 01 of the whole plugin is that
     OKLCH is canonical, so a sheet printing only hex says hex is the truth. It
     is affordable only **wrapped to two lines** (`0.82 0.07` / `259.8`) —
     measured at `panel`/sm: hex alone is a 61 × 171 swatch; two-line OKLCH is
     68 × 200 (+7 px wide); bare one-line is 104 × 220; the full
     `oklch(0.82 0.07 259.8)` string is **146 × 262**, because the text node alone
     demands 132 px against a 63 px cap. Never print the unwrapped form on a
     swatch.
  4. **The preview is a canvas ground at 1:1, and it scrolls** rather than
     scaling — clipping with paddles, because the question it exists to answer is
     whether an 8px label reads on that fill.
  5. **Generate looks for a stamped frame before it draws one.** Found →
     *Update in place* / *Place a copy*, staleness read by comparing each
     swatch's stamped `value` to the palette. Nothing found → RFC 0013's original
     fresh frame at viewport centre. **This supersedes §4.5's "no clobber concern
     here"**, which was written before the ownership stamps existed.

  **Parked, deliberately — do not quietly assume either side.**
  `planSwatches` emits `PlacedNode[]` (RFC 0013 §5) so one plan renders to both
  DOM and Figma, which is what makes the preview *provably* identical to the
  output. §4 above requires the canvas frame to be Swatch **instances, never
  detached**, so later token and geometry changes still reach it. Both guarantees
  are real; one plan cannot produce both. Neither is load-bearing until code
  exists, so the first implementation forces the answer.

  **Still open:** `SwatchExportConfig` has **no mode field** — one mode previews
  fine, but "all modes" must choose between one frame per mode and one frame with
  two sections. And **O6**, drag-to-canvas: draw the handle, mark it a
  fast-follow, ship the button first.

Also outstanding: a **light-theme pass** over the view set. The built views are
dark and the `Harmoni / Panel Header` has a `Theme=light` variant, but a Figma
plugin follows the app's theme, so both are real. And `figma.currentUser` /
`figma.payments` both need explicit `permissions` entries in `manifest.json`.

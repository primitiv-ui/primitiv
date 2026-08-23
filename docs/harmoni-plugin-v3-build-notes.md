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
- **`content/muted` is not used for the plugin's own text.** Every label, value
  and note is `content/primary`; the muted role did not read well at 360px.

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

- **No context bar.** Settings is global, not project-scoped, so the project
  Breadcrumb is wrong here and is absent. The **tab bar stays, with no tab
  active** — that is what wireframe 05 draws, and it is what tells you the
  panel is still there behind the gear. Footer action is **Done**.
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
- Sections are separated by real `Divider` instances; the tab baseline serves
  as the first rule.
- **Still unsettled:** `soft_white` / `soft_black` are `GenerateOptions` inputs
  with no home in v3. DEFAULTS is now literally a `GenerateOptions` panel, so
  it is the obvious candidate — but wireframe 05 does not draw them, so do not
  add them without settling it.

## 2d. Canvas swatches — the view, built 2026-08-23

Built at 360 × **824** — it fits the window, and getting there is the point of
the layout below. Chrome follows the **pushed-view** template, copied
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
- **A `Switch` carries its own label** (`Show label#881:306` + `Label#881:265`),
  so every boolean row needs no separate label cell. That is what makes the
  second column viable at all: `Step labels` / `Hex value` / `OKLCH value` /
  `A11y badge` / `Ramp title` / `Foreground swatch` are self-describing controls,
  not label-plus-control pairs. Splitting `value` into two booleans **shortened**
  the card — the three-option Segmented Control it replaced needed a label above
  it and a full-width row of its own.
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
  for the copy: the `Light` / `Dark` chip means **"which ramp values"**, never
  "what colour the canvas is" — word it so that reads.
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

**Read `docs/rfcs/0013-configurable-palette-export.md` §3.2 / §4.5 and
`docs/plugin-ui-design-guide.md` §5 before designing anything here.** They are
the spec for the canvas output and predate this document: `SwatchExportConfig`
and its full control list, the pure `planSwatches` planner, the
`CanvasRenderer` port (one plan, two renderers — DOM preview and Figma nodes),
the style-controls-above-a-live-preview layout, and Generate → current page at
`figma.viewport.center`, selected and scrolled into view. What is below is the
*Figma component* side of that, not a second spec.

`Harmoni / Swatch` — 6 forms × 5 sizes, 18 properties.

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
  2. **The controls are `SwatchExportConfig`, with one change.** Grouping —
     nine controls sized for 600px fit at 360 only as two Dense two-column cards
     above the preview — and **`value` stops being a `'none' | 'hex' | 'oklch'`
     enum and becomes two booleans**, so one swatch can print both. "None" is
     both off. RFC 0013 §3.2 needs that edit.
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

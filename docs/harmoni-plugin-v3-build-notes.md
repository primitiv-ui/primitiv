# Harmoni plugin v3 — carry-over notes for the code build

Facts established while designing the v3 views in Figma (2026-08-22) that the
TDD build will need and cannot re-derive cheaply. The **spec** is the Figma page
"Wireframes — Harmoni Plugin (v3 — settled)"; this file is what building the
real views against that spec taught us.

Design set: page **"Harmoni Plugin — Views (v3 design)"** — Palette, Picker,
Export, Setup, Destination. Components: `Harmoni / Panel Header`,
`Harmoni / Swatch`, `Harmoni / Axis Slider`.

## 1. Window and chrome — measured, not guessed

- **`figma.showUI({ width: 360, height: 700 })`.** Palette with all six ramps
  needs 700; the picker measures 687. One window height serves both, so don't
  ship two.
- **Density is Dense**, baked into `Harmoni / Panel Header`. At Comfortable the
  header alone is 57px; at Dense it is 33px with 16px controls. Every v3 view is
  360 wide, so Dense is not a preference.
- Chrome costs **103px**: header 33 + tab bar 33 + footer 37. That leaves ~597px
  of body. The ten-row detailed ramp is 292px of it, which is why Palette shows
  strips and only the canvas insert shows detailed rows.
- **The chrome is `Harmoni · <context>` plus a gear. Nothing else.** No project
  Select, no theme toggle, no expand control — those belong to the OLD 600/960px
  app (`Harmoni App Header`, `Harmoni App Container`) and must not be carried over.
- **The second slot is contextual, not "the project".** CRUD panels show the
  project (`Harmoni · primitiv`); the picker shows the ramp (`Harmoni · brand`);
  first run shows bare `Harmoni`. The component models this as a `Project` TEXT
  plus a `Show project` BOOLEAN — both direct children, so unlike a nested
  Select they *are* settable from the parent's property panel.
- **The tab bar only exists once a project is bound.** Setup and Destination
  have none.

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

**Open question the wireframes do not answer:** the soft white / black anchors
appear in the old 600px app but on no v3 panel. They are real
`GenerateOptions` inputs, so they need a home — most likely Settings. Do not
invent a place for them without settling it.

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

From the wireframes: the in-sync return visit and the drift case (CRUD 03–04),
Roles (panel 03), Audit (panel 04), Settings (panel 05).
With no wireframe at all: **loading/generating, error** (write refused, missing
permission, remote variables), and the **project switcher**.

Also outstanding: dark-theme copies of the view set (a Figma plugin follows the
app's theme, so both are real), and `figma.currentUser` / `figma.payments` both
need explicit `permissions` entries in `manifest.json`.

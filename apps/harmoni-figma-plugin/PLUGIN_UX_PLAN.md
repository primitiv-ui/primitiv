# Harmoni Plugin — UX Plan (v1)

Design decisions and rationale for the plugin's user experience.
This is a living document — update it as decisions are revisited.
Past direction is preserved in **Appendix A** so the history isn't
lost.

---

## v1 reset — direction

Inspired by SupaPalette: **one compact screen, no navigation, live
feedback on every input, a tight focused control set.**

Harmoni's value-adds over SupaPalette — the brand↔neutral
relationship, accessible contrast surfaced at every swatch, and
tinting the neutral ramp — stay first-class without re-introducing
screen sprawl.

### Decisions (this session)

| Decision | Choice |
|---|---|
| Projects → project two-step | **Slim header-level project picker** — no landing page |
| Brand scope (v1) | **Single brand colour** |
| Light vs dark | **Both ramps shown at once** (workbench-style) |
| Lightness curve | **Always inline**, no Sliders/Curve tab |
| Sub-screens 2a/2b/2c/5/6 | **Removed** — controls live inline on the single screen |
| Apply collection picker overlay | Removed — flatten into inline output controls |
| Plugin canvas width | **Decide later** — design width-agnostic, pick a width once the control inventory is settled |

### Why these choices

- **Compact + no nav** keeps the plugin a *sidekick* to the Figma
  canvas, not a takeover.
- **Live feedback** means there's no "preview vs apply" split for
  the in-plugin experience; Apply only writes to the Figma file.
- **Single brand colour** is a deliberate v1 scope cut — it
  matches SupaPalette's mental model and defers the
  multi-colour-management UI until the single-colour experience is
  excellent.
- **Both ramps shown** preserves the spatial relationship between
  light and dark; this is something the workbench prototype proved
  works.

---

## Single-screen control inventory

The plugin renders **one screen at `/`**. Vertical stack,
top → bottom:

1. **Header strip**
   - Plugin title.
   - Project picker (popover / dropdown).
   - Small overflow menu (settings, help).
   - No back button anywhere.
2. **Neutral block**
   - White + Black hex pickers, side by side.
   - Tint source + strength slider, **inline, conditional** (only
     when a tint source has been set). Includes inline "Remove tint".
   - Neutral **light** ramp — 10 swatches, live contrast ratio +
     AA/AAA badge inside each.
   - 10-step lightness curve sliders directly under the light ramp.
     Always visible. No mode switch.
   - Light padding slider + shift left/right buttons.
   - Neutral **dark** ramp — same treatment.
   - Dark lightness curve sliders, always visible.
   - Dark padding slider + shift buttons.
3. **Brand block** (single brand colour)
   - Brand hex picker.
   - "Use as neutral tint" toggle / button.
   - Brand light ramp + inline curve sliders + padding + shift.
   - Brand dark ramp + inline curve sliders + padding + shift.
4. **Output zone** — has two states:
   - **Default state** — output mode toggles (canvas swatches /
     colour variables), each card carries a small "Configure ›"
     affordance when its toggle is on. Target collection summary
     inline. Single primary Apply button.
   - **Detail state** — clicking "Configure ›" on either output
     replaces the zone body with a detail view scoped to that
     output. The zone header changes to a breadcrumb
     (e.g. `‹ Apply ▸ Canvas swatches`) acting as the back
     affordance. **Everything above the zone — palettes, pickers,
     curves, padding — stays visible and interactive.** The Apply
     button remains in the zone so the user can apply from inside
     a detail view.
   - **Canvas swatches detail** controls: layout direction
     (horizontal / vertical), shape (square / round), step
     number labels (on/off), accessibility badges (on/off), live
     preview of the rendered output.
   - **Colour variables detail** controls: target collection
     picker, naming pattern (`brand-500` / `brand/500` /
     `Brand 500`), what to write (light only / dark only / both
     as mode-bound variables), preview list of the variables
     that will be created or updated.

Every input is **live**: changing any value regenerates affected
ramps immediately. There is no preview-vs-apply split.

---

## v1 layout principles

- **One screen, no routes.** The `MemoryRouter` scaffolding in
  `apps/harmoni-figma-plugin/src/ui/` stays in place; v1 mounts a
  single screen at `/`.
- **Vertical scroll over horizontal compression.** With a single
  brand colour and 4 ramps (neutral light/dark, brand light/dark),
  scrolling inside the plugin window is fine and feels
  SupaPalette-like.
- **Inline > expand > zone-scoped detail > modal.** Most state
  changes inline (tint controls appear/disappear, picker dropdowns).
  The output zone is the one place where the controls have enough
  surface area to need a dedicated view — there it uses a
  zone-scoped detail state (see "Output zone" above) rather than a
  modal overlay or a real route change. The rest of the screen stays
  visible while a detail view is open.
- **Width-agnostic wireframing.** Author wireframes in terms of
  control groups + stacking order. Render at multiple widths
  (320 / 400 / 480) and pick the narrowest width that fits the
  inventory without crowding.
- **Workbench is the behavioural reference.**
  `apps/workbench/src/ColorEngine.tsx` already proves the
  brand↔neutral↔tint↔contrast flow end-to-end against the same
  harmoni-wasm functions (`generate_neutral_ramp`,
  `generate_palette_pair`, `tint_neutrals`). Reuse the mental
  model — only the visual layout is being redesigned.

---

## Navigation model — routing

| Route | Screen |
|---|---|
| `/` | Single working screen (header + neutral block + brand block + output strip) |

The previous two-route model (`/` projects + `/project/:id` editor)
is superseded. Project selection happens via the in-screen header
picker.

---

## Wireframe scripts

Paste into the Figma developer console
(`Plugins → Development → Open console`). Type `allow pasting` once
per session before pasting. See the `figma-console-scripts` skill
for the full process and API reference, including the **versioned
naming convention** described below.

### Naming convention

Every wireframe script and the page it creates **must include a
version segment** (e.g. `v1`, `v2`, …) so future iterations don't
overwrite or shadow earlier ones. As the design evolves we bump
the version; older versions remain in git history but the active
scripts on disk only carry the current version's prefix.

| Surface | Pattern | Example |
|---|---|---|
| Filename | `create-<version>-<subject>-wireframes.js` | `create-v1-output-detail-wireframes.js` |
| Figma page name | `Wireframes — Harmoni Plugin (<version>[ — <subject>])` | `Wireframes — Harmoni Plugin (v1 — output detail)` |

When the design crosses a version boundary, delete the previous
version's scripts from disk (git history preserves them) and start
a fresh set under the new prefix.

### Current scripts (v1)

| Script | What it renders |
|---|---|
| `scripts/create-v1-wireframes.js` | Single-screen plugin at widths 320 / 400 / 480, plus one "tint active" variant. |
| `scripts/create-v1-output-detail-wireframes.js` | Three 480px frames showing the output zone in each of its three states: default (with "Configure ›" affordances visible), canvas swatches detail, and colour variables detail. Top half of the screen is identical across all three frames to communicate that the rest of the UI doesn't change. |

---

## Iteration log

The format for each entry:

```
### YYYY-MM-DD — short title
**Width tried:** …
**Changes from previous:** …
**What felt right:** …
**What didn't:** …
**Next experiment:** …
```

### 2026-05-22 — v1 reset + width decision

**Width tried:** 320 / 400 / 480 (rendered side by side via
`create-v1-wireframes.js`).
**Changes from previous:** Replaced the 9-screen v0 design with a
single-screen layout. Dropped projects landing; project picker
moves into the header. Curve sliders inline at all times. Single
brand colour. Both light and dark ramps shown simultaneously.
**What felt right:** **480px is the chosen width.** At 320px and
400px the curve sliders + step labels + contrast badges inside the
swatches felt cramped; at 480px everything breathes and the
SupaPalette-sidekick feel is still preserved (not a takeover).
**What didn't:** The output strip can't realistically hold the
controls each output needs (canvas swatches: shape, layout, labels,
badges, preview; variables: collection, naming, modes, preview).
The inline "collection summary + Apply" treatment is too thin.
**Next experiment:** Introduce a **zone-scoped detail state** in
the output area — see the 2026-05-22 (output zone exploration)
entry below.

### 2026-05-22 — output zone exploration

**Width tried:** 480px (single — width is now settled).
**Changes from previous:** Output strip becomes a stateful "zone"
with three states: default (toggles + Configure affordances +
Apply), canvas swatches detail (layout/shape/labels/badges/preview),
colour variables detail (collection/naming/modes/preview). Detail
states replace the zone body only; palettes and controls above
remain visible. The zone header acts as breadcrumb + back.
**What felt right:** _(fill in after review in Figma)_
**What didn't:** _(fill in after review in Figma)_
**Next experiment:** _(fill in after review in Figma)_

### 2026-05-22 — housekeeping: versioned script naming, v0 scripts removed

**Width tried:** n/a (housekeeping).
**Changes from previous:** Deleted the five v0 scripts
(`create-wireframes.js`, `create-apply-wireframes.js`,
`create-swatch-config-wireframes.js`,
`create-neutral-detail-wireframes.js`,
`create-wide-wireframes.js`) — preserved in git history, not on
disk. Established a versioned naming convention for both script
filenames (`create-v1-…`) and the Figma page names they create
(`Wireframes — Harmoni Plugin (v1 …)`) so future iterations are
trackable through time. Convention documented in the
`figma-console-scripts` skill.
**What felt right:** _(n/a — housekeeping)_
**What didn't:** _(n/a — housekeeping)_
**Next experiment:** Continue the v1 iteration. Likely candidates:
empty / disabled output state, collection-dropdown open state,
post-apply feedback, header overflow menu contents,
new-project / empty-state flow.

---

## Feature inventory

| Feature | Status |
|---|---|
| Neutral ramp — White/Black pickers | v1 |
| Neutral ramp — preview (10 swatches, contrast info) | v1 |
| Neutral light + dark together | v1 |
| Inline lightness curve sliders (light + dark) | v1 |
| Light/dark padding sliders + shift buttons | v1 |
| Brand colour (single) | v1 |
| Brand → neutral tint (`tint_neutrals`) | v1 |
| Header-level project picker | v1 |
| Apply to Figma — canvas swatches output | v1 |
| Canvas swatches detail — layout (horizontal / vertical) | v1 |
| Canvas swatches detail — shape (square / round) | v1 |
| Canvas swatches detail — step labels toggle | v1 |
| Canvas swatches detail — a11y badges toggle | v1 |
| Canvas swatches detail — live preview | v1 |
| Apply to Figma — colour variables output | v1 |
| Variables detail — target collection picker | v1 |
| Variables detail — naming pattern | v1 |
| Variables detail — modes (light / dark / both) | v1 |
| Variables detail — preview of variables to be written | v1 |
| Multiple brand colours per project | deferred |
| Derive soft neutrals from brand (`derive_soft_neutrals`) | deferred |
| Project save / management UI beyond the picker | deferred |
| Settings | deferred |

---

## Appendix A — v0 plan (superseded)

The original plan specified 9 wireframe screens (1, 2, 2a, 2b, 2c, 3,
4, 5, 6) at 640×800px with a separate Projects landing page,
sub-screens for the curve editor, padding, swatch style, and Apply,
and an overlay collection picker. This is preserved below for
history; **do not implement against this section** — use the v1
sections above.

### A.1 — Original plugin dimensions

**Width: 360px.** Narrow enough to sit alongside the Figma canvas
without dominating it. All layout single-column; height scrolls.

(Width was later raised to 640px in the wireframes when sub-screens
made the single column too cramped; v1 reverts to a single-screen
approach and re-opens the width question — see "v1 layout
principles" above.)

### A.2 — Original structure

- Top level: dedicated **Projects** screen (landing) — full-screen
  list of client brand projects.
- Inside a project: sections stacked vertically, scrolled; no tabs,
  no accordion.

Rationale (preserved): sidebar rejected at 360px because it eats
120–160px of working width; top dropdown rejected because it can't
surface rich project previews.

v1 supersedes the projects screen with a header-level picker — see
"Single-screen control inventory" above for the new shape.

### A.3 — Original screen inventory (9 screens)

| Screen | Purpose |
|---|---|
| 1 | Projects landing (list with chips, palette counts, dates) |
| 2 | Project view — Neutral section, basic colour pickers |
| 2a | Project view — enhanced colour picker cards |
| 2b | Project view — lightness curve editor (Sliders / Curve tabs) |
| 2c | Project view — padding sliders |
| 3 | Apply: choose outputs (initial state, Apply disabled) |
| 4 | Apply: colour variables checked + collection picker open |
| 5 | Apply: swatch style configuration (shape, step numbers, a11y badges) |
| 6 | Canvas output preview on a dark Figma background |

ASCII wireframes for each screen are preserved in git history (see
the version of this file immediately prior to the v1 reset commit).

### A.4 — Apply to Figma — original design notes

Two separate output actions:

1. **Generate canvas swatches** — places visual swatch frames on
   the active Figma page.
2. **Generate colour variables** — writes variables into a chosen
   collection.

Variable collection picker was originally specified as a **modal
overlay** using a Tree / Miller Columns component. v1 replaces this
with an **inline popover** attached to the Apply control — see
"Single-screen control inventory" above.

### A.5 — Original routing

| Route | Screen |
|---|---|
| `/` | Projects (landing) |
| `/project/:id` | Project view (Neutral + Brand sections) |

Superseded — see "Navigation model — routing" above for the v1
single-route model.

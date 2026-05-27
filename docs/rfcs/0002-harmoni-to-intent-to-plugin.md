# RFC 0002 — Harmoni → Intent → Plugin

> **Status:** Phase B complete — Phase C next
> **Author:** simonrevill, with architectural review
> **Date:** 2026-05-27
> **Relates to:** RFC 0001 (Token Architecture), specifically §11 Phase 5
> and §13.5 (the deferred Harmoni → intent wiring)

---

## 0. Summary

RFC 0001 stopped at the doorstep of real colour values. The token
architecture is in place — primitives, context, anatomy, interaction,
and a Button shell — but every intent token is a placeholder pointing
at the existing `color.gold.*` / `color.red.*` ramps. The blocker is
that the Harmoni palette engine, while substantially built (Steps
C/D/A/B per the `harmoni-architecture-history` skill), has no live
consumer producing usable Figma variables.

This RFC describes the path from "Harmoni is a Rust + wasm engine
with a workbench prototype UI" to "the Primitiv token system carries
real values produced by Harmoni." It is three phases:

1. **Phase A — Throwaway prototype.** Port the workbench's
   `ColorEngine.tsx` + `useColors.ts` directly into the
   `apps/harmoni-figma-plugin` UI. Wire ramp generation, on-canvas
   swatches, and **Figma variable writes**. No TDD, no UX polish.
   Goal: produce a Figma file containing harmoni-generated palette
   ramps as live variables.
2. **Phase B — Intent layer wiring.** With harmoni-produced palette
   variables in Figma, author the `Intent / Light` collection (and
   `Intent / Dark` when ready) per RFC 0001 §4. Each intent variable
   aliases into a harmoni-produced palette ramp. Completes RFC 0001
   Phase 5.
3. **Phase C — Plugin proper rebuild.** Throw Phase A away. Rebuild
   the harmoni plugin from the existing `PLUGIN_UX_PLAN.md` and
   `NEUTRAL_PALETTE_TDD_PLAN.md` as a strict-TDD ports-and-adapters
   build. This rebuild also subsumes the deferred Button states
   (RFC 0001 §8 / §9) so that hover/active/focus/disabled and
   intent-backed colours land in one cycle rather than two.

Phase A is the cheapest path to unblocking Phase 5 of RFC 0001.
Phase C is the path to a production-grade plugin.

---

## 0.1 Why a separate RFC

RFC 0001 names Phase 5 ("Harmoni → intent") as a single line and
defers the detail to "the Harmoni README." That deferral is the
right call for the token architecture — but the work itself spans
the plugin app, the engine consumption surface, and the Intent
layer, and is large enough to warrant its own ordering. The two
RFCs are coupled: RFC 0002 Phase B is RFC 0001 Phase 5.

---

## 1. Principles

These are the rules that distinguish Phase A from Phase C and keep
the throwaway phase honest.

### Principle 1 — Phase A is allowed to be ugly. Phase C is not.

Phase A's only acceptance criterion is **the engine produces stable
Figma variables we can alias from Intent**. Visual design,
accessibility, keyboard handling, and code quality are explicitly
out of scope for Phase A.

### Principle 2 — Phase A is allowed to skip TDD. Phase C is not.

The workbench prototype already exists and works. Porting it
verbatim with light edits is faster than rebuilding it test-first,
and Phase C will replace every line anyway. **Phase C ships
strict-TDD per CLAUDE.md** — red → green → refactor, one cycle per
commit, 100% coverage.

### Principle 3 — Throwaway means throwaway

When Phase C starts, Phase A's UI code is deleted, not refactored.
The directory `apps/harmoni-figma-plugin/src/ui` is wiped and
rebuilt against the existing `PLUGIN_UX_PLAN.md` and
`NEUTRAL_PALETTE_TDD_PLAN.md`. The only thing Phase A leaves behind
that survives is **the Figma file state it produced** — the
palette ramp variables themselves.

### Principle 4 — One plugin, two responsibilities, clearly named

The harmoni plugin becomes responsible for:

- Reading user input (white + black + brand colour).
- Calling the Harmoni wasm engine to produce ramps.
- Writing the resulting ramps as Figma variables into a target
  collection.

The sync plugin (`apps/primitiv-sync-figma-plugin`) keeps doing
what it already does: DTCG export and structural bootstraps. There
is no hand-off between the two plugins. The figma-token-sync skill
notes "anything to do with token extraction, DTCG shaping, or repo
writes belongs in this stack, not in the Harmoni plugin" — this
RFC adds: **palette generation and the palette → variable write
belong in the Harmoni plugin, not the sync stack.** Both plugins
write variables, but to disjoint surfaces.

---

## 2. Phase A — Throwaway prototype

### 2.1 Goal

The user opens `apps/harmoni-figma-plugin` in Figma, picks white +
black + brand colours, and clicks Apply. After Apply, the Figma
file contains live variables for every step of the neutral light,
neutral dark, brand light, and brand dark ramps. These variables
are aliasable from the Intent layer.

That is the whole goal. No more.

### 2.2 What gets moved

From `apps/workbench/src`:

- `ColorEngine.tsx` (~248 lines) — the prototype UI component.
- `useColors.ts` (~219 lines) — the state/effects hook driving the
  engine.
- Any constants / types those two files transitively pull in.

Into `apps/harmoni-figma-plugin/src/ui` as a new screen behind the
existing router (the plugin already has `engine.ts` wiring
`harmoni-wasm`; that wrapper survives).

The migration is **mechanical**. Pre-existing hooks, prop shapes,
and naming all carry over verbatim. Where the workbench used a
`localStorage`-style persistence layer, Phase A drops persistence
entirely — the user reconfigures on each open.

### 2.3 What gets added

One write-side action: **Apply palette to Figma variables.**

- Inputs: the four ramps the engine produces (neutral light,
  neutral dark, brand light, brand dark), each ~10 swatches.
- Behaviour: find-or-create a target collection (working name:
  `Primitives / Palette`, single-mode), then find-or-create one
  `COLOR` variable per swatch. Idempotent per RFC 0001 §15.6 — same
  `findOrCreateCollection` / `findOrCreateVariable` helpers the
  sync plugin already exposes (see
  `apps/primitiv-sync-figma-plugin/src/code/figmaIdempotent.ts`).
  Phase A may simply re-implement these inside the harmoni plugin
  rather than extract a shared package; extraction can happen in
  Phase C if it earns its keep.
- Naming: `color/<ramp>/<step>` where `ramp ∈ {neutral-light,
  neutral-dark, brand-light, brand-dark}` and `step ∈ {50, 100,
  …, 900}` (or whatever step set the engine emits).
- Each variable is a literal hex value, not an alias. The engine
  produced the value; nothing higher up wants to override it.

The exact collection name and step set are deliberately
**non-binding** for Phase A. If Phase C decides on a different
shape, the variables get renamed or moved at that point.

### 2.4 What stays untouched

- The sync plugin. Its `Bootstrap context` and `Bootstrap
  interaction` actions are unaffected.
- `packages/tokens` and the DTCG export. The new palette variables
  will show up in `primitives.json` on the next sync, under
  whatever collection they were written to.
- The Button. Its colour bindings still point at the old
  `color.gold.*` / `color.red.*` primitives. Phase A does not
  touch the Button.
- The React component library (`packages/react`). Phase A does
  not need it.

### 2.5 Acceptance

Phase A is done when:

1. ✅ The harmoni plugin opens, accepts the three colour inputs, and
   shows ramps on screen.
2. ✅ Apply writes variables into Figma. *(code complete; live
   smoke-test pending)*
3. ⬜ A subsequent run of the sync plugin's Export tokens picks the
   new variables up and writes them into `primitives.json` (or
   wherever they were routed) without crashing.
4. ⬜ The variables can be aliased from a hand-authored test
   variable. This is the precondition for Phase B.

Acceptance is **smoke-test level**. No unit tests are required.

Items 3 and 4 are the remaining Figma-side verification steps before
Phase B can start.

---

### 2.6 Phase A — Delivered 2026-05-27

Commit `05f9d17` on `main`. What was built and where it diverged from
the plan:

**Files added to `apps/harmoni-figma-plugin/src/ui/`:**

- `types.ts` — `BrandConfig` (one brand colour, not the eight in the
  workbench — see deviation below).
- `constants.ts` — `DEFAULT_LIGHTNESS`, `DEFAULT_DARK_LIGHTNESS`,
  `DEFAULT_BRAND_HEX`.
- `Swatch.tsx`, `Palette.tsx` — swatch and palette row display,
  ported verbatim.
- `useColors.ts` — hook driving the engine. Uses `initEngine()` from
  `engine.ts` instead of bare `init()` so the wasm binary is passed
  as a data URI (required inside Figma's single-file iframe).
- `ColorEngine.tsx` — three colour pickers (white / black / brand),
  neutral ramp, brand-light and brand-dark ramps, tint controls,
  independent padding sliders per ramp, Apply and Close buttons.

**Files added to `apps/harmoni-figma-plugin/src/code/`:**

- `figmaIdempotent.ts` — find-or-create helpers, re-implemented
  locally (§7 question 3 — re-implement now, extract in Phase C if
  it earns its keep).
- `applyPalette.ts` — writes `color/neutral/<step>`,
  `color/brand/light/<step>`, `color/brand/dark/<step>` into the
  `Primitives / Palette` collection (resolves §7 question 1).

**Files modified:**

- `shared/messages.ts` — `RgbaColor`, `SwatchData`, `RampData` types;
  `apply-palette` message variant added to `UiMessage`.
- `code/handleMessage.ts` — now async; routes `apply-palette` →
  `applyPalette()`.
- `ui/App.tsx` — replaced placeholder greeting with `<ColorEngine />`.
- `ui/App.test.tsx` — updated to mock `ColorEngine`; old greeting
  tests removed.
- `code/handleMessage.test.ts` — added `apply-palette` delegation
  test. `handleMessage.ts` remains at 100% coverage.
- `vitest.config.ts` — Phase A files excluded from coverage per
  Principle 2.

**Deviations from §2.2:**

- **One brand colour instead of eight.** The workbench had eight
  named hues; Phase A simplifies to a single brand input. This is
  intentional — the goal is palette variables for the intent layer,
  not a full colour picker. Phase C will surface the richer input if
  needed.
- **`generate_palette_pair` called twice.** To give the brand-light
  and brand-dark ramps fully independent padding sliders (four
  sliders total: left + right per ramp), `regenerateBrand` calls
  the engine once per ramp and uses `.light` from the first call
  and `.dark` from the second. The ramps are generated with their
  own padding pair rather than sharing a single pair.
- **oklch → RGBA conversion via canvas.** The sandbox cannot call
  browser APIs, so swatches are converted to `{ r, g, b, a }` in
  the UI iframe using `CanvasRenderingContext2D.getImageData` before
  the `apply-palette` message is posted.
- **Lightness curve editor not ported.** The workbench `CurveEditor`
  (per-step lightness sliders for each ramp) was left out. The
  default lightness curve is sufficient to produce Figma variables
  for Phase B; the curve editor is a Phase C concern.
- **Shift left / right buttons not ported.** Same rationale — not
  needed for the Phase B precondition.

---

## 3. Phase B — Intent layer wiring

### 3.1 Goal

Author `Intent / Light` (and later `Intent / Dark`) in Figma, with
every variable aliased to one of the harmoni-produced palette
ramp variables from Phase A. This is exactly RFC 0001 §4 read in
order, with real targets behind the aliases at last.

### 3.2 Work

1. Define a tier-2 plugin action **Bootstrap Intent / Light** in
   the sync plugin (next to Bootstrap context / Bootstrap
   interaction). It creates the collection and the variables per
   RFC 0001 §4 pattern set: `action.*` (primary / secondary /
   danger × default / hover / active / disabled, plus foreground
   and border), `surface.*`, `content.*`, `border.*`, `focus.ring`.
2. Each variable aliases into a Phase A palette variable. Mapping
   table is part of the action's spec module (similar to
   `interactionSpec.ts`).
3. Run the action. Export tokens. Commit the regenerated
   `semantic.json`.

Dark mode follows the same shape; either ships as a second
collection (`Intent / Dark`) per RFC 0001 §10.1, or waits for the
Figma Pro upgrade where it becomes a second mode of a single
`Intent` collection (§10.4).

### 3.3 Acceptance

- `Intent / Light` exists in Figma with the full §4 pattern set.
- Every intent variable is an alias into a Phase A palette
  variable. Changing a palette variable propagates through the
  intent layer end to end.
- `dtcg.ts` exports `semantic.color.action.*`, `semantic.color.
  surface.*`, etc. (or under whichever root key §13.1 resolves to).
- RFC 0001 Phase 5 flips from ⬜ to ✅.

---

### 3.4 Phase B — Delivered 2026-05-27

Commits `5aa9fcc`, `1237f21`, `ff12824` on `main`. Three TDD cycles:

**Files added to `apps/primitiv-sync-figma-plugin/src/code/`:**

- `intentLightSpec.ts` — pure data: `INTENT_LIGHT_SPEC` with collection name
  (`Intent / Light`), alias source (`Primitives / Palette`), and 46 variables
  covering `action.{primary,secondary,danger}.{states,foreground,border}`,
  `surface.*`, `content.*`, `border.*`, `focus.ring`. Danger targets
  `color/danger/light/*` — produces expected warnings until a danger ramp lands.
- `bootstrapIntentLight.ts` — idempotent action mirroring `bootstrapInteraction`:
  finds `Primitives / Palette`, find-or-creates `Intent / Light`, creates/updates
  all COLOR alias variables, warns on missing targets.
- `bootstrapIntentLight.test.ts` — 6 tests covering all behaviours.

**Files modified:**

- `shared/messages.ts` — `BootstrapIntentLightResult` type; new `UiMessage` and
  `SandboxMessage` variants for the intent light action.
- `code/handleMessage.ts` — new `bootstrap-intent-light-request` routing case.
- `code/handleMessage.test.ts` — 2 new routing tests.
- `ui/App.tsx` — Bootstrap Intent / Light button, state, and `IntentLightSummary`.
- `ui/App.test.tsx` — 4 new UI tests. Total suite: 98 tests.

**Remaining work before RFC 0001 Phase 5 can be ticked ✅ (Figma-side verification):**

1. ✅ Run **Bootstrap Intent / Light** in the sync plugin. Result: 38 variables
   created, 8 danger warnings (the 2 danger foreground variables alias into
   `color/neutral/*` and created successfully; only the 8 background/border
   danger variables need the missing `color/danger/light/*` ramp).
2. Verify aliases propagate: change a palette variable → intent layer reflects it.
3. Run **Export tokens** to confirm `dtcg.ts` picks up `Intent / Light` and routes
   it to `semantic.json`.

---

## 4. Phase C — Plugin proper rebuild

### 4.1 Goal

A production-grade harmoni plugin. The UX target is already
defined in `apps/harmoni-figma-plugin/PLUGIN_UX_PLAN.md`. The
test architecture is already defined in `apps/harmoni-figma-plugin/
NEUTRAL_PALETTE_TDD_PLAN.md` (ports-and-adapters, three testing
layers, fake `HarmoniApiPort`). Phase C is "execute those plans."

### 4.2 What changes vs Phase A

- **Strict TDD** throughout. Red → green → refactor, one cycle per
  commit, 100% coverage. CLAUDE.md applies the same way it does
  to the rest of the project.
- **Real architecture.** Ports and adapters per the TDD plan; no
  direct wasm calls from components.
- **Real UX.** The single-screen compact layout from
  `PLUGIN_UX_PLAN.md`. Live feedback on every input. Both ramps
  visible at once. Inline lightness curves. Brand block.
  Output controls.
- **Plugin component library.** The plugin builds its own
  purpose-specific controls — `ColourPicker`, `PaletteRamp`,
  `SwatchChip`, `LightnessCurve`, etc. These are *plugin
  components*, not headless library components in `packages/
  react`; they live in `apps/harmoni-figma-plugin/src/ui`. They
  consume the design tokens (now intent-backed) for their own
  visual treatment.
- **Button rebuild (RFC 0001 §9).** Because the intent layer now
  carries real values, the Button is rebuilt with:
  - States bound to `interaction.*` (hover / active / disabled
    opacity, focus ring width / offset).
  - Per-variant colours bound to `color.action.{primary,
    secondary, danger}.*`.
  - The variant × size × context cell grid stays as-is; the
    states axis (4 cells) goes on top, taking the total to ~480
    cells per the §13.10 estimate. Whether that pushes the
    single-master shape past a workable ceiling is settled
    inside Phase C, not pre-emptively here.

### 4.3 What gets thrown away

Everything in `apps/harmoni-figma-plugin/src/ui` that originated
from the Phase A port. `engine.ts` (the wasm-init wrapper) is the
only file that survives unchanged.

### 4.4 What survives intact

- The Figma file state. Every palette variable, intent variable,
  text style, and component instance.
- `packages/tokens` and the DTCG export.
- The sync plugin (`apps/primitiv-sync-figma-plugin`).
- RFC 0001 in full.
- `PLUGIN_UX_PLAN.md` and `NEUTRAL_PALETTE_TDD_PLAN.md` — these
  guide Phase C; they are *not* throwaway docs.

### 4.5 Acceptance

- Plugin runs to the UX described in `PLUGIN_UX_PLAN.md`.
- All non-trivial logic is TDD-driven with 100% coverage.
- Button has hover / active / focus / disabled states and
  intent-backed colours.
- A new design-system component (the canonical example in RFC 0001
  §14: "when a designer adds a new framed control like
  `SearchInput`, the only token additions should be `components.
  search-input.*`, and they should be pure references") can be
  added without any structural token work.

---

## 5. Order of operations and dependencies

```
Phase A ────────► Phase B ────────► Phase C
  │                 │                 │
  │ unblocks        │ unblocks        │ also delivers
  ▼                 ▼                 ▼
harmoni-produced  intent layer in   button states +
palette vars      Figma (RFC 0001    plugin component
in Figma          §4 / Phase 5)      library
```

Phases are sequential. Phase B cannot start until Phase A produces
stable palette variables. Phase C cannot start until Phase B has
the intent layer wired (otherwise the rebuilt Button has nothing
real to bind to). The Phase A → Phase B handoff is the only place
where wall-clock effort needs careful sequencing; Phase A → C is a
hard reset.

---

## 6. What this RFC explicitly does not cover

- **Multi-brand support.** Single brand colour for v1 per the
  `PLUGIN_UX_PLAN.md` decision. Multi-brand is a future RFC.
- **Production palette algorithms.** The Harmoni engine itself —
  its lightness curves, tinting, padding model — is settled per
  the `harmoni-architecture-history` skill. This RFC consumes the
  engine; it does not redesign it.
- **Component implementations in `packages/react`.** That is the
  long-term home of headless library components (Input, Select,
  Combobox, etc.), but those land *after* the plugin proves the
  end-to-end token chain. Phase C is the right time to start them;
  this RFC names that as a hand-off, not a deliverable.
- **CSS variable / Tailwind / Style Dictionary output.** Still
  out of v1 scope per RFC 0001 §0.1. Phase 7 of RFC 0001
  (deferred) covers it.

---

## 7. Open questions

1. ✅ **Target collection for Phase A palette variables.** Resolved:
   `Primitives / Palette`, single-mode. Variables named
   `color/neutral/<step>`, `color/brand/light/<step>`,
   `color/brand/dark/<step>`. Written by `applyPalette.ts`.

2. **Renaming the existing palette primitives.** When harmoni
   ramps replace `color.gold.*`, do we rename them
   `color.brand.*` (per RFC 0001 §4.3 recommendation), or keep
   `color.gold.*` as the brand-colour-of-record while the
   engine output sits parallel? Either way Intent doesn't
   change; the question is purely a primitives-side rename
   call.

3. ✅ **Sharing `figmaIdempotent.ts` between plugins.** Resolved for
   Phase A: re-implemented locally in
   `apps/harmoni-figma-plugin/src/code/figmaIdempotent.ts`.
   Extraction to a shared package remains a Phase C call.

4. **Dark mode timing.** Phase B can ship Light first and Dark
   later, or both together if the engine's dark ramps are stable
   when Phase B starts. The deferred §15.11 work on dark mode is
   the right reference.

5. **Sync plugin's role in Phase C.** Likely no change — but if
   the Intent collection layout proves awkward via the current
   Bootstrap action template, Phase C may revisit the sync
   plugin's surface.

---

## 8. Decision record

The non-negotiables this RFC commits to:

1. **Phase A is a throwaway.** No TDD, no UX polish; the only
   acceptance bar is "harmoni-produced variables exist in Figma."
2. **Phase B is exactly RFC 0001 Phase 5.** No new structural
   decisions; only wiring.
3. **Phase C is strict-TDD.** The CLAUDE.md discipline applies
   without exception.
4. **The Phase A UI is deleted, not refactored.** No half-port
   ships into Phase C.
5. **The harmoni plugin owns palette → variable writes.** The
   sync plugin owns DTCG export and structural bootstraps. The
   boundary documented in the `figma-token-sync` skill moves
   accordingly.
6. **The Button rebuild lives in Phase C.** RFC 0001 §8 / §9
   states are not addressed before then.

End.

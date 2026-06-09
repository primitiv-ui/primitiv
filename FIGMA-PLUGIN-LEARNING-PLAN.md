# Figma Plugin — Progressive Learning Plan

A progressive, build-as-you-learn plan for taking the
`apps/harmoni-figma-plugin` scaffold to a minimum viable plugin: one that
surfaces the Harmoni palette engine inside Figma.

**Scope of the MVP**

- Core **light palette** only — a single brand-colour input producing one
  palette. Neutrals and dark mode come later.
- Two output targets in Figma: **canvas swatch nodes** and **Figma
  Variables**.
- Every milestone is a real, committed increment of the actual plugin —
  learn by shipping. Strict TDD throughout, in line with the repo's
  working style.

---

## Recommended architecture

**Ports & adapters — "pure core, imperative shell".**

1. **Pure core** — engine wrapper, the Harmoni-colour→Figma-paint mapper,
   "palette → node spec" / "palette → variable spec" planners. No `figma`,
   no DOM. 100% TDD.
2. **Message contract** (`src/shared/messages.ts`) — the discriminated
   union between UI and sandbox; the only thing crossing the boundary.
   The UI generates palettes and sends Figma-ready data; the sandbox
   stays dumb.
3. **Figma adapter** — one `FigmaGateway` interface over every `figma.*`
   call; real implementation in the sandbox, fake injected in tests.

Each milestone = one or more red→green(→refactor) commits, strict TDD,
pushed often.

### How Harmoni hands you colour

The Harmoni engine emits each swatch colour ready to use. Every `Swatch`
and `SwatchStep` carries — alongside its OKLCH `l`/`c`/`h` numbers —
three derived fields:

- `hex` — a `#rrggbb` sRGB string,
- `rgb` — gamma-encoded sRGB `{ r, g, b }` floats in `0..=1`, exactly the
  form Figma fills and variables expect,
- `oklch` — a ready CSS `oklch(L C H)` string.

So the plugin does **no colour-space conversion**: it reads `swatch.rgb`
straight into a Figma `SolidPaint` or `COLOR` variable value. (Earlier
drafts of this plan had an "OKLCH → sRGB conversion" milestone; that was
a real gap in the *engine*, since fixed in `harmoni-core`'s
`color/output.rs` — the library now owns colour-format output, not each
consumer.)

---

## Milestones

### M0 — Orientation & API map *(study, ~2–3h)*

**Goal:** Accurate mental model before any code.

**Research:**
1. Figma docs "How Plugins Run" — sandbox vs UI iframe, why they share no
   scope.
2. Manifest reference — map every field in this repo's `manifest.json` to
   its meaning.
3. Skim the node-type docs (`RectangleNode`, `FrameNode`, `TextNode`), the
   Variables API page, `clientStorage`, and `setPluginData`.
4. Read the `documentAccess: "dynamic-page"` doc — note that node access
   becomes async.

**Implement:** none — optional notes only.

**Concepts:** two-context model, async-everything API, manifest
permissions, why wasm can't run in the sandbox.

### M1 — Generate & preview a palette in the UI *(~3–4h)*

**Goal:** A brand-colour input + Generate button calls `generate_palette`
and renders swatches in the iframe — preview only, no Figma writes.

**Research:**
1. Read workbench `useColors.ts` / `Swatch.tsx` for the engine-call
   pattern.
2. Re-read `src/ui/engine.ts` — `initEngine` gating and the `harmoni`
   re-export.
3. Run `pnpm run build:wasm`, then read the generated `harmoni-wasm`
   `.d.ts` to confirm the `generate_palette(hex, lightPadding,
   darkPadding)` signature and the `Palette`/`Swatch` shapes — note each
   swatch's `hex`/`rgb`/`oklch` colour fields.

**Implement (TDD):**
1. RED: test a pure `generatePalette(hex, opts)` wrapper (mock
   `harmoni-wasm` with the `vi.hoisted` pattern from `engine.test.ts`).
2. GREEN: implement the wrapper.
3. RED: test the UI state — colour input change → swatches in state.
4. GREEN: wire a colour input (`@primitiv-ui/react`), a Generate button, and
   a swatch list rendered straight from each swatch's `oklch` field.

**Concepts:** harmoni-wasm in the iframe, init gating, mocking the wasm
module, React state.

### M2 — Harmoni colour → Figma paint *(~1–2h)*

**Goal:** A tiny, fully-tested pure mapper from a Harmoni swatch to the
shapes Figma writes — a `SolidPaint` for fills and an `RGB` value for
colour variables. No colour-space maths: the engine already emits
Figma-ready `swatch.rgb`.

**Research:**
1. Confirm Harmoni emits `swatch.rgb` as gamma-encoded sRGB `{r,g,b}`
   floats in `0..=1` — read the regenerated `harmoni-wasm` `.d.ts`.
2. The `Paint` / `SolidPaint` / `RGB` / `RGBA` types in
   `@figma/plugin-typings` — note `SolidPaint.color` is an `RGB` with
   0–1 channels, so `swatch.rgb` drops straight in.

**Implement (TDD):**
1. RED: `swatchToSolidPaint(swatch)` → `{ type: 'SOLID', color: rgb }`.
2. GREEN: implement.
3. RED: `swatchToVariableValue(swatch)` → the `RGB` a `COLOR` variable
   takes.
4. GREEN: implement.

**Concepts:** Figma's paint model, the `Paint`/`RGB` shapes, pure-function
TDD — the engine already owns the colour-space conversion.

### M3 — The Figma adapter seam (dependency injection) *(~3–4h)*

**Goal:** A `FigmaGateway` interface over every `figma.*` call, with a
real implementation and a test fake.

**Research:**
1. Re-read `src/code/figma.mock.ts` and `handleMessage.test.ts` — the
   pattern already in place.
2. In `@figma/plugin-typings`, read the real signatures of the calls
   you'll need across M4–M8 (createRectangle, createFrame, createText,
   `variables.*`, `clientStorage`).
3. Read a short ports-&-adapters explainer.

**Implement (TDD):**
1. Define a minimal `FigmaGateway` interface (it grows per later
   milestone).
2. RED: refactor `handleUiMessage` to take a `gateway` parameter; test
   against a fake.
3. GREEN: write `createFigmaGateway()` wrapping the real `figma` global.
4. Extend `createFigmaMock` into a typed `FakeFigmaGateway` of spies.
5. Wire `code.ts` to build the real gateway and pass it in.

**Concepts:** dependency injection, ports & adapters, isolating an
untestable global, why the sandbox can't run under jsdom.

### M4 — First node on the canvas ("Hello rectangle") *(~3–4h)*

**Goal:** A UI button → message → sandbox creates one filled rectangle →
replies with a result.

**Research:**
1. `figma.createRectangle`, `RectangleNode.fills`, the `SolidPaint` shape,
   `node.x/y/resize`, `figma.currentPage.appendChild`.
2. The message round-trip: `parent.postMessage({pluginMessage}, '*')`,
   `figma.ui.onmessage`, `figma.ui.postMessage`.

**Implement (TDD):**
1. RED: add a `{ type: 'apply-test-rect', color }` `UiMessage`; test
   `handleUiMessage` calls the gateway to create + fill a rectangle.
2. GREEN: implement the handler.
3. RED: sandbox posts `{ type: 'apply-result', ok }` back; test it.
4. GREEN: implement; UI button posts the message and listens for the
   result.

**Concepts:** UI→sandbox round-trip with a payload, node creation &
fills, result/ack messages.

### M5 — Render the palette as canvas swatch nodes *(~4–6h)*

**Goal:** A generated palette becomes a frame of labelled swatch
rectangles on the canvas.

**Research:**
1. `figma.createFrame` and auto-layout props — `layoutMode`,
   `itemSpacing`, `padding*`, `primaryAxisSizingMode`.
2. `figma.createText`, `figma.loadFontAsync`, `fontName`, `characters` —
   note text needs a font loaded first.
3. `figma.viewport.scrollAndZoomIntoView`.

**Implement (TDD):**
1. RED: a pure `planSwatchFrame(palette)` → a node-spec tree (frame +
   rects + text, fills mapped from each swatch's `rgb`). Test it.
2. GREEN: implement the planner.
3. RED: a handler that applies a node-spec via the gateway; assert the
   calls on the fake.
4. GREEN: implement; add real gateway methods incl. font loading.
5. UI: an "Add to canvas" button.

**Concepts:** frames & auto-layout, text nodes & font loading, batching
node creation, separating the testable plan from the imperative apply.
**Output target #1 complete.**

### M6 — Apply the palette as Figma Variables *(~5–7h)*

**Goal:** Create a variable collection with one colour variable per
swatch.

**Research:**
1. Variables API — `figma.variables.createVariableCollection`, collection
   `modes`, `createVariable(name, collection, 'COLOR')`,
   `variable.setValueForMode`.
2. `getLocalVariableCollectionsAsync` (async under dynamic-page).
3. Variable naming — `/` creates UI groups.

**Implement (TDD):**
1. RED: a pure `planVariableSet(palette, collectionName)` → a spec of
   collection + variables. Test it.
2. GREEN: implement the planner.
3. RED: a handler applying the spec via the gateway; the fake asserts
   batch creation.
4. GREEN: implement real async gateway methods.
5. UI: a "Create variables" button + result handling.

**Concepts:** the Variables API, collections & modes, batch variable
creation, async API patterns, naming/grouping. **Output target #2
complete.**

### M7 — Persisting plugin state *(~3–4h)*

**Goal:** Remember the user's last brand colour / settings between runs.

**Research:**
1. `figma.clientStorage.getAsync/setAsync` (async, per-user,
   cross-document) vs `setPluginData`/`getPluginData` (per-node) vs
   shared plugin data — the trade-offs.
2. Decide: `clientStorage` fits "last input the user typed".

**Implement (TDD):**
1. RED: gateway `loadState` / `saveState`; handler saves on generate.
2. GREEN: implement.
3. RED: on `plugin-ready`, the sandbox loads state and sends it to the
   UI; the UI prefills.
4. GREEN: implement.

**Concepts:** `clientStorage` vs plugin data, async storage,
serialisation, TDD via the fake.

### M8 — Idempotent re-apply *(~4–6h)*

**Goal:** Re-running generation updates the existing swatch frame &
variable collection instead of duplicating them.

**Research:**
1. `node.setPluginData` to tag generated output; how to find tagged
   nodes.
2. `getNodeByIdAsync` and the async node-access rules under
   `documentAccess: "dynamic-page"`.
3. `getLocalVariableCollectionsAsync` to locate an existing collection by
   name.

**Implement (TDD):**
1. RED: find-existing-frame logic via the plugin-data tag.
2. GREEN: update-or-create the frame.
3. RED: same find-or-create for the variable collection.
4. GREEN: implement; handle stale/removed nodes.

**Concepts:** dynamic-page async node access, tagging with plugin data,
diffing, cleanup.

### M9 — Error handling, loading & empty states *(~3–5h)*

**Goal:** Surface engine errors (bad hex), Figma write failures, and
in-progress state in the UI.

**Research:**
1. `generate_palette` failure modes — an invalid hex throws a `JsError`.
2. `figma.notify` for sandbox-side toasts.

**Implement (TDD):**
1. RED: invalid hex → the engine wrapper returns an error result → UI
   shows it.
2. GREEN: implement.
3. RED: a sandbox write failure → error message variant → UI surfaces it.
4. GREEN: implement; add loading/disabled button states.

**Concepts:** error-carrying message variants, defensive boundaries, UX
states.

### M10 — MVP hardening: manual QA in Figma desktop *(~2–4h)*

**Goal:** Run the whole flow in Figma desktop, fix integration gaps,
update the README.

**Research:** the real dev cycle — `pnpm run build:wasm`,
`pnpm --filter harmoni-figma-plugin dev`, importing the manifest in Figma
desktop.

**Implement:** work a manual QA checklist (generate → canvas → variables
→ re-run → restart), fix gaps the fake gateway couldn't catch, update
`apps/harmoni-figma-plugin/README.md`.

**Concepts:** the real dev cycle, gaps between fake and real Figma, docs.

---

## Summary

| Milestone | Focus | Estimate |
| --- | --- | --- |
| M0 | Orientation & API map | ~2–3h |
| M1 | Generate & preview a palette in the UI | ~3–4h |
| M2 | Harmoni colour → Figma paint | ~1–2h |
| M3 | The Figma adapter seam (DI) | ~3–4h |
| M4 | First node on the canvas | ~3–4h |
| M5 | Palette as canvas swatch nodes | ~4–6h |
| M6 | Palette as Figma Variables | ~5–7h |
| M7 | Persisting plugin state | ~3–4h |
| M8 | Idempotent re-apply | ~4–6h |
| M9 | Error handling & UI states | ~3–5h |
| M10 | MVP hardening & manual QA | ~2–4h |

**Total: ~33–49 focused hours**, 11 milestones. A working MVP (generate →
canvas + variables) lands at M6; M7–M10 harden it.

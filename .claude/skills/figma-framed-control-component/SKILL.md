---
name: figma-framed-control-component
description: End-to-end playbook for building or extending a framed-control component set in Figma (Button, Switch, Checkbox, Toggle, …) bound to the design-system tokens, including component-property wiring and non-framed form-field compositions (Field). TRIGGER when building, extending, laying out, or auditing a framed-control or form-field composition, adding a variant or filling missing combinations, or wiring icon/text/swap properties on a set. SKIP for React/Rust work, token export/backup (see figma-token-sync), wireframe styling lookups (see figma-wireframe-tokens), and pure variable/token-value questions (see figma-variable-architecture).
---

# Building a framed-control component in Figma

Playbook for the *process* of building or extending a framed-control
component set bound to the design-system tokens. The token **values,
collection IDs, framed-control anatomy, and the focus-ring spec + canonical
recipe** live in the `figma-variable-architecture` skill — load it alongside
this one and look values up there rather than duplicating them here.

All work is driven through `mcp__figma-console__figma_execute` (Plugin API,
async throughout). This is Figma-only experimental work — no TDD; verify
visually and positionally instead.

Reference files — load the one you need, when you need it:

- `references/gotchas.md` — the full build-time gotcha catalogue. **Read
  before any build or audit sweep.**
- `references/component-properties.md` — boolean/TEXT/INSTANCE_SWAP wiring,
  the exposed-nested-property limitation, the single-shared-default TEXT rule.
- `references/auto-layout-sizing.md` — making dimensions token-drivable with
  auto-layout (Switch track pattern) and the geometry/constraint gotchas.
- `references/field-compositions.md` — non-framed compositions (Field:
  label + nested control instance + helper text).

## 0. Pre-flight — confirm you're on the real set

1. `figma_get_status { probe: true }` — confirm the connected file/page.
2. **Find the real component set, not a proof-of-concept.** Search returns
   stale or POC sets. Enumerate across pages and confirm:
   ```js
   await figma.loadAllPagesAsync();
   // for each page: page.findAllWithCriteria({ types: ["COMPONENT_SET"] })
   ```
   Watch for decoy sets on `*— … Demo` pages. Verify by checking the page
   name is plain (e.g. "Button", not "Button — Context Demo").
3. **Read the real property names** off the set —
   `componentSet.componentPropertyDefinitions`. Do not assume casing or
   names; the live Button set uses `Variant / Size / State` with **lowercase
   values**, plus boolean / instance-swap / text props (`Show leading icon`,
   `Leading icon`, `Label`, …). There is **no Context dimension** — density is
   controlled by the containing frame's variable mode override.
4. **Tally the matrix** to find what's missing:
   ```js
   // count present combos of Context×Variant×Size×State; diff against the
   // full grid to list the exact missing variants.
   ```
5. `figma.getNodeByIdAsync(id)` — the API runs with `documentAccess:
   dynamic-page`, so the **async** getters are required (`getNodeByIdAsync`,
   `getVariableByIdAsync`, `getVariableCollectionByIdAsync`). The sync
   `getNodeById` throws.

## 1. Learn the anatomy from a known-good variant

Dump one fully-correct variant (root + children) capturing, per node:
name, type, w/h, layoutMode + padding/gap, cornerRadius, fills/strokes,
effects, opacity, text content + textStyle, instance props, and
`boundVariables` (resolve IDs to names). Cross-reference the bindings against
the `figma-variable-architecture` anatomy table:

- **Root**: auto-layout; `framed-control/{size}/{height,padding-inline,gap,
  radius}`, border width `color/border/width/thick`, fills
  `action/{variant}/default`, strokes `action/{variant}/border/default`.
- **Icon instances**: width/height → `framed-control/{size}/icon-size`; the
  icon's own `size` variant set to match; inner vector fill →
  `action/{variant}/foreground/default`.
- **Label text**: fill → `action/{variant}/foreground/default`;
  `fontSize/fontStyle/fontFamily/lineHeight` → `label/{size}/*` (these come
  back as **arrays** in `boundVariables`).
- **link** variant: no root fill/stroke; foregrounds → `action/link/*`;
  disabled handled by 50 % frame opacity.
- **focus** state: two extra ring frames — see the focus-ring recipe in
  `figma-variable-architecture`.

## 2. Build by clone-and-rebind

The cheapest, lowest-error way to add a variant or fill a gap is to **clone
an already-correct variant and rebind any stale Context-collection variables
to the unified `Context` collection's same-named vars**. Colour/border/
focus-ring-stroke tokens live outside the Context collection and carry over
untouched. Full recipe and collection IDs: `figma-variable-architecture` →
"Building components across contexts/variants — clone-and-rebind". Skeleton:

```js
// build name→Variable map for the unified Context collection, then per source:
const clone = src.clone();
set.appendChild(clone);
clone.name = `Variant=${v}, Size=${s}, State=${st}`; // sets variantProperties
await rebind(clone); // walk boundVariables; skip fills/strokes; text fields are arrays ([0]);
                     // rebind any var whose collection is the Context collection to the
                     // same-named var; do NOT set an explicit mode override on the clone
```

- **Idempotency**: before a batch, remove any pre-existing clones for that
  variant so re-runs don't duplicate.
- **Shared sizing**: primary/secondary/danger share `framed-control/*` per
  size; link shares it too (just drops the frame). The rebind is uniform
  across all variants.
- **Pitfall**: a clone faithfully copies *source* slip-bugs (e.g. a
  ring-frame radius bound to the wrong size slot). Sweep-fix afterwards — see
  the focus-ring slip gotcha in `figma-variable-architecture`.
- **After rebind, always re-set ring frame x/y** — clones inherit the
  source's ring positions, but if the source was built via in-place
  auto-layout addition, those positions may have been clamped to 0 (see
  the x=0 clamp gotcha in `references/auto-layout-sizing.md`). Safest:
  unconditionally set `gapFr.x = -2; gapFr.y = -2` and
  `ringFr.x = -4; ringFr.y = -4` in the rebind sweep, and resize ring frames
  to `(clone.width+4)×(clone.height+4)` and `(clone.width+8)×(clone.height+8)`.
- **Non-token properties don't rebind** — only variables in Context
  collections are updated. Anything set as a static value at build time
  (icon size/position, tick centering, explicit pixel offsets) stays at
  the source value. After clone-and-rebind, sweep these separately using
  the resolved `node.width`/`node.height` values.

### Component-specific sizing tokens

When a component has geometry that does not map to shared `framed-control/*`
tokens (e.g. Switch track dimensions, Checkbox box size), create a
**`{component}/` namespace in the unified `Context` collection** alongside
`framed-control/*`:

```
Context (mode: Compact)
  framed-control/md/height        ← shared
  switch/md/track-height          ← Switch-specific (set value for each mode)
  switch/md/track-width
  switch/md/thumb-size
  switch/md/thumb-margin
```

The rebind walk picks these up automatically because it checks
`variableCollectionId`. Adding the `{component}/` namespace keeps
`framed-control/*` clean (shared anatomy only) and gives each component a
tidy, discoverable home.

If the component's dimensions must respond to density, the nodes need
auto-layout before width/height can be bound — see
`references/auto-layout-sizing.md`.

## 3. Focus ring

Cross-link only — do not re-derive. The two-frame anatomy (`focus-ring-gap`
at +2 px/R+2, `focus-ring` at +4 px/R+4, both INSIDE strokes, ring colour
`focus/ring`, gap `color/neutral/transparent`, width `focus/ring/width`,
toggled by a "Focus ring" boolean) and the **canonical build recipe** are in
`figma-variable-architecture` → "Canonical recipe — focus ring on ANY
component". This is the shared standard for every framed control; build it
identically each time.

## 4. Incremental audit loop (one group at a time)

Build and show **one variant group at a time** so the human can catch slips
before they propagate:

1. Build the group's components (e.g. all sizes × states for one variant).
2. Make a throwaway preview: a page-level `FRAME`, lay **instances** of the
   new components in a tidy size×state grid inside it.
3. `figma_capture_screenshot { nodeId: frame.id }` (plugin `exportAsync`,
   reflects current state — prefer over `figma_take_screenshot` which hits
   cloud REST and can lag).
4. **Delete the preview frame** (`node.remove()`) — it is scaffolding, not a
   deliverable.
5. Report; wait for the user's OK before the next group.

## 5. Lay the set out + set the default instance

See the **`figma-arrange-component-set`** skill for the full layout recipe,
EDGE_PAD explanation, re-run safety pattern, and how to adapt for a new
component. Quick summary:

- Grid: size rows (md first, then xs sm lg xl) × variant/state columns
  (sub-grouped by interaction/state). No density rows — density is a frame concern.
- Script lives in `apps/harmoni-figma-plugin/scripts/arrange-<component>-component-set.js`.
- **EDGE_PAD = 24** (canonical across every arrange script): all component
  positions are shifted 24 px inward (4 px ring overflow + 20 px breathing room)
  so focus ring overflow (−4 px) never reaches the component-set frame boundary
  and gets clipped.
- Default instance: `componentSet.insertChild(0, topLeftComponent)`.
- Re-run safe: delete the existing `"<Name> Grid Labels"` group before
  regenerating labels.
- Run via `figma_execute` by replacing the `selection.find(…)` lookup with a
  direct `getNodeByIdAsync` call.

After arranging, wire component properties (booleans, text, instance-swap) —
see `references/component-properties.md`.

## 6. Write the component description (mandatory)

After the arrange step and final verification, write the component's description
field. This is not optional — no component is *done* without it.

See the **`figma-component-descriptions`** skill for the full schema, field-by-field
guide, and the canonical description for every existing component. Quick recipe:

```js
const set = await figma.getNodeByIdAsync('<set-id>');
set.description = `[description text — see figma-component-descriptions for schema]`;
```

Then add the new description to the "Canonical descriptions" section of the
`figma-component-descriptions` skill so future sessions can reference it without
re-reading Figma.

## 7. Verify

- **Concentricity / geometry**: dump control + ring frames; assert gap
  radius = R+2 and ring radius = R+4, with uniform +2/+4 px per-side offsets.
  Non-concentric rings (most visible at xl) almost always mean a ring-frame
  radius bound to the wrong size slot — sweep-fix all `State=focus`
  components.
- **Label alignment**: compare each label's canvas x against the matching
  column's button left edge (delta should be 0).
- **Default instance**: `set.children.find(n=>n.type==="COMPONENT")` returns
  the intended top-left variant.
- **Text typography bindings**: every TEXT node in the set must have `fontSize`,
  `fontStyle`, `fontFamily`, and `lineHeight` bound inline to Context collection
  variables — never via a text style. Verify with `node.boundVariables`: all four
  fields must be present. Any unbound field is a density bug — the text will silently
  ignore frame mode overrides and always render at Compact values.
- **Gotcha sweep**: re-read `references/gotchas.md` and check each item that
  applies to what you just built.

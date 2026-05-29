---
name: figma-framed-control-component
description: End-to-end playbook for building or extending a framed-control component set in Figma (Button, Switch, Checkbox, Toggle, Tabs/Trigger, …) bound to the design-system tokens — pre-flight checks, the clone-and-rebind technique for adding a context/variant/filling gaps, the incremental instance-preview audit loop, laying the set out with the arrange script, and verification. TRIGGER when building a new framed-control component in Figma, adding a density context or variant to an existing set, filling missing variant combinations, laying out a component set, or auditing one for token/geometry correctness. SKIP for React/Rust work, token export/backup (see figma-token-sync), wireframe styling lookups (see figma-wireframe-tokens), and pure variable/token-value questions (see figma-variable-architecture).
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
  x=0 clamp gotcha below). Safest: unconditionally set
  `gapFr.x = -2; gapFr.y = -2` and `ringFr.x = -4; ringFr.y = -4` in the
  rebind sweep, and resize ring frames to `(clone.width+4)×(clone.height+4)`
  and `(clone.width+8)×(clone.height+8)`.
- **Non-token properties don't rebind** — only variables in Context
  collections are updated. Anything set as a static value at build time
  (icon size/position, tick centering, explicit pixel offsets) stays at
  the source value. After clone-and-rebind, sweep these separately using
  the resolved `node.width`/`node.height` values.

## 2a. Component-specific sizing tokens

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

## 2b. Using auto-layout to make dimensions token-drivable

`node.width` and `node.height` can only be bound to FLOAT variables when the
node has `layoutSizingHorizontal/Vertical = "FIXED"`, which in turn requires
`layoutMode ≠ NONE`. Without auto-layout you cannot bind dimensions to tokens
at all — component geometry stays hardcoded and clone-and-rebind won't resize
across densities.

For a pill/track component (e.g. Switch) where layout drives thumb position:

```js
comp.layoutMode = "HORIZONTAL";
comp.layoutSizingHorizontal = "FIXED";
comp.layoutSizingVertical   = "FIXED";
comp.counterAxisAlignItems  = "CENTER";      // centres thumb vertically
// Unchecked: thumb at left
comp.primaryAxisAlignItems  = "MIN";
comp.setBoundVariable('paddingLeft',  thumbMarginVar);
// Checked: thumb at right  
comp.primaryAxisAlignItems  = "MAX";
comp.setBoundVariable('paddingRight', thumbMarginVar);
// Bind dimensions
comp.setBoundVariable('width',  trackWidthVar);
comp.setBoundVariable('height', trackHeightVar);
// Ring frames must be ABSOLUTE so layout doesn't reposition them
ringGapFr.layoutPositioning  = "ABSOLUTE";
ringFr.layoutPositioning     = "ABSOLUTE";
// Thumb stays in flow with FIXED sizing
thumb.layoutSizingHorizontal = "FIXED";
thumb.layoutSizingVertical   = "FIXED";
thumb.setBoundVariable('width',  thumbSizeVar);
thumb.setBoundVariable('height', thumbSizeVar);
```

`paddingLeft` / `paddingRight` bound to the margin token drives thumb
position automatically across densities. The auto-layout centering
(`counterAxisAlignItems = CENTER`) is equivalent to `y = thumbMargin` because
`thumbSize = trackHeight − 2 × thumbMargin` by construction.

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
- **EDGE_PAD = 8**: all component positions are shifted 8 px inward so focus
  ring overflow (−4 px) never reaches the component-set frame boundary and
  gets clipped.
- Default instance: `componentSet.insertChild(0, topLeftComponent)`.
- Re-run safe: delete the existing `"<Name> Grid Labels"` group before
  regenerating labels.
- Run via `figma_execute` by replacing the `selection.find(…)` lookup with a
  direct `getNodeByIdAsync` call.

## 6. Verify

- **Concentricity / geometry**: dump control + ring frames; assert gap
  radius = R+2 and ring radius = R+4, with uniform +2/+4 px per-side offsets.
  Non-concentric rings (most visible at xl) almost always mean a ring-frame
  radius bound to the wrong size slot — sweep-fix all `State=focus`
  components.
- **Label alignment**: compare each label's canvas x against the matching
  column's button left edge (delta should be 0).
- **Default instance**: `set.children.find(n=>n.type==="COMPONENT")` returns
  the intended top-left variant.

## Gotchas (quick list)

- Decoy POC sets (modes, "… Demo" page) vs the real default-mode set.
- `getNodeByIdAsync` etc. required (dynamic-page document access).
- `figma.currentPage = page` **throws** — use `await figma.setCurrentPageAsync(page)`.
- `boundVariables`: `fills`/`strokes` are colour paints (skip when rebinding
  context geometry); text typography fields come back as **arrays**.
- `figma_capture_screenshot` (live) over `figma_take_screenshot` (cloud).
- Ring-frame radius slips survive cloning — always sweep-fix.
- **x=0 clamp gotcha**: Adding `layoutMode = "HORIZONTAL"` to an existing
  frame in-place clamps any child at a negative x/y to 0 during the layout
  transition. Ring frames at x=−2/−4 silently move to x=0, making the ring
  appear asymmetric (flush-left, overflowing right). Fix: always explicitly
  set `gapFr.x = -2; ringFr.x = -4` *after* `layoutMode` is set, and again
  after every clone-and-rebind sweep.
- **`layoutPositioning = "ABSOLUTE"` requires a layout parent**: setting it
  on a child of a `layoutMode = NONE` frame throws. Add `layoutMode` to the
  parent first, *then* set children to ABSOLUTE.
- **`variantProperties` unreliable during build**: while old and new variants
  coexist in a set (mixed schemas), `c.variantProperties` throws
  "Component set for node has existing errors". Use name-based parsing
  (`name.match(/Size=(\w+)/)`) instead — always reliable.
- **No explicit mode overrides on components**: do NOT call
  `setExplicitVariableModeForCollection` on component variants. The density is
  owned by the containing frame. Setting overrides on components locks instances
  to a single density, breaking frame-level mode switching for consumers.
- **Non-token properties must be swept manually after rebind**: only variables
  whose `variableCollectionId` is a Context collection are updated by the
  rebind walk. Static pixel values (icon size, icon position, explicit x/y)
  stay at source values. After clone-and-rebind, sweep these separately using
  the resolved `node.width`/`node.height`.

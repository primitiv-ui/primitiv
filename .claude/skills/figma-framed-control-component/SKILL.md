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
   Watch for decoy sets on `*— … Demo` pages (e.g. a Button POC that uses
   *modes* — the real set is default-mode-only on the free tier). Verify by
   `explicitVariableModes` being empty and the page name being the plain one.
3. **Read the real property names** off the set —
   `componentSet.componentPropertyDefinitions`. Do not assume casing or
   names; the live Button set uses `Context / Variant / Size / State` with
   **lowercase values**, plus boolean / instance-swap / text props
   (`Show leading icon`, `Leading icon`, `Label`, …).
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

The cheapest, lowest-error way to add a context, add a variant, or fill a gap
is to **clone an already-correct variant and rebind its Context-collection
variables to the target collection's same-named twins**. Each density is a
separate collection (free-tier workaround) with identical variable *names*,
so only the collection differs; colour/border/focus-ring-stroke tokens live
outside the Context collections and carry over untouched. Full recipe and the
four collection IDs: `figma-variable-architecture` → "Building components
across contexts/variants — clone-and-rebind". Skeleton:

```js
// build name->Variable map for the TARGET context collection, then per source:
const clone = src.clone();
set.appendChild(clone);
clone.name = `Context=${ctx}, Variant=${v}, Size=${s}, State=${st}`; // sets variantProperties
await rebind(clone); // walk boundVariables; skip fills/strokes; text fields are arrays ([0]);
                     // if a var's collection is a Context/* collection, setBoundVariable to the
                     // same-named var in the target collection
```

- **Idempotency**: before a batch, remove any pre-existing clones for that
  context+variant so re-runs don't duplicate.
- **Shared sizing**: primary/secondary/danger share `framed-control/*` per
  size; link shares it too (just drops the frame). So the rebind is uniform
  across all variants — clone whichever complete context is cleanest
  (compact worked well as the dense source).
- **Pitfall**: a clone faithfully copies *source* slip-bugs (e.g. a
  ring-frame radius bound to the wrong size slot). Sweep-fix afterwards — see
  the focus-ring slip gotcha in `figma-variable-architecture`.

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

`apps/harmoni-figma-plugin/scripts/arrange-button-component-set.js` arranges
the set into the documented grid (`button-component-set-layout.md`):

- Props `Context/Variant/Size/State` (lowercase). Context order
  **compact → comfortable → spacious → dense** (dense last, least-used),
  md-first rows.
- Figma's **default instance is the set's first child** — the script
  `insertChild(0, …)`s the top-left cell (`compact/md/primary/default`), not
  just relying on position.
- State labels are left-aligned to each column's button left edge (buttons
  are left-aligned within a column, which is wider than the smallest button).
- To run via `figma_execute`: set `figma.currentPage.selection = [set]` first
  (the script reads the selection), and remove the prior "… Grid Labels"
  group so re-runs don't duplicate it.

For a new component, adapt this script's property names/orders or write a
sibling under `apps/harmoni-figma-plugin/scripts/`.

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
- `boundVariables`: `fills`/`strokes` are colour paints (skip when rebinding
  context geometry); text typography fields come back as **arrays**.
- `figma_capture_screenshot` (live) over `figma_take_screenshot` (cloud).
- Ring-frame radius slips survive cloning — always sweep-fix.
- Free tier = 1 mode per collection → densities are separate collections;
  the eventual Professional-tier modes consolidation reuses the same
  clone-and-rebind walk (see the density-consolidation memory).

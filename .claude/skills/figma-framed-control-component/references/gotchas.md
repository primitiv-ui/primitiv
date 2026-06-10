# Build-time gotchas — full catalogue

Read this before any build or audit sweep. Geometry/auto-layout gotchas live in
`auto-layout-sizing.md`; property-wiring gotchas in `component-properties.md`.

- Decoy POC sets (modes, "… Demo" page) vs the real default-mode set.
- `getNodeByIdAsync` etc. required (dynamic-page document access).
- `figma.currentPage = page` **throws** — use `await figma.setCurrentPageAsync(page)`.
- `boundVariables`: `fills`/`strokes` are colour paints (skip when rebinding
  context geometry); text typography fields come back as **arrays**.
- `figma_capture_screenshot` (live) over `figma_take_screenshot` (cloud).
- Ring-frame radius slips survive cloning — always sweep-fix.
- **Ring-frame constraints must be `STRETCH`, not `MIN`**: both `focus-ring` and
  `focus-ring-gap` need `constraints: { horizontal: "STRETCH", vertical: "STRETCH" }`
  so the ring follows the control when label text changes. The default on a new
  frame is `MIN` (anchored top-left only) — always set this explicitly. See
  `figma-variable-architecture` → focus-ring reference.
- **Text typography must be bound inline — never via text styles.** Every TEXT
  node's `fontSize`, `fontStyle`, `fontFamily`, and `lineHeight` must be bound to
  Context variables (`label/{size}/*`, `body/{size}/*`, `content/*` etc.) via
  `node.setBoundVariable`. A text style looks correct in the panel but silently
  ignores frame mode overrides — it always resolves at the default mode (Compact)
  regardless of which density the containing frame is set to. Found on
  Modal/Header title (2026-06-04). Applies to every text node in every component,
  including surface and non-framed-control components.
- **Border widths must go through the Context layer — never bind directly to
  Primitives.** Every framed-control stroke side weight (`strokeTopWeight` etc.)
  must be bound to `framed-control/border-width` (Context collection,
  `VariableID:428:6601`), which aliases `border-width/1` in Primitives. Binding
  directly to `border-width/1` (Primitive) violates the token layering rule.
  Hardcoded numeric weights (including 1.5px on Checkbox/Radio — now corrected to
  1px) are also forbidden. After any clone-and-rebind sweep, verify with
  `node.boundVariables.strokeTopWeight?.id === 'VariableID:428:6601'`.
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
- **Build the golden at page root, not inside a WIP frame.** If you build the
  first variant inside a working frame and later collect variants with
  `page.children.filter(...)`, the nested golden is missed and propagation
  silently skips it (you get N−1 per size). Reparent to the page, or collect
  with `page.findOne`/`findAll` (deep), before cloning.
- **Every component page needs Light mode set explicitly.** The `Intent` collection
  defaults to Dark mode. Without an explicit override, all `border/*` and
  `surface/*` tokens resolve to near-black Dark-mode values on the canvas —
  `border/default` appears black, `surface/default` appears near-black. Fix:
  `page.setExplicitVariableModeForCollection(intentCol, '346:7')` and the same for
  `Primitives / Palette` (`palCol`, Light modeId `345:6`). Apply to every new
  component page immediately after creation. Already applied to all existing pages
  as of 2026-06-04.
- **Two focus border patterns — choose one explicitly.** Input uses `border/focus`
  (changes the control's border to brand blue on focus, plus the ring). Select and
  Textarea use `border/default` (no border colour change — ring is the sole focus
  indicator). These two patterns are intentionally different; do not mix them
  within a single component. `border/focus` resolves to a strong blue (`#235CE1`),
  not teal — it is visually prominent. When in doubt, prefer the Select/Textarea
  pattern (ring-only) for large input controls where a coloured border would be
  distracting.

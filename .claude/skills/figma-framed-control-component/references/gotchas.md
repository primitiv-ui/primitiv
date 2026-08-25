# Build-time gotchas — full catalogue

Read this before any build or audit sweep. Geometry/auto-layout gotchas live in
`auto-layout-sizing.md`; property-wiring gotchas in `component-properties.md`.

- Decoy POC sets (modes, "... Demo" page) vs the real default-mode set.
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
- **Changing a control's dimensions leaves static focus-ring frames stale.** The
  `focus-ring` / `focus-ring-gap` frames carry **fixed** width/height (they aren't
  bound to the control's size vars), so when you retarget a control's size — e.g.
  bringing the Switch `track-height`/`track-width` down to match the checkbox
  box, or any box-size change — the track reflows (bound) but the ring frames stay
  at their old size and float oversized around the smaller control. After ANY
  size change, sweep the ring frames per variant and resize to hug the control:
  `gap = (control.width+4) × (control.height+4)` at `(-2,-2)`,
  `ring = (control.width+8) × (control.height+8)` at `(-4,-4)` (radius stays bound
  to the pill/`*-focus-ring-radius`). Bit the Switch during the 2026-07 choice-
  control height alignment — the token/variable change alone doesn't touch geometry.
- **Wrapping a framed control into a label row: preserve the box's auto-layout, keep
  the mark auto-positioned.** When you demote a control (box/track) to a `Control`
  child of a new `[Control, Label]` row, copy the **original** frame's auto-layout
  onto the Control (`HORIZONTAL`, `primaryAxisAlignItems`/`counterAxisAlignItems`,
  padding, `FIXED`/`FIXED` sizing) — do NOT set `layoutMode: NONE`. The tick/dot/
  thumb are **auto-layout-positioned** (the box centres them via `CENTER/CENTER`;
  the switch thumb travels via `MIN`+left-pad / `MAX`+right-pad). Setting the
  Control to `NONE` de-centres them (icon jumps to x=0), and the frame also
  **hug-collapses to the mark's width** — so keep sizing `FIXED` and the size vars
  bound. Resist "fixing" alignment by absolute-positioning the mark at hard-coded
  centred coords: that breaks density (it won't re-centre when the box resizes per
  mode). Leave the mark `AUTO` and let the Control's auto-layout centre it. Bit
  Checkbox/Radio/Switch during the 2026-07 label build.
- **A bound paint carries a resolved RGBA snapshot that `setBoundVariableForPaint`
  does not fill in — and that snapshot is what renders.** The paint keeps a literal
  `color` + `opacity` alongside the variable binding. Build a paint from scratch and
  it stays at the placeholder (`{0,0,0}`, `opacity 1`), so an **alpha** token —
  `color/transparent`, `action/ghost/hover|active`, any `color/neutral-alpha/*`,
  whose RGB is the near-black veil `#121418` — renders as **solid opaque black**,
  and every token renders black until the snapshot resolves. Worse, clones made in
  the **same script run** as their source inherit the placeholder, so a set can look
  correct at one size and be wrong at the other four. Fix deterministically after
  binding: write `v.resolveForConsumer(node).value` into the paint's `color` and its
  `.a` into `opacity`, then re-assign the array. Bit NavigationMenu's Bar Link
  (2026-07-25); the Trigger escaped it only because its variants were cloned from a
  donor whose paints had already resolved.
- **`INSTANCE_SWAP` `defaultValue` is a node id, not a component key.** Passing
  `component.key` (a perfectly valid 40-char key) throws `"Property value is
  incompatible with component property type"`. The live `Dropdown / Item` swaps use
  `defaultValue: "153:1825"` — a plain node id. Read a working set's
  `componentPropertyDefinitions` when in doubt.
- **Add component properties AFTER fanning out sizes, not before.** `clone()` on a
  variant *component* drops its `componentPropertyReferences` (documented in
  `component-properties.md`), so any variant cloned after a TEXT/BOOL property was
  wired renders the component's **default** while its instances still report the
  right property value — a silent failure that looks like `setProperties()` not
  working. NavigationMenu's Trigger needed 40 references re-wired for this reason;
  Bar Link and Panel Link avoided it by adding properties last.
- **Wiring an `INSTANCE_SWAP` reference resets the node to the property's
  default component.** Setting
  `node.componentPropertyReferences = { mainComponent: propId }` overwrites that
  node's current `mainComponent` with the property's single `defaultValue`, on
  **every** variant. So any per-variant, size-matched nested instance you built
  is silently replaced — the set then renders one glyph size at every control
  size, which reads as a design mistake rather than an API one. This is why the
  house convention instances the **`size=md`** Icon variant everywhere and binds
  `width`/`height` to the icon-size token instead (see SKILL.md §2). Verify with
  `await node.getMainComponentAsync()` plus a width check after wiring. Found
  building `Listbox / Option`, 2026-08-06.
- **A bound variable cannot be overridden on a node inside an instance.**
  `setBoundVariable` there returns without throwing and then no-ops — re-read
  `node.boundVariables` and the original variable is still attached. This is an
  **architectural** constraint, not a workaround-able one: if component B is
  "component A with one geometry token swapped", B cannot be an instance of A and
  must be its own set. `Listbox / CheckboxOption` is standalone for exactly this
  reason (its mark column needs `checkbox/{size}/box-size`, not
  `dropdown/{size}/item/icon-size`). Found 2026-08-06.
- **Figma ignores `spread` on `DROP_SHADOW`, so a CSS box-shadow focus ring
  cannot be ported as effects.** It renders as nothing, silently. Use the
  canonical two-frame ring (`focus-ring-gap` + `focus-ring`) — which is why both
  `focus-ring-radius` and `focus-ring-gap-radius` exist as tokens. On a container
  whose height comes from its content (a slot, a row stack), the `STRETCH`
  constraints on both frames are load-bearing, not optional.
- **`figma.createFrame()` clips its content by default.** A cap-height-trimmed label
  (`leadingTrim: CAP_HEIGHT`) sits in a box shorter than its glyphs, so a clipping
  wrapper crops the descenders — invisible at grid zoom, obvious on a single
  instance. Set `clipsContent = false` on every helper frame you create. Component
  roots made by `createComponent()` already default to `false`, which is why focus
  rings (absolute, at −2/−4) show at all.
- **Figma's undo rolls back plugin operations.** A user pressing ⌘Z mid-session
  silently reverted an entire arrange pass **and** the last-added INSTANCE_SWAP
  property, leaving 40 otherwise-correct variants stacked at `0,0`. If anything is
  undone after you report state, re-verify from the document rather than trusting
  your last report.

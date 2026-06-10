# Component properties — booleans, text, instance-swap, and the exposure limit

After `combineAsVariants`, add properties with `set.addComponentProperty(name, type,
default, opts?)` and wire each variant's node via `node.componentPropertyReferences`.
Mirror the live Button schema: `Leading/Trailing Icon` BOOLEAN (→ icon `visible`),
`Label`/`Value` TEXT (→ text `characters`), `Leading/Trailing Icon Instance`
INSTANCE_SWAP (→ icon `mainComponent`). **No "Focus ring" boolean** — the ring is
carried by `State=focus` alone (Button's ring frames have empty refs); don't add one.

**TEXT property = ONE shared default across all variants.** A text node bound to a
TEXT property displays the property's single default everywhere — you cannot give
`Filled=empty` and `Filled=filled` different default strings while both are bound.
The empty/filled distinction is therefore **colour only** (muted vs primary), with
one editable `Value`. To get genuinely different per-variant text you must *unbind*
(set each node's `characters` directly) and delete the property — losing the named,
panel-editable field. Usually not worth it; keep the property.

**Changing the icon glyph — and the exposure limitation (systemic).** The icon
library is one COMPONENT_SET with an `icon` glyph variant (39 glyphs) × `size`.
Consumers change the glyph via the INSTANCE_SWAP popover, which shows the set as a
**single collapsed "Icon" entry + a search box** — type the glyph name to pick.
That is the ceiling of what is scriptable. A clean *top-level glyph dropdown*
requires Figma's **"Expose property"** on the nested icon, and that is **UI-only —
the plugin API cannot do it**: assigning `instance.isExposedInstance = true` is a
no-op (it persists as a boolean but `comp.exposedInstances` stays empty and no
nested property ever surfaces on instances). Verified exhaustively 2026-05-31.
Do not burn time trying to script exposure.

INSTANCE_SWAP wiring that *does* work:

- `preferredValues: [{ type:"COMPONENT_SET", key:<iconSetKey> }]` — keep it to the
  icon set only. Adding the Button set (or others) just clutters the swap search.
  Icon set key `da2000986513297ee3823cf917a294e6a39991f2`.
- Per-size glyph: `iconInstance.swapComponent(await getNodeByIdAsync(glyphIdForSize))`
  preserves overrides by node name; re-apply the inner `Vector` fill binding after,
  and `setProperties` won't help pick the right *size* variant — swap to the
  size-specific component id.
- Default booleans/glyphs are a design call: Input ships `Leading/Trailing Icon`
  **true** with `user` / `eye` glyphs (login/password read).

## Related gotchas

- **`componentPropertyReferences` cannot be `null`** — to drop a reference set
  it to `{}` (or a new object without that key). Assigning `null` throws
  `"Expected object, received null"`.
- **Combining a *variant* strips property references — no INSTANCE_SWAP
  corruption.** Cloning a Button **variant component** (not an instance) drops
  its `componentPropertyReferences`, so the icon instances come over clean.
  The old "binding mainComponent corrupts the instance" fear applies to
  *instances*, not to variants cloned across sets — verify `refs:{}` and proceed.
- **Match icon glyphs by `variantProperties`, not substring.** `name.includes("icon=eye")`
  also matches `icon=eye-off`. Use `v.variantProperties.icon === "eye" && v.variantProperties.size === s`.
- **Nested-instance component properties don't auto-forward in a composite set.** On a
  set built from nested instances (Toggle Group = Toggles), a parent `Item N · Label`/
  `Leading Icon` property is a no-op on the nested instance — set the nested instance's
  OWN props directly (`item.setProperties({ "Label#…": txt, "Leading Icon#…": false }))`).
  Same family as the exposed-nested-property limit above.

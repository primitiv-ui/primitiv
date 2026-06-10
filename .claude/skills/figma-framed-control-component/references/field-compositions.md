# Non-framed compositions (e.g. Field)

Some form components are **not** framed controls — Field is a vertical *composition*
(label + nested control + helper text), no border, no `framed-control/*` on the root.
The same clone-and-rebind + combine + arrange flow applies, with these differences:

- Root: VERTICAL auto-layout, fixed width (240), HUG height, `counterAxisAlignItems=MIN`.
- **Nested control is a real instance of another set** (Field embeds the Input set).
  Coordinate it per variant by setting its variant props: Field `State=invalid` →
  `inputInstance.setProperties({State:"invalid"})`, and Size likewise. Consumers can
  still select the nested instance to configure it (nested props can't be exposed —
  see `component-properties.md`).
- Colours come from `content/*` (label `content/primary`, helper `content/secondary`
  → `content/error` red on invalid → `content/disabled`), not `action/*`.
- Description + error collapse to **one helper-text slot whose colour changes by
  state** (Figma has no conditional rendering — one slot beats two).
- Axes are `State × Size` (no Variant/Filled/interaction). See the
  `figma-arrange-component-set` skill for its single-col-axis arrange variant.

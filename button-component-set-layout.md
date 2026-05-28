# Button Component Set — Figma Layout Plan

## Dimensions

| Axis       | Values                                        | Direction              |
|------------|-----------------------------------------------|------------------------|
| Context    | dense, compact, comfortable, spacious         | Sections, top → bottom |
| Size       | md (anchor), xs, sm, lg, xl                   | Rows within section    |
| Variant    | primary, secondary, link, danger              | Column groups          |
| State      | default, hover, active, focus, disabled       | Columns within variant |
| Icon slots | Leading + Trailing (always present, toggle off to hide) | Baked into every cell |

**Total: 4 contexts × 5 sizes × 4 variants × 5 states = 400 components**

Property names and values are lowercase and match the live set exactly:
`Context` · `Variant` · `Size` · `State`.

Icon-only Button will be a separate component, built later.

---

## Size ordering rationale

With five sizes (xs → xl), strict ascending order puts **xs** at row 1. But Figma's
default instance is always the top-left component in the set, which must be
**dense / md**. These two requirements conflict.

Resolution: **md anchors row 1 in every context section**, followed by xs → sm → lg → xl
in ascending order below. The ascending sequence is preserved for all five sizes; md
simply sits above it as the canonical default. Row labels make this self-evident.

---

## Layout diagram

```
BUTTON COMPONENT SET
═══════════════════════════════════════════════════════════════════════════════════════════════════
          ←──── primary ──────────────── ←── secondary ────────────────── ←── link ──────────────── ←── danger ────────────────
          def  hov  act  foc  dis        def  hov  act  foc  dis        def  hov  act  foc  dis   def  hov  act  foc  dis
──────────────────────────────────────────────────────────────────────────────────────────────────────── DENSE
  md ★    [  ] [  ] [  ] [  ] [  ]       [  ] [  ] [  ] [  ] [  ]       [  ] [  ] [  ] [  ] [  ]  [  ] [  ] [  ] [  ] [  ]
  xs      [  ] [  ] [  ] [  ] [  ]       [  ] [  ] [  ] [  ] [  ]       [  ] [  ] [  ] [  ] [  ]  [  ] [  ] [  ] [  ] [  ]
  sm      [  ] [  ] [  ] [  ] [  ]       [  ] [  ] [  ] [  ] [  ]       [  ] [  ] [  ] [  ] [  ]  [  ] [  ] [  ] [  ] [  ]
  lg      [  ] [  ] [  ] [  ] [  ]       [  ] [  ] [  ] [  ] [  ]       [  ] [  ] [  ] [  ] [  ]  [  ] [  ] [  ] [  ] [  ]
  xl      [  ] [  ] [  ] [  ] [  ]       [  ] [  ] [  ] [  ] [  ]       [  ] [  ] [  ] [  ] [  ]  [  ] [  ] [  ] [  ] [  ]
──────────────────────────────────────────────────────────────────────────────────────────────────────── COMPACT
  md      …same 4 variant groups × 5 states …
  xs      …
  sm      …
  lg      …
  xl      …
──────────────────────────────────────────────────────────────────────────────────────────────────────── COMFORTABLE
  md … xs … sm … lg … xl …
──────────────────────────────────────────────────────────────────────────────────────────────────────── SPACIOUS
  md … xs … sm … lg … xl …
═══════════════════════════════════════════════════════════════════════════════════════════════════

★  Top-left = dense / md / primary / default → Figma default instance
[  ] Each cell contains: leading icon + label + trailing icon (all visible; toggle off to hide)
```

Context sizing comes from four separate per-density variable collections
(`Context / Dense`, `Context / Compact`, `Context / Comfortable`,
`Context / Spacious`) — same `framed-control/{size}/*` + `label/{size}/*`
names, different variables. Each component binds to its own context's
collection. (Free-tier workaround; the target is one `Context` collection
with four modes — see the density-consolidation memory.)

---

## Spacing guide

| Gap              | Value | Between                                          |
|------------------|-------|--------------------------------------------------|
| State instances  | 8px   | default ↔ hover ↔ active ↔ focus ↔ disabled      |
| Variant groups   | 32px  | primary ↔ secondary ↔ link ↔ danger              |
| Size rows        | 12px  | md ↔ xs ↔ sm ↔ lg ↔ xl within a context section  |
| Context sections | 64px  | dense ↔ compact ↔ comfortable ↔ spacious         |

State labels are left-aligned to each state column's left edge (matching the
left-aligned buttons within a column), not centred over the column.

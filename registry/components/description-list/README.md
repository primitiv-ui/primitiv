# `description-list` — registry entry

The artefacts `primitiv add description-list` resolves and copies into a
consumer repo — the `<dl>` compound from RFC 0023 / RFC 0012 D10. Like
`prose`, `description-list` has **no headless `@primitiv-ui/react`
counterpart**: `<DescriptionList>` carries zero interactive behaviour, so it
ships entirely from the registry.

## What it does

`DescriptionList` renders one `<dt>` + one `<dd>` pair per
`DescriptionList.Term`/`DescriptionList.Details` composition. Consumers
compose multiple pairs to form a full description list.

- `size` — `"xs" | "sm" | "md" | "lg" | "xl"` (default `"md"`). Scales the
  term and details type together.
- `layout` — `"stacked" | "inline"` (default `"stacked"`), matching the two
  layouts in the Figma component set:
  - `"stacked"`: `<dt>` above `<dd>`, `<dd>` indented under it.
  - `"inline"`: `<dt>` : `<dd>` side by side, in a two-column grid, with the
    `<dd>` **end-aligned** and each pair vertically centred (see below).
- The term is **fixed SemiBold weight** across every size and density mode
  (RFC 0012 D10) — only its family/size/line-height move with `size`. Both
  term and details use `content/primary` — no new colour tokens.

Figma's "fontStyle" vocabulary names the font *instance* (Regular/SemiBold)
of a variable family; CSS separates that into `font-weight`, so the term
binds `font-weight: var(--primitiv-font-weight-semibold)` rather than
`font-style` — the same distinction the base reset stylesheet already
applies to every heading and `<strong>`.

### `layout` needed no DOM change — only Grid auto-placement

Both layouts compose the exact same flat `Term`/`Details`/`Term`/`Details`…
children. `"inline"` switches the root to `display: grid;
grid-template-columns: max-content 1fr`, and Grid's default auto-placement
already lays plain document-order children into rows two at a time — no
wrapper element, no API change. This was verified directly against the live
Figma file (node `585:6947`) via the Figma Desktop Bridge, which is also
where `"inline"` itself came from: the first build only shipped the
`"stacked"` shape, missing the `Layout` variant axis Figma's component set
actually has.

### `inline` end-aligns the detail

In Figma, an inline pair is a row (`counterAxisAlignItems: CENTER`) whose
`Detail` **FILLs** the remaining width with `textAlignHorizontal: RIGHT`. So
the stylesheet gives the inline `<dd>` `text-align: end` (logical, so it flips
under RTL) and the grid `align-items: center`. That's what makes the layout read
as a two-column table of pairs — values lining up on the far edge — rather than
two ragged columns. A follow-up pass added both; the layout landed without them.

### Gotcha: the token rename that shipped without a regenerated token layer

`layout` also renamed this component's Context tokens (`term-gap` → `row-gap`,
plus a new `column-gap`) in `packages/tokens/src/context.json` — but the commit
**did not regenerate `tokens.css`**, so the emitted layer still defined the old
`term-gap`/`pair-gap` names while the stylesheet consumed `row-gap`/`column-gap`.
Undefined custom properties make `gap`/`column-gap` invalid at computed-value
time, so **both gaps silently collapsed to zero** and the deployed kitchen-sink
showed a cramped, un-gapped list — the styling looked wrong while every value in
`context.json` was correct. Renaming a Context token is a two-file change: the
DTCG source *and* the emitted `tokens.css` (`primitiv tokens --format css`,
which needs a `cargo` build — see `figma-bridge-token-sync` §2).

## Usage

```tsx
import { DescriptionList } from "@/components/description-list";

<DescriptionList>
  <DescriptionList.Term>Version</DescriptionList.Term>
  <DescriptionList.Details>0.1.0</DescriptionList.Details>
  <DescriptionList.Term>License</DescriptionList.Term>
  <DescriptionList.Details>MIT</DescriptionList.Details>
</DescriptionList>

<DescriptionList layout="inline">
  <DescriptionList.Term>Version</DescriptionList.Term>
  <DescriptionList.Details>0.1.0</DescriptionList.Details>
  <DescriptionList.Term>License</DescriptionList.Term>
  <DescriptionList.Details>MIT</DescriptionList.Details>
</DescriptionList>
```

## Files

| File | Authored? | Role |
|---|---|---|
| `contract.json` | **authored** | The styling contract — the `.primitiv-description-list` root class, the `--xs…--xl` and `--stacked`/`--inline` modifiers, the `.primitiv-description-list__term`/`__details` parts, and the `--primitiv-description-list-*` custom properties. |
| `styles.css` | **authored** | The canonical default theme: the two `layout` arrangements + fixed-weight term, in `@layer primitiv.base`/`primitiv.variants`. |
| `styles.scss` | **authored** | `styles.css` plus a trailing `$`-alias block, one `$primitiv-description-list-<prop>` per custom property. |
| `description-list.recipe.ts` | **authored** | `cva("primitiv-description-list", { variants: { size } })`. |
| `description-list.tsx` | **authored** | The `<DescriptionList>`/`<DescriptionList.Term>`/`<DescriptionList.Details>` wrappers. Hand-written (there is no primitive to generate from). |

Because there is no headless primitive, `description-list.tsx`/
`description-list.recipe.ts` are **not** generated by `primitiv-emit` and
carry **no drift-guard test** (contrast the generated wrappers, D53).
`description-list.tsx` is type-checked in CI by
`scripts/check-registry-types.mjs` like every other registry wrapper.

## Tokens

No new *colour* tokens (RFC 0012 D10: "both text nodes use
`content/primary`"). D10 is silent on spacing, though. Verified against the
live Figma file, spacing splits by `layout`:

- `stacked`'s row gap (`--primitiv-description-list-row-gap`) and `inline`'s
  column gap (`--primitiv-description-list-column-gap`), plus
  `details-indent`, are a new, density-scaled `description-list/*` Context
  token family, sized proportionally against the existing `space/*` scale —
  each anchored to Figma's own (density-unaware) comfortable/md value: 2px
  row gap, 24px column gap, 16px indent.
- `inline`'s row gap — the gap between one pair and the next —
  is **not** a description-list-owned token: Figma binds it directly to
  `list/item-gap` (RFC 0012 D9, the adjacent compound from the same design
  session), so `--primitiv-description-list-pair-gap` defaults to
  `var(--primitiv-list-item-gap)`, matching that binding rather than
  inventing a parallel token that could drift from it.

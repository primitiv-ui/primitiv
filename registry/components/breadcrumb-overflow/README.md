# BreadcrumbOverflow

The Primitiv **BreadcrumbOverflow** — a pre-arranged
[Breadcrumb](../breadcrumb/README.md) that collapses its middle entries behind
an overflow menu once the trail has more crumbs than `keepStart + keepEnd` can
show. Below that threshold it renders every crumb, exactly like a plain
`Breadcrumb`. It composes Breadcrumb's own `List`/`Item`/`Separator`/`Ellipsis`
parts and the registry `Dropdown` for the menu; the only genuinely new visual
surface is the overflow trigger itself (`__trigger`).

There is **no headless `@primitiv-ui/react` primitive** for BreadcrumbOverflow
beyond the headless `Breadcrumb.Ellipsis` glyph it already composes — Dropdown
already owns the menu's open/close and roving-focus behaviour, and Breadcrumb's
`Link`/`Page` own their own semantics, so there is nothing else for a
`packages/react` primitive to own. The only thing this component owns is the
truncation arithmetic, a pure function of its children — exactly like
`avatar-group`'s `max` truncation.

`primitiv add breadcrumb-overflow` copies this styled surface into your
project. The files are yours to edit; the stable contract is the
`.primitiv-breadcrumb-overflow` class (a reserved identification hook applied
alongside `.primitiv-breadcrumb`) plus the `__trigger` part and its
`--primitiv-breadcrumb-overflow-trigger-*` custom properties.

## The trigger (`__trigger`)

Figma's own `Overflow=true` variant (`436:12911`) has no code equivalent for
this: there, `"..."` renders as a bare `Breadcrumb/Item` (`State=link`) with
**no fill, no padding**, and the same 4px `itemSpacing` as every other crumb —
"inherits hover/focus/colour/sizing for free," per that component set's own
description. The registry `__trigger` class matches that **at rest**: no
visible background, and its padding is cancelled by an equal negative margin
so it never grows the trail's own item spacing beyond the plain `"..."` glyph's
own footprint.

The trigger deliberately does **not** compose the registry `Button` component
— Button's framed-control padding scale reads far too heavy in this inline
context (it visually reads as "a secondary button" sitting inside a text
trail). The hover/active background is a code-only affordance beyond what the
static Figma design models (a menu trigger benefits from a clearer "this opens
a panel" cue than a plain link gets) and borrows the same `action/ghost/*`
state-layer tokens Button's own ghost variant uses, via two per-component
knobs:

| Custom property | Default |
|---|---|
| `--primitiv-breadcrumb-overflow-trigger-hover-background` | `var(--primitiv-action-ghost-hover)` |
| `--primitiv-breadcrumb-overflow-trigger-active-background` | `var(--primitiv-action-ghost-active)` |

## Anchor positioning

The trigger/panel pair uses CSS anchor positioning, like every Dropdown
consumption — but since `BreadcrumbOverflow` can appear more than once on a
page, it derives its own unique `anchor-name` from `useId()` internally
(mirroring `NavigationMenu`'s `toAnchorIdentFragment` — `useId()`'s
colon-bracketed output isn't a valid CSS `<custom-ident>`, so every character
outside `[A-Za-z0-9_-]` becomes a hyphen) rather than asking the consumer to
wire one, unlike the bare [`Dropdown`](../dropdown/README.md) component.

## Data model

Like every other Primitiv compound, this component owns no data model of its
own (RFC 0019 §4c) — it takes `children`, not a `label`/`href` array:

```tsx
<BreadcrumbOverflow keepStart={1} keepEnd={1}>
  <BreadcrumbLink href="/">Home</BreadcrumbLink>
  <BreadcrumbLink href="/library">Library</BreadcrumbLink>
  <BreadcrumbLink href="/library/fiction">Fiction</BreadcrumbLink>
  <BreadcrumbLink href="/library/fiction/mystery">Mystery</BreadcrumbLink>
  <BreadcrumbPage>Neuromancer</BreadcrumbPage>
</BreadcrumbOverflow>
```

When the trail is too long, the hidden middle crumbs are re-rendered
**unmodified** as `DropdownItem asChild` children inside the overflow menu —
the same `BreadcrumbLink` elements you passed become real, navigable menu
items, so any `href`, click handler, or routing-library `asChild` composition
on them keeps working unchanged.

## Truncation

- `keepStart` (default `1`) — crumbs always shown at the start of the trail.
- `keepEnd` (default `1`) — crumbs always shown at the end (typically
  including the current page).
- Collapsing only kicks in once there is more than **one** crumb to hide —
  collapsing a single crumb into a menu saves nothing over just showing it.

## Usage

```tsx
import { BreadcrumbOverflow } from "@/components/breadcrumb-overflow";
import { BreadcrumbLink, BreadcrumbPage } from "@/components/breadcrumb";

<BreadcrumbOverflow size="md" keepStart={1} keepEnd={1} menuLabel="Show hidden pages">
  <BreadcrumbLink href="/">Home</BreadcrumbLink>
  <BreadcrumbLink href="/library">Library</BreadcrumbLink>
  <BreadcrumbLink href="/library/fiction">Fiction</BreadcrumbLink>
  <BreadcrumbLink href="/library/fiction/mystery">Mystery</BreadcrumbLink>
  <BreadcrumbPage>Neuromancer</BreadcrumbPage>
</BreadcrumbOverflow>;
```

`BreadcrumbOverflow` is the only new export — it is a drop-in replacement for
`Breadcrumb` + `BreadcrumbList` (you still supply `BreadcrumbLink`/`BreadcrumbPage`
children directly; `BreadcrumbItem`/`BreadcrumbSeparator`/the overflow trigger
are inserted for you).

## Props

| Prop | Values | Default | Effect |
|---|---|---|---|
| `children` | `ReactNode` | — required | The trail's `BreadcrumbLink`/`BreadcrumbPage` elements, in order. |
| `size` | `xs` · `sm` · `md` · `lg` · `xl` | `md` | Forwarded to `Breadcrumb`'s own `size`; also sizes the menu the trigger opens. |
| `keepStart` | `number` | `1` | Crumbs always shown at the start of the trail. |
| `keepEnd` | `number` | `1` | Crumbs always shown at the end of the trail. |
| `menuLabel` | `string` | `"Show hidden pages"` | Accessible label (`aria-label`) for the overflow trigger button. |

## Files

| File | Authored? | Role |
|---|---|---|
| `contract.json` | **authored** | The styling contract — the `.primitiv-breadcrumb-overflow` class plus the two `--primitiv-breadcrumb-overflow-trigger-*` custom properties. Every other visual knob is Breadcrumb's or Dropdown's. |
| `styles.css` | **authored** | The `__trigger` part's resting/hover/active/focus styling, plus a reserved (otherwise empty) `.primitiv-breadcrumb-overflow` root rule — the trail/menu theme itself is Breadcrumb's/Dropdown's. |
| `styles.scss` | **authored** | `styles.css` verbatim plus the `$primitiv-breadcrumb-overflow-trigger-*` alias block. |
| `breadcrumb-overflow.recipe.ts` | **authored** | `cva("primitiv-breadcrumb-overflow")` — no variants; `size`/`keepStart`/`keepEnd`/`menuLabel` are pure prop logic. |
| `breadcrumb-overflow.tsx` | **authored** | `BreadcrumbOverflow` — composes the registry `breadcrumb` and `dropdown` components. |

Because there is no headless primitive of its own and no generator-emitted
shape for this composition, `breadcrumb-overflow.tsx`/`breadcrumb-overflow.recipe.ts`
carry **no drift-guard test** (contrast the generated wrappers, D53). It is
still type-checked in CI by `scripts/check-registry-types.mjs`.

## Dependencies

- [`@primitiv-ui/react`](https://www.npmjs.com/package/@primitiv-ui/react) —
  the headless `Breadcrumb` primitive, via the registry `breadcrumb` component
  (specifically `Breadcrumb.Ellipsis`).
- The registry [`breadcrumb`](../breadcrumb/README.md) and
  [`dropdown`](../dropdown/README.md) components — installed automatically as
  dependencies.
- [`class-variance-authority`](https://cva.style) — the recipe.
- The **token layer** (`primitiv tokens`) — resolved through Breadcrumb's/
  Dropdown's own custom properties plus this component's two
  `--primitiv-breadcrumb-overflow-trigger-*` knobs (`--primitiv-action-ghost-*`,
  `--primitiv-space-*`, `--primitiv-radii-*`, `--primitiv-motion-*`,
  `--primitiv-focus-ring-*`).

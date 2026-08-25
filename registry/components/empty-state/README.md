# EmptyState

The placeholder shown when a collection, search, or view has no content — a
decorative media slot, a headline, supporting copy, and recovery actions,
centred in the space it fills.

Composes the headless [`EmptyState`][headless] compound, which supplies the
`role="status"` polite live region and the `aria-hidden` media slot. This
component adds only the styling.

```sh
primitiv add empty-state
```

## Usage

Every part is optional — compose only what a given empty state needs.

```tsx
import {
  EmptyState,
  EmptyStateMedia,
  EmptyStateTitle,
  EmptyStateDescription,
  EmptyStateActions,
  Button,
} from "@/components/primitiv";

{results.length === 0 && (
  <EmptyState>
    <EmptyStateMedia>
      <SearchIcon />
    </EmptyStateMedia>
    <EmptyStateTitle>No results found</EmptyStateTitle>
    <EmptyStateDescription>
      We could not find anything matching your search. Try adjusting your
      filters or using different keywords.
    </EmptyStateDescription>
    <EmptyStateActions>
      <Button onClick={clearFilters}>Clear filters</Button>
      <Button variant="secondary" onClick={browseAll}>Browse all</Button>
    </EmptyStateActions>
  </EmptyState>
)}
```

It is a **compound of parts, not a props API** — the registry surface mirrors
the headless surface's shape. That is what keeps the composition open: reorder
the parts, put your own element between the description and the actions, or
drop the title entirely.

## Props

`EmptyState` (the root) takes the two modifiers plus everything the headless
`EmptyState.Root` accepts:

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `orientation` | `"vertical" \| "horizontal"` | `"vertical"` | `vertical` stacks the media above centred text. `horizontal` places the media beside inline-start-aligned text, for a compact/inline empty region. |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"md"` | `data-density` scales each size further. |

The parts (`EmptyStateMedia`, `EmptyStateTitle`, `EmptyStateDescription`,
`EmptyStateActions`) are thin class-applying pass-throughs — they take whatever
their headless counterpart takes, including `asChild`.

## Patterns

**Fill the empty region.** The root carries no padding of its own and centres
itself in whatever box it is given, so give the *container* the padding and let
this fill it:

```tsx
<div style={{ display: "grid", placeItems: "center", minHeight: "20rem", padding: "2rem" }}>
  <EmptyState>...</EmptyState>
</div>
```

**Promote the title to a real heading.** The headless default is a `<p>`,
because a primitive cannot know the correct heading level. When the empty state
stands in for a titled section, join the document outline:

```tsx
<EmptyStateTitle asChild>
  <h2>No projects yet</h2>
</EmptyStateTitle>
```

**Opt out of the live region.** The root is a polite live region so it is
announced when it *replaces* content after a search or filter. For an empty
state that is part of the initial, static page, there is nothing to announce:

```tsx
<EmptyState role={undefined}>...</EmptyState>
```

**Any media works.** `EmptyStateMedia` is a fixed square box and an `<svg>`
child is scaled to fill it, so an icon needs no sizing props. For a raster or a
full illustration, style the child yourself — and if the artwork is genuinely
informative rather than decorative, opt back into the accessibility tree:

```tsx
<EmptyStateMedia aria-hidden={false}>
  <img src="/no-sales.svg" alt="Sales trending to zero" />
</EmptyStateMedia>
```

## Escape hatches

| Custom property | Defaults to | Notes |
| --- | --- | --- |
| `--primitiv-empty-state-gap` | `empty-state/{size}/gap` | The **wide** seam: media→text and →actions. |
| `--primitiv-empty-state-text-gap` | `empty-state/{size}/text-gap` | The **tight** seam: title→description. |
| `--primitiv-empty-state-actions-gap` | `framed-control/{size}/gap` | Between the action buttons. |
| `--primitiv-empty-state-max-inline-size` | `empty-state/{size}/max-inline-size` | The measure cap on the title and description. |
| `--primitiv-empty-state-media-size` | `empty-state/{size}/media-size` | The media box, both axes. |
| `--primitiv-empty-state-media-offset` | `empty-state/media-offset-top` | `horizontal` only — the optical nudge aligning the media to the title's cap-height. |
| `--primitiv-empty-state-media-color` | `content/primary` | The media glyph colour (`currentColor`). |
| `--primitiv-empty-state-title-*` | `heading/{h6...h2}/*` | Family / size / weight / line-height, per size. |
| `--primitiv-empty-state-title-color` | `content/primary` | |
| `--primitiv-empty-state-description-*` | `body/{size}/*` | Family / size / weight / line-height. |
| `--primitiv-empty-state-description-color` | `content/secondary` | |

## Gotchas

**The gap rhythm is graduated, and built from `gap` plus sibling margins.** The
flex `gap` is the *tight* `-text-gap`; the two wide seams add the remainder back
as a `margin-block-start`. That is deliberate — it is what makes the rhythm
survive any subset or order of parts. If you override `-gap` or `-text-gap`,
both seams move together as intended; if you set a `gap` on the root directly
you will break the tight title/description pairing.

**The title uses the `heading/*` scale, not `label/*`.** `label/{size}` and
`body/{size}` resolve to the *same* value at `lg` and `xl`, and because the
label face is condensed the title would read as the *smaller* of the two. Size
maps onto a heading slot instead: xs→h6, sm→h5, md→h4, lg→h3, xl→h2.

**In `horizontal`, the media is absolutely positioned** into a gutter reserved
by `padding-inline-start` on the root (gated by `:has()`, so a media-less
horizontal empty state isn't indented). This keeps the DOM flat and — unlike a
two-column grid with a row-spanning media — cannot inflate the
title/description seam when the media is taller than the text column. If you
give the root your own `position`, keep it `relative`.

**The actions row hugs and never stretches**, matching Card's and Modal's
footers. It wraps rather than overflowing when the container is narrower than
the button row.

## Files

| File | Purpose |
| --- | --- |
| `empty-state.tsx` | The five styled parts. |
| `empty-state.recipe.ts` | `cva` recipe mapping `orientation`/`size` to modifier classes. |
| `styles.css` | The default theme (canonical). |
| `styles.scss` | The same CSS plus `$primitiv-empty-state-*` aliases. |
| `contract.json` | The component's API surface — modifiers and custom properties. |

## Dependencies

- `@primitiv-ui/react` — the headless `EmptyState` compound.
- `class-variance-authority` — the recipe.
- The token layer (`primitiv tokens`).

No registry component dependency: the recovery controls are whatever you pass to
`EmptyStateActions`, so `button` is not installed on your behalf. Install it
separately if you want it (`primitiv add button`).

[headless]: https://primitiv-ui.dev/docs/headless/empty-state

# Card

A content container — an optional media region plus a padded content block
holding a header, description and footer.

```sh
primitiv add card
```

## Usage

```tsx
import { Card, CardMedia, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/card";
import { Button } from "@/components/button";

<Card layout="vertical" size="md">
  <CardMedia>
    <img src={src} alt="" />
  </CardMedia>
  <CardContent>
    <CardHeader>
      <CardTitle>Winter light</CardTitle>
    </CardHeader>
    <CardDescription>Shot on location in the Cairngorms, October.</CardDescription>
    <CardFooter>
      <Button variant="secondary">Share</Button>
      <Button>View</Button>
    </CardFooter>
  </CardContent>
</Card>;
```

## Layouts

`layout` picks how the media relates to the content. The markup is the same in
all three — `CardMedia` is always a **sibling** of `CardContent`, never a child.

| `layout` | Media |
| --- | --- |
| `vertical` (default) | Above the content, full width. |
| `horizontal` | Beside the content, `--primitiv-card-media-inline-size` wide (36% by default, so it grows with the card). |
| `cover` | Fills the card, behind the content, under a legibility scrim. |

```tsx
<Card layout="cover" scrim="strong">
  <CardMedia><img src={src} alt="" /></CardMedia>
  <CardContent>…</CardContent>
</Card>
```

`cover` flips the title and description to a fixed light foreground
(`color/absolute-white`) automatically and draws the scrim as a pseudo-element
— no extra component, no extra DOM. The foreground is fixed rather than
theme-following on purpose: the scrim itself is always `color/absolute-black`
regardless of app theme, so white text reads against it in both light and dark
mode. If a particular photo needs the opposite treatment in one theme (e.g. an
unusually bright image), override it independently per theme:

```tsx
<Card layout="cover" coverForegroundLight="black" coverForegroundDark="white">
  <CardMedia><img src={brightSkyPhoto} alt="" /></CardMedia>
  <CardContent>…</CardContent>
</Card>
```

`coverForegroundLight`/`coverForegroundDark` are limited to `"white"` |
`"black"` — the two absolute (non-theme-flipping) tones — rather than
arbitrary colour, so the override stays within the token system. Each maps to
its own CSS custom property (`--primitiv-card-cover-foreground-light` /
`-dark`), so setting one never affects the other theme's colour.

## Props

### `Card`

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `layout` | `"vertical" \| "horizontal" \| "cover"` | `"vertical"` | |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"md"` | `data-density` scales each size further. |
| `elevation` | `"flat" \| "raised"` | `"flat"` | `raised` applies `elevation/raised`. |
| `scrim` | `"soft" \| "medium" \| "strong"` | `"medium"` | Only has an effect with `layout="cover"`. |
| `coverForegroundLight` | `"white" \| "black"` | `"white"` | Title/description colour while the app is in light theme. Only has an effect with `layout="cover"`. |
| `coverForegroundDark` | `"white" \| "black"` | `"white"` | Title/description colour while the app is in dark theme. Only has an effect with `layout="cover"`. |
| `asChild` | `boolean` | `false` | Render your own element — e.g. an `<a>` for a wholly-clickable card. |

### `CardMedia`

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `inset` | `boolean` | `false` | Insets the media from the card edge and rounds its corners. |

### `CardFooter`

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `justify` | `"start" \| "center" \| "end"` | `"end"` | Alignment of the actions. |

`CardTitle` and `CardDescription` both take `asChild` — use it on `CardTitle` to
set the heading level that fits your page outline (it defaults to `<h3>`).

## Patterns

**A wholly-clickable card.** Put the link on the root:

```tsx
<Card asChild>
  <a href="/posts/winter-light">…</a>
</Card>
```

Prefer a link on the title when the card also contains other actions — nesting
interactive elements inside a link is invalid HTML and breaks keyboard use.

**Cards of equal height in a grid.** In a `vertical` card the media absorbs the
extra height, and the footer pins to the bottom of the content block. Both are
automatic; no props needed.

**Header slots.** `CardHeader` is a flex row and the title stretches, so
anything you put either side of it hugs:

```tsx
<CardHeader>
  <Avatar size="sm" />
  <CardTitle>Ana Ferreira</CardTitle>
  <Badge tone="success">Active</Badge>
</CardHeader>
```

## Gotchas

**`CardContent` owns all the padding.** `CardHeader`, `CardDescription` and
`CardFooter` carry none of their own. If you add padding to those parts, every
seam between them doubles up. Change `--primitiv-card-padding` instead.

**Flush media is square-cornered on purpose.** The card's own `overflow: hidden`
supplies the outer radius. Giving flush media its own radius also rounds the
inner seam where it meets the content and leaves a visible notch — which is why
only `inset` media gets `--primitiv-card-media-radius-inset`.

**The scrim tracks the content, not the card.** Its stops are fixed distances
from the bottom edge (`--primitiv-card-scrim-mid` / `-end`), so a tall card gets
the same readable band as a short one. If you switch them to percentages the
wash will scale with the card and swamp a tall one.

**`scrim` on a non-`cover` card does nothing.** The gradient is only drawn by
`.primitiv-card--cover::before`. The prop stays accepted so it can be set
alongside a dynamic `layout` without branching.

## Files

| File | Purpose |
| --- | --- |
| `card.tsx` | The wrapper — seven parts, hand-authored. |
| `card.recipe.ts` | `cva` recipes for the root, media and footer. |
| `styles.css` | Default theme. |
| `styles.scss` | The same CSS plus `$primitiv-card-*` aliases. |
| `contract.json` | Class names and custom properties. |

## Dependencies

- `@primitiv-ui/react` — for `Slot` (`asChild`), nothing else. Card composes no
  headless primitive: it has no keyboard model, focus management or open/close
  state of its own.
- The token layer (`primitiv tokens`).

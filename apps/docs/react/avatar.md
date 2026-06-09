---
title: Avatar
---

# Avatar

Headless, accessible **Avatar** — a compound component for a user image with
a graceful fallback for while it loads, or when it is missing or broken. Zero
styles ship.

```tsx
import { Avatar } from "@primitiv-ui/react";

<Avatar.Root>
  <Avatar.Image src="/users/ada.jpg" alt="Ada Lovelace" />
  <Avatar.Fallback>AL</Avatar.Fallback>
</Avatar.Root>;
```

## Sub-components

| Export | Element | Data hooks | `asChild` |
|--------|---------|------------|-----------|
| `Avatar.Root` | `<span>` | `data-status` | yes |
| `Avatar.Image` | `<img>` | `data-status` | yes |
| `Avatar.Fallback` | `<span>` | `data-status` | yes |

## Props

### `Avatar.Root`

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `asChild` | `boolean` | `false` | Render the consumer's own element instead of `<span>`. |
| `...rest` | `ComponentProps<"span">` | — | All other `<span>` props. |

### `Avatar.Image`

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `asChild` | `boolean` | `false` | Render the consumer's own `<img>` instead. |
| `...rest` | `ComponentProps<"img">` | — | All `<img>` props — `src`, `alt`, etc. |

### `Avatar.Fallback`

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `delayMs` | `number` | — | Withhold the fallback for this many ms after mount, to avoid a flash of fallback content on fast connections. |
| `asChild` | `boolean` | `false` | Render the consumer's own element instead of `<span>`. |
| `...rest` | `ComponentProps<"span">` | — | All other `<span>` props. |

## Loading status

`Avatar.Root` owns a single loading status, resolved by the descendant
`Avatar.Image`:

| `data-status` | Meaning |
|---------------|---------|
| `"idle"` | No `Avatar.Image` has reported yet — only the fallback has shown. |
| `"loading"` | An image is mounted and in flight. |
| `"loaded"` | The image decoded successfully. |
| `"error"` | The image failed to load. |

`Avatar.Image` also resolves an **already-cached** image — one the browser
decoded before React could attach its `load` handler — straight to
`"loaded"`, so a cache hit never gets stuck showing the fallback.

## The fallback

`Avatar.Fallback` renders while the status is anything other than `"loaded"`,
and unmounts once the image loads. Use it for initials, an icon, or a
placeholder.

The `Avatar.Image` stays mounted on error so its `load` lifecycle is not lost;
hide a broken image with CSS via the `data-status` hook:

```css
.avatar-image:not([data-status="loaded"]) {
  display: none;
}
```

Pass `delayMs` to withhold the fallback briefly — useful when the image
usually loads fast enough that a flash of initials would be more distracting
than helpful:

```tsx
<Avatar.Root>
  <Avatar.Image src="/users/ada.jpg" alt="Ada Lovelace" />
  <Avatar.Fallback delayMs={600}>AL</Avatar.Fallback>
</Avatar.Root>
```

## Accessibility

Give `Avatar.Image` a meaningful `alt`. When the fallback is purely
decorative (e.g. it duplicates a name shown elsewhere), an empty `alt` on the
image plus `aria-hidden` on the fallback keeps assistive technology from
announcing the avatar twice.

## `asChild` composition

All three sub-components accept `asChild`. The library's `data-status` hook —
and, for the image, its `ref` and `load` / `error` handlers — are merged onto
the consumer's element.

```tsx
<Avatar.Root asChild>
  <a href="/users/ada">
    <Avatar.Image src="/users/ada.jpg" alt="Ada Lovelace" />
    <Avatar.Fallback>AL</Avatar.Fallback>
  </a>
</Avatar.Root>
```

## Styling hooks

| Attribute | Values | Set on |
|-----------|--------|--------|
| `data-status` | `"idle"` \| `"loading"` \| `"loaded"` \| `"error"` | `Avatar.Root`, `Avatar.Image`, `Avatar.Fallback` |

## Workbench example

Open the interactive version in the [workbench](/workbench/#/avatar). Its source:

<<< ../../../apps/workbench/src/pages/AvatarExample/AvatarExample.tsx

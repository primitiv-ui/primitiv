# DirectionProvider

Broadcasts a reading direction (`ltr` / `rtl`) to its descendants so
direction-aware components inherit it through context instead of each
being passed an explicit `dir` prop.

Renders **no DOM** — only a React context provider.

## Usage

```tsx
import { DirectionProvider } from "@primitiv/react";

<DirectionProvider dir="rtl">
  <Tabs.Root defaultValue="overview">…</Tabs.Root>
  <Slider.Root defaultValue={[50]} aria-label="Volume" />
</DirectionProvider>;
```

A component's own `dir` prop always wins over the inherited direction —
components fall back to the provider only when `dir` is omitted:

```tsx
<DirectionProvider dir="rtl">
  {/* inherits rtl */}
  <Tabs.Root defaultValue="a">…</Tabs.Root>
  {/* explicit ltr overrides the provider */}
  <Tabs.Root dir="ltr" defaultValue="a">…</Tabs.Root>
</DirectionProvider>;
```

## Props

| Prop       | Type             | Default | Description                                    |
| ---------- | ---------------- | ------- | ---------------------------------------------- |
| `dir`      | `"ltr" \| "rtl"` | —       | Reading direction broadcast to all descendants |
| `children` | `ReactNode`      | —       | The subtree that inherits the direction        |

## useDirection

`useDirection()` reads the current direction from the nearest
`DirectionProvider`. It falls back to `"ltr"` when no provider is present,
so it is always safe to call — direction-aware components use it as the
default for an omitted `dir` prop:

```tsx
import { useDirection } from "@primitiv/react";

function MyControl({ dir }: { dir?: "ltr" | "rtl" }) {
  const resolvedDir = dir ?? useDirection();
  // …
}
```

## Notes

- `DirectionProvider` never inspects the DOM. Setting `dir` on `<html>`
  (or another element) for CSS purposes remains the consumer's
  responsibility — this component only propagates the value to
  `@primitiv/react` components.
- Providers nest: an inner `DirectionProvider` overrides an outer one for
  its subtree.

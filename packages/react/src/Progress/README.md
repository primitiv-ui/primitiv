# Progress

Headless, accessible **Progress** — a compound component implementing the
[WAI-ARIA progressbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/meter/)
on a `<div role="progressbar">`. Display-only and non-interactive: it
reflects a consumer-supplied `value`. Zero styles ship.

```tsx
import { Progress } from "@primitiv/react";

<Progress.Root value={60} aria-label="Upload progress">
  <Progress.Indicator />
</Progress.Root>;
```

## Sub-components

| Export | Element | ARIA / data hooks | `asChild` |
|--------|---------|-------------------|-----------|
| `Progress.Root` | `<div>` | `role="progressbar"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext`, `data-state`, `data-value`, `data-max` | yes |
| `Progress.Indicator` | `<div>` | `data-state`, `data-value`, `data-max` | yes |

## Props

### `Progress.Root`

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `value` | `number \| null` | `null` | Current progress between `0` and `max`. `null` (or omitted) renders an indeterminate bar. |
| `max` | `number` | `100` | Upper bound of `value`. Must be a positive, finite number. |
| `getValueLabel` | `(value: number, max: number) => string` | rounded percentage | Produces `aria-valuetext`. Not called while indeterminate. |
| `asChild` | `boolean` | `false` | Render the consumer's own element instead of `<div>`. |
| `...rest` | `ComponentProps<"div">` | — | All other `<div>` props (`aria-label`, `className`, etc.). |

`Progress.Indicator` accepts all `<div>` props plus `asChild`.

## Determinate vs indeterminate

Pass a numeric `value` for a determinate bar — `aria-valuenow` and
`aria-valuetext` are set and `data-state` is `"loading"` or `"complete"`.

```tsx
<Progress.Root value={75} aria-label="Upload progress">
  <Progress.Indicator />
</Progress.Root>
```

Omit `value` (or pass `null`) when the completion ratio is unknown.
`aria-valuenow` / `aria-valuetext` / `data-value` are dropped and
`data-state="indeterminate"`.

```tsx
<Progress.Root aria-label="Loading">
  <Progress.Indicator />
</Progress.Root>
```

## Value label

`aria-valuetext` defaults to a rounded percentage (e.g. `"42%"`). Override it
with `getValueLabel` when a percentage isn't the most useful description:

```tsx
<Progress.Root
  value={3}
  max={10}
  getValueLabel={(value, max) => `${value} of ${max} files uploaded`}
  aria-label="Upload progress"
>
  <Progress.Indicator />
</Progress.Root>
```

## Accessibility

`Progress` is display-only — it is never focusable or interactive. Always give
the Root an accessible name with `aria-label` or `aria-labelledby`.

`max` must be a positive, finite number, and a numeric `value` must fall
between `0` and `max`. Both are validated — an out-of-range prop throws a
clear error rather than rendering a misleading bar.

## The Indicator

`Progress.Indicator` is the visual fill. It mirrors the Root's `data-state`,
`data-value`, and `data-max`, so its width can be driven with pure CSS — for
example via a custom property the consumer sets, or an inline `style`:

```tsx
<Progress.Root value={value} max={max} aria-label="Upload progress">
  <Progress.Indicator style={{ inlineSize: `${(value / max) * 100}%` }} />
</Progress.Root>
```

## `asChild` composition

Both sub-components accept `asChild`. The library's ARIA attributes and
`data-*` hooks are merged onto the consumer's element.

```tsx
<Progress.Root asChild value={50} aria-label="Upload progress">
  <section>…</section>
</Progress.Root>
```

## Styling hooks

| Attribute | Values | Set on |
|-----------|--------|--------|
| `data-state` | `"indeterminate"` \| `"loading"` \| `"complete"` | `Progress.Root`, `Progress.Indicator` |
| `data-value` | the resolved `value` (determinate only) | `Progress.Root`, `Progress.Indicator` |
| `data-max` | the resolved `max` | `Progress.Root`, `Progress.Indicator` |

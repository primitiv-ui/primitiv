# EmptyState

A stateless compound component for the placeholder shown when a
collection, search, or view has no content. Renders a polite
[`status`](https://www.w3.org/TR/wai-aria-1.2/#status) live region so a
conditionally-mounted empty state is announced. Zero styles ship.

```tsx
import { EmptyState } from "@primitiv-ui/react";

{
  results.length === 0 && (
    <EmptyState.Root>
      <EmptyState.Media>
        <SearchIcon />
      </EmptyState.Media>
      <EmptyState.Title>No results found</EmptyState.Title>
      <EmptyState.Description>
        Try adjusting your filters.
      </EmptyState.Description>
      <EmptyState.Actions>
        <button onClick={clearFilters}>Clear filters</button>
      </EmptyState.Actions>
    </EmptyState.Root>
  );
}
```

## Sub-components

All sub-components are stateless and optional — compose only the parts a
given empty state needs.

| Export                   | Renders                  | Notes                                                              |
| ------------------------ | ------------------------ | ------------------------------------------------------------------ |
| `EmptyState.Root`        | `<div role="status">`    | Polite live region wrapping the placeholder.                       |
| `EmptyState.Media`       | `<div aria-hidden>`      | Decorative icon/illustration slot — see [Media](#media).           |
| `EmptyState.Title`       | `<p>`                    | The headline — see [Title heading level](#title-heading-level).    |
| `EmptyState.Description` | `<p>`                    | Secondary supporting copy.                                         |
| `EmptyState.Actions`     | `<div>`                  | Groups recovery controls (buttons/links).                          |

`EmptyState` is also callable directly as an alias of `EmptyState.Root`.

## Props

Every sub-component accepts `asChild` plus all native props for the
element it renders:

| Prop      | Type      | Default | Notes                                                |
| --------- | --------- | ------- | ---------------------------------------------------- |
| `asChild` | `boolean` | `false` | Render the consumer's own element instead — see below |
| `...rest` | native    | —       | All props for the rendered element, including `aria-*` |

## Announce on appearance

`EmptyState.Root` renders `role="status"` — a polite live region with
implicit `aria-live="polite"` and `aria-atomic="true"`. Render the empty
state **conditionally**, in place of the absent content, so that when a
search or filter returns nothing the message is announced once the user
is idle:

```tsx
{
  results.length === 0 && <EmptyState.Root>No results found</EmptyState.Root>;
}
```

For an empty state that is part of the initial, static page — and so has
nothing to announce — opt out of the live region:

```tsx
<EmptyState.Root role={undefined}>…</EmptyState.Root>
```

## Media

Empty-state artwork is decorative: the `Title` and `Description` carry
the meaning. `EmptyState.Media` is therefore `aria-hidden` by default so
screen-reader users are not read a redundant image. If the artwork is
genuinely informative, opt back in and give it an accessible name:

```tsx
<EmptyState.Media aria-hidden={false}>
  <img src="/chart.svg" alt="Sales trending to zero" />
</EmptyState.Media>
```

## Title heading level

`EmptyState.Title` renders a `<p>` — a headless primitive cannot know
the correct heading level for the surrounding document outline. When the
empty state stands in for a titled section, promote the title to a real
heading with `asChild` so it joins the page's heading hierarchy:

```tsx
<EmptyState.Title asChild>
  <h2>No results found</h2>
</EmptyState.Title>
```

## asChild

Pass `asChild` to any sub-component to render the consumer's own element
instead of the default, merging in the sub-component's props (and, for
`Root` and `Media`, its `role` / `aria-hidden`) via the `Slot` utility:

```tsx
<EmptyState.Root asChild>
  <section>…</section>
</EmptyState.Root>
```

## Styling hooks

`EmptyState` emits no `data-*` attributes — it is a static layout
component. Style it with whatever system you use, targeting the rendered
elements directly or via your own `className`s:

```tsx
<EmptyState.Root className="empty-state">
  <EmptyState.Title className="empty-state__title">
    No results found
  </EmptyState.Title>
</EmptyState.Root>
```

---

[Back to @primitiv-ui/react](../../README.md)

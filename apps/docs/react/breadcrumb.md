---
title: Breadcrumb
---

# Breadcrumb

Headless, accessible **Breadcrumb** — a compound component implementing the
[WAI-ARIA breadcrumb pattern](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/):
a `<nav>` landmark wrapping an ordered list of links to ancestor pages, ending
with the current page. Stateless — purely structural. Zero styles ship.

```tsx
import { Breadcrumb } from "@primitiv-ui/react";

<Breadcrumb.Root>
  <Breadcrumb.List>
    <Breadcrumb.Item>
      <Breadcrumb.Link href="/">Home</Breadcrumb.Link>
    </Breadcrumb.Item>
    <Breadcrumb.Separator />
    <Breadcrumb.Item>
      <Breadcrumb.Link href="/library">Library</Breadcrumb.Link>
    </Breadcrumb.Item>
    <Breadcrumb.Separator />
    <Breadcrumb.Item>
      <Breadcrumb.Page>Current article</Breadcrumb.Page>
    </Breadcrumb.Item>
  </Breadcrumb.List>
</Breadcrumb.Root>;
```

## Sub-components

| Export | Element | ARIA hooks | `asChild` |
|--------|---------|------------|-----------|
| `Breadcrumb.Root` | `<nav>` | `aria-label="Breadcrumb"` (overridable) | — |
| `Breadcrumb.List` | `<ol>` | — | — |
| `Breadcrumb.Item` | `<li>` | — | — |
| `Breadcrumb.Link` | `<a>` | — | yes |
| `Breadcrumb.Page` | `<span>` | `aria-current="page"` | — |
| `Breadcrumb.Separator` | `<li>` | `role="presentation"`, `aria-hidden="true"` | — |

Every sub-component passes all of its element's native attributes straight
through to the DOM.

## Structure

A breadcrumb is an **ordered list** — its entries have a meaningful sequence
from the site root to the current page — wrapped in a `<nav>` landmark.

- The `<nav>` defaults to `aria-label="Breadcrumb"`, which is how assistive
  technology identifies the breadcrumb navigation landmark. Override it only
  if your product uses different terminology.
- The final entry is the **current page**, so it is a `Breadcrumb.Page`
  (a non-link `<span>`) rather than a `Breadcrumb.Link`.
- `Breadcrumb.Page` carries `aria-current="page"` to mark the user's current
  location.

## The current page

The last entry should always be a `Breadcrumb.Page`:

```tsx
<Breadcrumb.Item>
  <Breadcrumb.Page>Current article</Breadcrumb.Page>
</Breadcrumb.Item>
```

It renders a `<span aria-current="page">` — not a link — because the page the
user is already on is not a navigation target.

## Separators

`Breadcrumb.Separator` is a decorative `<li role="presentation" aria-hidden="true">`.
It sits inside the `<ol>` as a sibling of the items, but `role="presentation"`
removes it from the list semantics and `aria-hidden` hides it from the
accessibility tree — screen readers never announce it.

It defaults to a `"/"` glyph. Pass `children` to use a custom separator:

```tsx
<Breadcrumb.Separator>›</Breadcrumb.Separator>
<Breadcrumb.Separator><ChevronRight /></Breadcrumb.Separator>
```

## `asChild` composition

`Breadcrumb.Link` accepts `asChild` so it can render a routing library's link
component instead of a bare `<a>`. The breadcrumb link's props are merged onto
the consumer's element and the native `<a>` is dropped.

```tsx
import { Link as RouterLink } from "react-router-dom";

<Breadcrumb.Link asChild>
  <RouterLink to="/library">Library</RouterLink>
</Breadcrumb.Link>;
```

## Styling hooks

No styles ship with the component. Target the rendered elements directly or
pass a `className` to any sub-component:

```css
nav[aria-label="Breadcrumb"] ol {
  display: flex;
  gap: 0.5rem;
  list-style: none;
}

nav[aria-label="Breadcrumb"] [aria-current="page"] {
  font-weight: 600;
}
```

## Workbench example

Open the interactive version in the [workbench](/workbench/#/breadcrumb). Its source:

<<< ../../../apps/workbench/src/pages/BreadcrumbExample/BreadcrumbExample.tsx

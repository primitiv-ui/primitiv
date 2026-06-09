---
title: SkipNav
---

# SkipNav

A "skip to main content" link and its focus target, letting keyboard and
screen-reader users bypass repeated navigation. Implements the
[WCAG 2.4.1 Bypass Blocks](https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html)
technique.

```tsx
import { SkipNav } from "@primitiv-ui/react";

<>
  <SkipNav.Link>Skip to main content</SkipNav.Link>
  <header>…site navigation…</header>
  <SkipNav.Content>
    <main>…</main>
  </SkipNav.Content>
</>;
```

`SkipNav.Link` and `SkipNav.Content` are stateless siblings, not nested.
Render the link as the very first focusable element on the page and wrap
the main content in the target.

## How it works

`SkipNav.Link` is a plain in-page anchor: its `href` is a URL fragment
(`#primitiv-skip-nav`) pointing at the `id` of `SkipNav.Content`.
`SkipNav.Content` carries `tabIndex={-1}` so it is a valid focus
destination — following the link scrolls to it _and_ moves focus into it,
so the next <kbd>Tab</kbd> continues from the main content. No JavaScript
runs.

## Sub-components

### `SkipNav.Link`

Renders an `<a>`.

| Prop        | Type                              | Default             | Notes                                            |
| ----------- | --------------------------------- | ------------------- | ------------------------------------------------ |
| `contentId` | `string`                          | `"primitiv-skip-nav"` | Id of the target; `href` is derived as `#${contentId}` |
| `children`  | `ReactNode`                       | —                   | The visible link text                            |
| `...rest`   | `AnchorHTMLAttributes`            | —                   | All other `<a>` props, including `className`      |

### `SkipNav.Content`

Renders a `<div>` with `tabIndex={-1}`.

| Prop       | Type                  | Default               | Notes                                                  |
| ---------- | --------------------- | --------------------- | ------------------------------------------------------ |
| `id`       | `string`              | `"primitiv-skip-nav"` | Must match `SkipNav.Link`'s `contentId`                |
| `children` | `ReactNode`           | —                     | The main page content                                 |
| `...rest`  | `HTMLAttributes`      | —                     | All other `<div>` props                                |

## Matching a custom id

The default content id connects the pair with no configuration. To use a
custom id, set it on both sides:

```tsx
<SkipNav.Link contentId="main">Skip to main content</SkipNav.Link>
<SkipNav.Content id="main">
  <main>…</main>
</SkipNav.Content>
```

## Styling hooks

No styles ship with the component. The conventional pattern keeps the link
visually hidden until it receives focus, so it does not disrupt the visual
design but is the first thing a keyboard user reaches:

```css
a[href="#primitiv-skip-nav"] {
  position: absolute;
  left: -9999px;
}

a[href="#primitiv-skip-nav"]:focus {
  left: 0;
  top: 0;
}
```

Or pass a `className` and target that instead. Do **not** use
`display: none` or `visibility: hidden` — those remove the link from the
tab order, defeating its purpose.

## Workbench example

Open the interactive version in the [workbench](/workbench/#/skip-nav). Its source:

<<< ../../../apps/workbench/src/pages/SkipNavExample/SkipNavExample.tsx

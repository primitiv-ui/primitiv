# AccessibleIcon

Gives an icon-only control an accessible name, following the
[icon accessibility guidance](https://www.sarasoueidan.com/blog/accessible-icon-buttons/).

```tsx
import { AccessibleIcon } from "@primitiv/react";

<button>
  <AccessibleIcon label="Close dialog">
    <CloseIcon />
  </AccessibleIcon>
</button>;
```

## Props

| Prop       | Type           | Default | Notes                                                          |
| ---------- | -------------- | ------- | -------------------------------------------------------------- |
| `label`    | `string`       | —       | Text announced as the icon's accessible name (**required**)    |
| `children` | `ReactElement` | —       | A single icon element, e.g. an `<svg>` (**required**)          |

## What it does

`AccessibleIcon` takes a single icon element and:

- clones it with `aria-hidden="true"`, removing the purely decorative
  graphic from the accessibility tree;
- clones it with `focusable="false"`, so legacy browsers do not place
  the `<svg>` in the tab order;
- renders the `label` text alongside it inside a `VisuallyHidden` span.

Place it inside an interactive element (a `<button>`, an `<a>`, etc.) —
the visually hidden label becomes that element's accessible name, so a
screen reader announces "Close dialog, button" rather than nothing.

The icon stays the only thing visible on screen.

## Single child only

`children` must be exactly one element. Passing zero, multiple, or a
plain string throws — wrap the glyph in a single `<svg>` or component.

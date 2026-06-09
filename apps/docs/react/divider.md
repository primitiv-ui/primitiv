---
title: Divider
---

# Divider

A visual and semantic separator between content sections, implementing the
[WAI-ARIA separator role](https://www.w3.org/TR/wai-aria-1.2/#separator).

```tsx
import { Divider } from "@primitiv-ui/react";

<Divider />;
```

## Props

| Prop          | Type                           | Default        | Notes                                        |
| ------------- | ------------------------------ | -------------- | -------------------------------------------- |
| `orientation` | `"horizontal"` \| `"vertical"` | `"horizontal"` | Sets `aria-orientation` on the element       |
| `className`   | `string`                       | `""`           | Applied directly to the rendered element     |
| `...rest`     | `ComponentProps<"span">`       | —              | All other `<span>` props, including `aria-*` |

## Decorative use

When the divider is purely visual and carries no semantic meaning, pass
`aria-hidden="true"` to remove it from the accessibility tree:

```tsx
<Divider aria-hidden="true" />
```

Without `aria-hidden`, screen readers will announce the element as a
separator. Use the semantic form when the divider genuinely separates
distinct content groups (e.g. navigation sections, menu items).

## Styling hooks

No styles ship with the component. Target the rendered element with the
`aria-orientation` attribute selector:

```css
[role="separator"][aria-orientation="horizontal"] {
  height: 1px;
  width: 100%;
  background: currentColor;
}

[role="separator"][aria-orientation="vertical"] {
  width: 1px;
  height: 100%;
  background: currentColor;
}
```

Or pass a `className`:

```tsx
<Divider className="my-divider" />
<Divider orientation="vertical" className="my-divider--vertical" />
```

## Workbench example

Open the interactive version in the [workbench](/workbench/#/divider). Its source:

<<< ../../../apps/workbench/src/pages/DividerExample/DividerExample.tsx

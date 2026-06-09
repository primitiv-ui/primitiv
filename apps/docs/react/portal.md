---
title: Portal
---

# Portal

A utility component that renders its children outside the current React subtree
using React's [`createPortal`](https://react.dev/reference/react-dom/createPortal).
Use it whenever a subtree needs to escape its parent's stacking context, overflow
clipping, or z-index hierarchy — tooltips, modals, dropdowns, and similar overlays
are typical candidates.

## Usage

### Default — mount into `document.body`

```tsx
import { Portal } from "@primitiv-ui/react";

<Portal>
  <div role="dialog" aria-modal="true">
    Modal content rendered directly in document.body
  </div>
</Portal>
```

### Custom container

Pass any `HTMLElement` as `container` to mount into a specific node instead of
`document.body`:

```tsx
const overlayRoot = document.getElementById("overlay-root");

<Portal container={overlayRoot}>
  <div role="tooltip">Tooltip content</div>
</Portal>
```

### Composing with conditional rendering

`Portal` always renders when mounted. Control visibility by conditionally
rendering the `Portal` itself, or by wrapping it with open/closed logic:

```tsx
{isOpen && (
  <Portal>
    <div role="dialog">…</div>
  </Portal>
)}
```

For CSS-driven exit animations, keep the portal in the DOM and drive styles
from a `data-state` attribute:

```tsx
<Portal>
  <div data-state={isOpen ? "open" : "closed"}>…</div>
</Portal>
```

## Props

| Prop        | Type          | Default          | Description                                          |
| ----------- | ------------- | ---------------- | ---------------------------------------------------- |
| `children`  | `ReactNode`   | —                | Content to render inside the portal                  |
| `container` | `HTMLElement` | `document.body`  | DOM node to mount into                               |

## Notes

- `Portal` is a thin wrapper; it carries no state, context, or open/close
  awareness of its own. Those concerns belong in the component that composes it.
- `Modal.Portal` internally uses this component and adds open-state suppression
  and `forceMount` on top.

## Workbench example

Open the interactive version in the [workbench](/workbench/#/portal). Its source:

<<< ../../../apps/workbench/src/pages/PortalExample/PortalExample.tsx

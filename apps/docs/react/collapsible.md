---
title: Collapsible
---

# Collapsible

A compound component for showing and hiding a single panel of content.
The single-item analogue of [Accordion](../Accordion/README.md).

```tsx
import { Collapsible } from "@primitiv-ui/react";

<Collapsible.Root defaultOpen>
  <Collapsible.Trigger>Toggle</Collapsible.Trigger>
  <Collapsible.Content>
    The content revealed by the trigger.
  </Collapsible.Content>
</Collapsible.Root>;
```

## Sub-components

| Export                    | Role          | Notes                                                                                                              |
| ------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------ |
| `Collapsible.Root`        | State owner   | Uncontrolled (`defaultOpen`) or controlled (`open` + `onOpenChange`); `disabled` short-circuits Trigger activation |
| `Collapsible.Trigger`     | Toggle button | Supports `asChild`, ref forwarding, explicit Enter/Space handling                                                  |
| `Collapsible.Content`     | Hidden panel  | Hidden via the `hidden` attribute; supports `forceMount` for CSS animation                                         |
| `Collapsible.TriggerIcon` | Icon wrapper  | Injects `aria-hidden` and `data-state` onto a decorative icon                                                      |

## Keyboard interaction

| Key               | Behaviour              |
| ----------------- | ---------------------- |
| `Enter` / `Space` | Toggle the collapsible |

`<button>` activates on `Enter` and `Space` natively. The Trigger also
handles both keys explicitly so that `asChild` rendering on non-button
elements (anchors, divs, custom components) still toggles correctly.
`preventDefault` suppresses native activation (e.g. an anchor following
its `href`) so the toggle never double-fires.

## State modes

- **Uncontrolled** — pass `defaultOpen` (or omit to start closed).
  `onOpenChange` is optional and fires on every toggle.
- **Controlled** — pass `open` and `onOpenChange` together. The parent
  owns the value; the component defers every state change back through
  the callback.

The two shapes are discriminated at the type level: passing `defaultOpen`
alongside `open` is a type error.

Unlike `Accordion`, `Collapsible` fires `onOpenChange` in **both** modes.

## Disabled

Pass `disabled` on `Collapsible.Root` to render `aria-disabled="true"` on
the Trigger (without the native `disabled` attribute, so it remains
focusable for keyboard discovery) and short-circuit click and keyboard
activation:

```tsx
<Collapsible.Root disabled>
  <Collapsible.Trigger>Toggle</Collapsible.Trigger>
  <Collapsible.Content>Currently unavailable.</Collapsible.Content>
</Collapsible.Root>
```

`data-disabled` is mirrored onto Root, Trigger, and Content so a single
`[data-disabled="true"]` selector covers every sub-component.

## `forceMount` for CSS animations

By default the content panel is removed from accessibility and visual
rendering via the `hidden` attribute. Pass `forceMount` to keep it in the
DOM and drive open/close visually with CSS. The recommended pattern uses
CSS Grid so consumers don't have to measure content height in JavaScript:

```tsx
<Collapsible.Content forceMount className="panel">
  Content that animates open and closed.
</Collapsible.Content>
```

```css
.panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 250ms ease;
}
.panel[data-state="open"] {
  grid-template-rows: 1fr;
}
.panel > * {
  overflow: hidden;
}
```

When `forceMount` is active and the panel is closed, `aria-hidden="true"`
is applied automatically so assistive technology skips the off-screen
content. It is removed when the panel opens. Consumers can override this
by passing `aria-hidden` explicitly.

## `asChild` composition

`Collapsible.Trigger` accepts an `asChild` prop to render any child
element with full collapsible semantics. All ARIA attributes, event
handlers, and the internal ref are merged onto the child (child handler
runs first, then the trigger's):

```tsx
<Collapsible.Trigger<HTMLAnchorElement> asChild>
  <a href="#section">Toggle</a>
</Collapsible.Trigger>
```

`Enter` and `Space` are handled in `onKeyDown` so non-button elements
(e.g. `<a>`, `<div>`) toggle correctly without relying on native click
behaviour. `preventDefault` suppresses native activation so an anchor
doesn't follow its `href` while toggling.

When `asChild` is combined with `disabled`, `role="button"` is injected
automatically so that `aria-disabled` is semantically valid on non-button
elements:

```tsx
<Collapsible.Root disabled>
  <Collapsible.Trigger asChild>
    <a href="#section">Toggle</a>
    {/* rendered with role="button" aria-disabled="true" */}
  </Collapsible.Trigger>
  <Collapsible.Content>…</Collapsible.Content>
</Collapsible.Root>
```

## Trigger icon

Wrap a decorative icon in `Collapsible.TriggerIcon` to hide it from
assistive technology and expose a `data-state` hook for rotation
animations. The child can be any renderable React content — an inline
`<svg>`, a component from a third-party icon library (lucide-react,
react-icons, etc.), or a custom icon component. `aria-hidden` and
`data-state` are placed on a wrapping `<span>`, so they work regardless
of whether the icon component forwards unknown props.

```tsx
import { ChevronDown } from "lucide-react";

<Collapsible.Trigger>
  Toggle
  <Collapsible.TriggerIcon>
    <ChevronDown />
  </Collapsible.TriggerIcon>
</Collapsible.Trigger>;
```

## Styling hooks

```css
/* Trigger open/closed — rotate a chevron icon */
[data-state="open"] .chevron {
  transform: rotate(180deg);
}

/* Content panel — animate via CSS Grid (see forceMount above) */
.panel[data-state="closed"] {
  grid-template-rows: 0fr;
}

/* Disabled trigger */
[aria-disabled="true"] {
  opacity: 0.5;
  cursor: not-allowed;
}
```

`data-state` (`"open"` | `"closed"`) and `data-disabled` (`"true"` |
`"false"`) are available on every rendered sub-component.

## Workbench example

Open the interactive version in the [workbench](/workbench/#/collapsible). Its source:

<<< ../../../apps/workbench/src/pages/CollapsibleExample/CollapsibleExample.tsx

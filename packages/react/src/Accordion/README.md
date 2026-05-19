# Accordion

A compound component implementing the
[WAI-ARIA Accordion pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/).

```tsx
import { Accordion } from "@primitiv/react";

<Accordion.Root defaultValue="shipping">
  <Accordion.Item value="shipping">
    <Accordion.Header>
      <Accordion.Trigger>Shipping policy</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Content>Free on orders over £50.</Accordion.Content>
  </Accordion.Item>
  <Accordion.Item value="returns">
    <Accordion.Header>
      <Accordion.Trigger>Returns</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Content>30-day returns accepted.</Accordion.Content>
  </Accordion.Item>
</Accordion.Root>;
```

## Sub-components

| Export                  | Role           | Notes                                                                   |
| ----------------------- | -------------- | ----------------------------------------------------------------------- |
| `Accordion.Root`        | State owner    | Uncontrolled (`defaultValue`) or controlled (`value` + `onValueChange`) |
| `Accordion.Item`        | Item wrapper   | Owns the trigger–panel pair; optional `value` prop                      |
| `Accordion.Header`      | Heading        | Configurable level (`h1`–`h6`); defaults to `h3`                        |
| `Accordion.Trigger`     | Toggle button  | Supports `asChild`, ref forwarding, and `disabled`                      |
| `Accordion.Content`     | `region` panel | Supports `forceMount` for CSS animation                                 |
| `Accordion.TriggerIcon` | Icon wrapper   | Injects `aria-hidden` and `data-state` onto a decorative icon           |

## Keyboard interaction

| Key               | Behaviour                                         |
| ----------------- | ------------------------------------------------- |
| `Enter` / `Space` | Toggle the focused item                           |
| `ArrowDown`       | Move focus to next trigger (vertical orientation) |
| `ArrowUp`         | Move focus to previous trigger (vertical)         |
| `ArrowRight`      | Move focus to next trigger (horizontal)           |
| `ArrowLeft`       | Move focus to previous trigger (horizontal)       |
| `Home`            | Jump to first enabled trigger                     |
| `End`             | Jump to last enabled trigger                      |

Focus movement **wraps** at the ends. Disabled triggers are excluded from
arrow-key navigation but remain focusable via `Tab`.

## State modes

- **Uncontrolled** — pass `defaultValue` (or omit to start with all items collapsed).
- **Controlled** — pass `value` (a `string[]`) and `onValueChange` together.

## Multiple mode

By default only one item can be open at a time — opening a second item
collapses the first. Pass `multiple` to allow any number of items open
simultaneously:

```tsx
<Accordion.Root multiple defaultValue="shipping">
  …
</Accordion.Root>
```

## Disabled items

Disabled triggers are rendered with `aria-disabled="true"` (not the native
`disabled` attribute) so they remain focusable for keyboard discovery:

```tsx
<Accordion.Trigger disabled>Unavailable section</Accordion.Trigger>
```

## `forceMount` for animations

By default the content panel is hidden with the `hidden` attribute. Pass
`forceMount` to keep the panel in the DOM and control visibility via CSS:

```tsx
<Accordion.Content forceMount className="panel">
  Content that animates in and out.
</Accordion.Content>
```

```css
.panel[data-state="closed"] {
  display: none; /* or use an animation */
}
```

When `forceMount` is active and the panel is closed, `aria-hidden="true"` is
applied automatically so assistive technology skips the off-screen content.
It is removed when the panel opens. Consumers can override this by passing
`aria-hidden` explicitly.

## `role="region"` escape hatch

Each `Accordion.Content` renders with `role="region"`, creating an ARIA
landmark. This is appropriate for panels whose content benefits from
landmark navigation, but accordions with many items can produce landmark
overload in screen readers (JAWS/NVDA expose all landmarks in their landmark
list).

Opt out on individual panels by passing `role={undefined}`:

```tsx
<Accordion.Content role={undefined}>
  Simple prose that doesn't need landmark navigation.
</Accordion.Content>
```

## `asChild` composition

`Accordion.Trigger` accepts an `asChild` prop to render any child element
with full accordion semantics. All ARIA attributes, event handlers, and
the internal ref are merged onto the child (child handler runs first, then
the trigger's):

```tsx
<Accordion.Trigger asChild>
  <a href="#shipping">Shipping policy</a>
</Accordion.Trigger>
```

`Enter` and `Space` are handled in `onKeyDown` so non-button elements (e.g.
`<a>`) toggle correctly without relying on native click behaviour.

When `asChild` is combined with `disabled`, `role="button"` is injected
automatically so that `aria-disabled` is semantically valid on non-button
elements. Without a button role, `aria-disabled` has no defined meaning:

```tsx
<Accordion.Trigger asChild disabled>
  <a href="#shipping">Temporarily unavailable</a>
  {/* rendered with role="button" aria-disabled="true" */}
</Accordion.Trigger>
```

## Trigger icon

Wrap a decorative icon in `Accordion.TriggerIcon` to hide it from assistive
technology and expose a `data-state` hook for rotation animations. The child
can be any renderable React content — an inline `<svg>`, a component from
a third-party icon library (lucide-react, react-icons, etc.), or a custom
icon component. `aria-hidden` and `data-state` are placed on a wrapping
`<span>`, so they work regardless of whether the icon component forwards
unknown props.

```tsx
import { ChevronDown } from "lucide-react";

<Accordion.Trigger>
  Shipping policy
  <Accordion.TriggerIcon>
    <ChevronDown />
  </Accordion.TriggerIcon>
</Accordion.Trigger>;
```

## Reading direction (RTL)

Pass `dir="rtl"` on `Accordion.Root` combined with `orientation="horizontal"`
to invert the arrow-key direction so `ArrowLeft` moves forward and
`ArrowRight` moves backward, matching right-to-left reading order:

```tsx
<Accordion.Root orientation="horizontal" dir="rtl">
  …
</Accordion.Root>
```

When `dir` is omitted, it is inherited from the nearest
[`DirectionProvider`](../DirectionProvider/README.md), falling back to `"ltr"`
when there is no provider. An explicit `dir` prop always wins over the
inherited value.

## Styling hooks

```css
/* Trigger open/closed */
[data-state="open"] .chevron {
  transform: rotate(180deg);
}

/* Content panel */
[role="region"][data-state="closed"] {
  display: none;
}

/* Disabled trigger */
[aria-disabled="true"] {
  opacity: 0.5;
  cursor: not-allowed;
}
```

`data-state` (`"open"` | `"closed"`), `data-disabled` (`"true"` | `"false"`),
and `data-orientation` (`"vertical"` | `"horizontal"`) are available on
relevant rendered elements.

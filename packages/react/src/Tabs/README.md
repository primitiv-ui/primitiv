# Tabs

A compound component implementing the
[WAI-ARIA Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

```tsx
import { Tabs } from "@primitiv-ui/react";

<Tabs.Root defaultValue="overview">
  <Tabs.List label="Account sections">
    <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
    <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="overview">Dashboard…</Tabs.Content>
  <Tabs.Content value="settings">Preferences…</Tabs.Content>
</Tabs.Root>;
```

## Sub-components

| Export         | Role        | Notes                                                                        |
| -------------- | ----------- | ---------------------------------------------------------------------------- |
| `Tabs.Root`    | State owner | Uncontrolled (`defaultValue`) or controlled (`value` + `onValueChange`)      |
| `Tabs.List`    | `tablist`   | Requires `label` or `ariaLabelledBy` for accessibility                       |
| `Tabs.Trigger` | `tab`       | Supports `asChild` to render any element with tab semantics                  |
| `Tabs.Content` | `tabpanel`  | Stays mounted when inactive; use `lazyMount` or conditional rendering for deferred/unmount semantics |

## Keyboard interaction

| Key                        | Behaviour                                         |
| -------------------------- | ------------------------------------------------- |
| `ArrowRight` / `ArrowLeft` | Move between triggers (horizontal tabs)           |
| `ArrowDown` / `ArrowUp`    | Move between triggers (vertical tabs)             |
| `Home` / `End`             | Jump to first / last trigger                      |
| `Enter` / `Space`          | Activate focused trigger (manual activation mode) |
| `Tab`                      | Move from tablist into the active panel           |

## Reading direction

Pass `dir` (`"ltr"` / `"rtl"`) to set the arrow-key direction for horizontal
tabs and the container's `dir` attribute. When `dir` is omitted, it is
inherited from the nearest [`DirectionProvider`](../DirectionProvider/README.md),
falling back to `"ltr"` when there is no provider. An explicit `dir` prop
always wins over the inherited value.

## State modes

- **Uncontrolled** — pass `defaultValue` (or omit for no initial selection).
- **Controlled** — pass `value` and `onValueChange` together.

## Activation modes

- `activationMode="automatic"` (default) — arrow keys immediately activate the panel.
- `activationMode="manual"` — arrow keys move focus only; `Enter`/`Space` confirms.

## Lazy mounting

Pass `lazyMount` on `Tabs.Root` to defer rendering a panel's children until
that tab is first activated. Once mounted, children remain in the DOM across
subsequent tab switches (lazy mount, not unmount-on-hide). The
`<div role="tabpanel">` wrapper always renders so the ARIA relationship between
trigger and panel is always present.

```tsx
<Tabs.Root defaultValue="overview" lazyMount>
  …
</Tabs.Root>
```

This is useful when a panel owns expensive initialisation that depends on the
element being visible — for example, a scroll-snap carousel whose initial scroll
position must be computed while the panel has real dimensions.

## Imperative API

```tsx
const ref = useRef<TabsImperativeApi>(null);
<Tabs.Root ref={ref} defaultValue="a">
  …
</Tabs.Root>;
ref.current?.setActiveTab("b");
```

## `asChild` composition

`Tabs.Trigger` accepts an `asChild` prop to render any child element with
full tab semantics. All ARIA attributes, event handlers, and the roving
`tabIndex` are merged onto the child following the asChild composition
pattern (child handler runs first, then the trigger's):

```tsx
<Tabs.Trigger asChild value="settings">
  <Link to="/settings">Settings</Link>
</Tabs.Trigger>
```

## Styling hooks

```css
[role="tab"][data-state="active"] {
  border-bottom: 2px solid currentColor;
}
[role="tabpanel"][data-state="active"] {
  display: block;
}
```

Both `data-state` (`"active"` | `"inactive"`) and
`data-orientation` (`"horizontal"` | `"vertical"`) are available on
every rendered element.

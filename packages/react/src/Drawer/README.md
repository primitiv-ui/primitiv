# Drawer

A headless, accessible **dialog that slides in from a screen edge** — a
settings panel, a filter sheet, a navigation drawer, a cart. Behaviourally it
_is_ [Modal](../Modal/README.md): it reuses the same native
[`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) +
`showModal()` machinery, so focus trapping, the inert background, top-layer
stacking, and `Esc`-to-close are handled by the browser. The single addition is
a **`side`** axis on `Drawer.Content` that says which edge the panel enters from.

```tsx
import { Drawer } from "@primitiv-ui/react";

<Drawer.Root>
  <Drawer.Trigger>Filters</Drawer.Trigger>
  <Drawer.Portal>
    <Drawer.Overlay />
    <Drawer.Content side="right">
      <Drawer.Title>Filters</Drawer.Title>
      <Drawer.Description>Narrow the results below.</Drawer.Description>
      {/* body */}
      <Drawer.Close>Done</Drawer.Close>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>;
```

## Relationship to Modal

Drawer is a **thin composition over Modal** — every sub-component renders its
`Modal.*` counterpart and inherits its behaviour and props verbatim. There is no
separate state machine, context, or focus logic to learn or maintain: a fix to
Modal is a fix to Drawer. The _only_ behavioural surface that differs is
`Drawer.Content`'s `side` prop. If you need a centred dialog rather than an
edge-anchored one, use [Modal](../Modal/README.md) directly.

The visual difference — the panel spanning an edge and sliding in — is a
**styling concern**, driven by the `data-side` hook below, not by this headless
layer. Panel size is likewise a styling concern (a `size` variant on the styled
distribution), not a headless prop.

## Sub-components

| Export                | Element / role       | Notes                                                                          |
| --------------------- | -------------------- | ------------------------------------------------------------------------------ |
| `Drawer.Root`         | State owner          | Uncontrolled (`defaultOpen`) or controlled (`open` + `onOpenChange`); exposes the imperative API via `ref` |
| `Drawer.Trigger`      | `<button>`           | `aria-haspopup="dialog"` / `aria-expanded` / `aria-controls`; `asChild`         |
| `Drawer.Portal`       | `createPortal`       | `container?` (default `document.body`); `forceMount`                             |
| `Drawer.Overlay`      | `<div>` (sibling)    | Decorative backdrop — **not** the click-outside surface (see Modal); `asChild`, `forceMount` |
| `Drawer.Content`      | `<dialog>`           | The sliding panel; adds the `side` axis; escape hatches + auto-ARIA. `asChild` **not** supported |
| `Drawer.Title`        | `<h2>`               | Accessible name; auto-wires `aria-labelledby`; `asChild`                        |
| `Drawer.Description`  | `<p>`                | Accessible description; auto-wires `aria-describedby`; `asChild`                 |
| `Drawer.Close`        | `<button>`           | Composes `onClick` with close; `asChild`                                         |

## The `side` axis

`Drawer.Content` accepts **`side`** — `"top" | "right" | "bottom" | "left"`,
default `"right"`. It is emitted verbatim as **`data-side`** on the `<dialog>`
and changes no behaviour, focus, or ARIA — it exists purely so the styling layer
can position and animate the panel against the right edge:

```tsx
<Drawer.Content side="bottom">…</Drawer.Content>
// → <dialog data-side="bottom" data-state="open" …>
```

```css
dialog[data-side="right"] {
  inset: 0 0 0 auto;
  block-size: 100dvh;
}
dialog[data-side="bottom"] {
  inset: auto 0 0 0;
  inline-size: 100vw;
}
```

## State, focus, keyboard, escape hatches

All identical to [Modal](../Modal/README.md) — see its README for the full
detail:

- **State modes** — uncontrolled `defaultOpen`, or controlled `open` +
  `onOpenChange` (statically discriminated; mixing them is a type error).
- **Imperative API** — `ref.current?.open()` / `.close()` on `Drawer.Root`
  (`DrawerImperativeApi`). In controlled mode these delegate to `onOpenChange`.
- **Keyboard** — `Esc` closes (native `cancel`), `Tab` is trapped by the native
  modal dialog.
- **Escape hatches** — `onEscapeKeyDown` and `onPointerDownOutside` on
  `Drawer.Content`; call `event.preventDefault()` to keep the drawer open.
- **Click-outside** — detected on the dialog itself (the `::backdrop` sits above
  a sibling `Drawer.Overlay`), exactly as in Modal.

## Animation hooks

`Drawer.Portal` and `Drawer.Overlay` accept `forceMount` to keep the subtree in
the DOM while `open` is false, so a CSS slide-out can play against
`data-state="closed"` before unmount. Combine `data-state` with `data-side` to
drive direction-aware transforms:

```css
dialog[data-side="right"][data-state="closed"] {
  translate: 100% 0;
}
dialog[data-side="right"][data-state="open"] {
  translate: 0 0;
}
```

## Styling hooks

- `data-state="open" | "closed"` on `Drawer.Content` (and `Drawer.Overlay`).
- `data-side="top" | "right" | "bottom" | "left"` on `Drawer.Content`.
- `aria-expanded` on the trigger tracks the same open state.

## `asChild` composition

Every rendered sub-component except `Drawer.Content` accepts `asChild` to project
its behaviour onto a consumer element via [Slot](../Slot.tsx), exactly as in
Modal. `Drawer.Content` is intentionally not slot-able — its native `<dialog>` is
what provides the focus trap and inert background.

# Popover

A headless, accessible **non-modal dialog** anchored to a trigger, built on the
native HTML [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)
(`popover="auto"`). The browser owns the top layer and light-dismiss; the
background stays interactive. For a modal dialog that traps focus and inerts the
page, use [Modal](../Modal/README.md) instead.

```tsx
import { Popover } from "@primitiv-ui/react";

<Popover.Root>
  <Popover.Trigger>Filters</Popover.Trigger>
  <Popover.Content>
    <Popover.Title>Filters</Popover.Title>
    <Popover.Description>Narrow the results below.</Popover.Description>
    <Popover.Close>Done</Popover.Close>
  </Popover.Content>
</Popover.Root>;
```

## Sub-components

| Export                 | Role                  | Notes                                                                                     |
| ---------------------- | --------------------- | ----------------------------------------------------------------------------------------- |
| `Popover.Root`         | State owner           | Uncontrolled (`defaultOpen`) or controlled (`open` + `onOpenChange`); renders no DOM       |
| `Popover.Trigger`      | Toggle button         | `<button>` with `aria-haspopup="dialog"` / `aria-expanded` / `aria-controls`; `asChild`   |
| `Popover.Anchor`       | Positioning reference | Optional `<div>` to anchor against instead of the trigger; `asChild`                       |
| `Popover.Content`      | Floating panel        | Native-popover `<div role="dialog">`; manages focus + Escape; `asChild`, ref-composing     |
| `Popover.Close`        | Close button          | Composes `onClick` with close + focus return; `asChild`                                    |
| `Popover.Title`        | Accessible name        | `<h2>`; auto-wires `aria-labelledby`; `asChild`                                           |
| `Popover.Description`  | Accessible description | `<p>`; auto-wires `aria-describedby`; `asChild`                                            |

## State modes

- **Uncontrolled** — pass `defaultOpen` (or omit to start closed). `onOpenChange`
  is optional and fires on every transition.
- **Controlled** — pass `open` and `onOpenChange` together. The parent owns the
  value; the component defers every change back through the callback.

The two shapes are discriminated at the type level: passing `defaultOpen`
alongside `open` is a type error.

## Focus & keyboard

| Key      | Behaviour                                      |
| -------- | ---------------------------------------------- |
| `Escape` | Closes the popover, returns focus to the trigger |

On open, focus moves into the panel — to the first focusable descendant, or to
the `Popover.Content` element itself (it carries `tabIndex={-1}`) when it has
none. Closing via `Escape` or `Popover.Close` returns focus to the trigger.
There is **no focus trap**: the popover is non-modal and the rest of the page
remains reachable.

## Light-dismiss

Because `Popover.Content` uses `popover="auto"`, the browser light-dismisses it
on an outside click or `Escape` and promotes it to the top layer. The component
listens for the native `toggle` event to keep React state in sync, with a
document-click fallback for environments that don't dispatch it (e.g. jsdom).

## Positioning

Placement is a **CSS concern** — no floating-ui, no JS measurement. Use CSS
anchor positioning: give the trigger (or `Popover.Anchor`) an `anchor-name` and
`Popover.Content` a matching `position-anchor`, then place it with
`position-area` / `position-try-fallbacks`. Reach for `Popover.Anchor` when the
panel should be anchored to something other than the trigger — e.g. a whole
input group whose trigger is a small button.

```tsx
<Popover.Root>
  <Popover.Anchor asChild>
    <div className="field" style={{ anchorName: "--popover" }}>
      <input aria-label="Amount" />
      <Popover.Trigger aria-label="Options">▾</Popover.Trigger>
    </div>
  </Popover.Anchor>
  <Popover.Content /* position-anchor: --popover in CSS */>…</Popover.Content>
</Popover.Root>;
```

## `asChild` composition

Every rendered sub-component accepts `asChild` to project its behaviour onto a
consumer element via [Slot](../Slot.tsx): event handlers compose (child first,
then the library's, unless the child calls `event.preventDefault()`), `style`
is shallow-merged, `className` strings concatenate, and refs compose. On
`Popover.Content`, a consumer `ref` composes with the internal ref so open state
keeps working.

## Styling hooks

- `data-state="open" | "closed"` on `Popover.Content`.
- `aria-expanded` on the trigger tracks the same state.

> **Gotcha — don't set `display` on the closed panel.** A closed popover is
> hidden by the UA rule `[popover]:not(:popover-open) { display: none }`. An
> author `display` (e.g. `display: flex` for layout) overrides it and leaves the
> panel visible while closed. Put layout `display` behind `:popover-open`:
>
> ```css
> .panel { padding: 12px; /* no display here */ }
> .panel:popover-open { display: flex; flex-direction: column; gap: 8px; }
> ```

---
title: Tooltip
---

# Tooltip

A headless, accessible compound component implementing the
[WAI-ARIA Tooltip pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/).

Tooltip is built as a pure React state machine with no floating-UI or
measurement dependency. Positioning is fully the consumer's responsibility
via CSS Anchor Positioning — the component emits no inline styles.

- Hover and focus open/close with configurable delay.
- Provider-level skip-delay: a second tooltip opens instantly when one is
  already open and the cursor moves between triggers.
- Grace period: 100 ms after leaving the trigger lets users move the cursor
  into the tooltip content without it closing.
- `onEscapeKeyDown` and `onPointerDownOutside` escape hatches.
- Portal support for breaking out of stacking contexts.
- `forceMount` on Portal and Content for CSS exit animations.
- `asChild` composition on Trigger and Arrow.

```tsx
import { Tooltip } from "@primitiv-ui/react";

<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger className="save-btn">Save</Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Content className="tooltip">
        Save your changes
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
</Tooltip.Provider>
```

## Sub-components

| Export              | Element          | Notes                                                                                                  |
| ------------------- | ---------------- | ------------------------------------------------------------------------------------------------------ |
| `Tooltip.Provider`  | context provider | Sets `delayDuration` (default 700 ms) and `skipDelayDuration` (default 300 ms) for all descendants    |
| `Tooltip.Root`      | context provider | Owns open state per tooltip. `open`, `defaultOpen`, `onOpenChange`, `delayDuration`, `disableHoverableContent` |
| `Tooltip.Trigger`   | `<button>`       | Wires `aria-describedby`, hover/focus handlers. `asChild`                                              |
| `Tooltip.Portal`    | `createPortal`   | `container?: HTMLElement` (default `document.body`). `forceMount`                                      |
| `Tooltip.Content`   | `<div role="tooltip">` | `data-state`. Escape hatches for Esc / pointer-down-outside. `forceMount`                       |
| `Tooltip.Arrow`     | `<span>`         | Optional visual pointer. All positioning via consumer CSS. `asChild`                                   |

## Keyboard interaction

| Key   | Behaviour                                                                |
| ----- | ------------------------------------------------------------------------ |
| `Tab` | Moves focus to the trigger; opens the tooltip immediately (no delay)     |
| `Tab` (away) | Closes the tooltip immediately                                  |
| `Esc` | Closes the tooltip. Preventable via `onEscapeKeyDown`                    |

## State modes

- **Uncontrolled** — pass `defaultOpen` (or omit for closed on mount).
- **Controlled** — pass `open` and `onOpenChange` together.

The two shapes are statically discriminated at the type level.

```tsx
// Uncontrolled
<Tooltip.Root defaultOpen>…</Tooltip.Root>

// Controlled
const [open, setOpen] = useState(false);
<Tooltip.Root open={open} onOpenChange={setOpen}>
  …
</Tooltip.Root>
```

## Delay and skip-delay

`delayDuration` (default 700 ms) controls how long the pointer must rest on
the trigger before the tooltip opens. Set it on `Tooltip.Provider` to apply
globally, or on an individual `Tooltip.Root` to override.

`skipDelayDuration` (default 300 ms) controls the "skip window". Once one
tooltip is open, moving to any other trigger opens it instantly. After the
last tooltip closes, the skip window is active for `skipDelayDuration` ms
before the normal delay resumes.

```tsx
<Tooltip.Provider delayDuration={400} skipDelayDuration={150}>
  …
</Tooltip.Provider>
```

## Hoverable content

By default, users can move the cursor from the trigger into the tooltip
content without it closing (a 100 ms grace period bridges the gap). Set
`disableHoverableContent` on `Tooltip.Root` to close the tooltip immediately
when the cursor leaves the trigger:

```tsx
<Tooltip.Root disableHoverableContent>
  …
</Tooltip.Root>
```

## Escape hatches

Both close paths — Escape and pointer-down-outside — fire observable
callbacks on `Tooltip.Content`. Call `event.preventDefault()` to keep the
tooltip open:

```tsx
<Tooltip.Content
  onEscapeKeyDown={(event) => {
    event.preventDefault(); // keep open when Escape is pressed
  }}
  onPointerDownOutside={(event) => {
    event.preventDefault(); // keep open when clicking outside
  }}
>
  …
</Tooltip.Content>
```

## CSS anchor positioning

This component is headless — it applies **no inline styles** and no
positioning logic. Position the tooltip with CSS Anchor Positioning:

```css
/* Trigger declares an anchor name */
.my-trigger {
  anchor-name: --my-tooltip;
}

/* Content attaches to that anchor */
.my-tooltip {
  position: absolute;
  position-anchor: --my-tooltip;
  position-area: top;
  position-try-fallbacks: bottom, left, right;
  margin-bottom: 8px;
}
```

For multiple tooltips on a page, assign each trigger/content pair a
distinct `anchor-name`. A data attribute or CSS `:nth-child` selector
can automate this without per-element class names.

## Arrow

`Tooltip.Arrow` renders a `<span>` (or a custom element via `asChild`).
Arrow position is entirely consumer CSS. A common pattern places it with
`position: absolute` relative to the content and uses `position-area` or
a CSS pseudo-element triangle:

```tsx
<Tooltip.Content className="tooltip">
  Save your changes
  <Tooltip.Arrow className="tooltip__arrow" />
</Tooltip.Content>
```

```css
.tooltip__arrow {
  position: absolute;
  bottom: -4px;
  left: 50%;
  translate: -50% 0;
  width: 8px;
  height: 8px;
  background: inherit;
  rotate: 45deg;
}
```

## Animation hooks

`Tooltip.Portal` and `Tooltip.Content` accept `forceMount`. When set, the
subtree stays in the DOM while closed so a CSS animation can play on
`data-state="closed"`:

```tsx
<Tooltip.Portal forceMount>
  <Tooltip.Content forceMount>…</Tooltip.Content>
</Tooltip.Portal>
```

```css
[data-state="open"]  { animation: fade-in  120ms ease-out; }
[data-state="closed"] { animation: fade-out 80ms  ease-in forwards; }
```

## `asChild` composition

`Tooltip.Trigger` and `Tooltip.Arrow` accept `asChild`. The component
merges its own props (event handlers, ARIA, `data-state`) onto the
child element; the child's own handlers run first.

```tsx
<Tooltip.Trigger asChild>
  <a href="/help">Help</a>
</Tooltip.Trigger>

<Tooltip.Arrow asChild>
  <svg viewBox="0 0 10 5">…</svg>
</Tooltip.Arrow>
```

## Styling hooks

`data-state="open" | "closed"` is set on both `Tooltip.Trigger` and
`Tooltip.Content`:

```css
.tooltip[data-state="open"]   { opacity: 1; }
.tooltip[data-state="closed"] { opacity: 0; }
```

## Workbench example

Open the interactive version in the [workbench](/workbench/#/tooltip). Its source:

<<< ../../../apps/workbench/src/pages/TooltipExample/TooltipExample.tsx

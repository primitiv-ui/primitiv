# Modal

A headless, accessible compound component implementing the
[WAI-ARIA Modal Dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

Modal is built on the native
[`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog)
element and its `showModal()` API, so focus trapping, inert background,
top-layer stacking, and Esc-to-close are handled by the browser. The
React layer adds what native `<dialog>` doesn't give you:

- Click-outside-to-close via a `pointerdown` listener on the dialog
  that checks the pointer against `getBoundingClientRect()` — coords
  outside the rect mean the pointer landed on the native `::backdrop`.
- A portal for placing the dialog at the end of `document.body`.
- Controlled / uncontrolled state plumbing.
- `asChild` composition for every slot-able sub-component.
- An imperative API for firing open/close from outside the subtree.
- `forceMount` hooks for driving CSS exit animations.

### Why is click-outside on the dialog, not the overlay?

`showModal()` promotes the `<dialog>` into the browser's **top layer**
and paints a `::backdrop` pseudo-element underneath it — also in the
top layer. Any sibling `Modal.Overlay` sits _below_ that backdrop
visually, so clicks on the "outside" area never reach it. Detection
therefore has to live on the dialog itself: a `pointerdown` whose
coordinates fall outside the dialog's bounding rect is, by
elimination, a click on the backdrop. `Modal.Overlay` stays in the
tree as a cosmetic + animation surface (for custom backdrop styling
or motion wrappers that exceed what `::backdrop` can express).

```tsx
import { Modal } from "@primitiv-ui/react";

<Modal.Root open={open} onOpenChange={setOpen}>
  <Modal.Trigger>Open</Modal.Trigger>
  <Modal.Portal>
    <Modal.Overlay />
    <Modal.Content>
      <Modal.Title>Payment</Modal.Title>
      <Modal.Description>Enter your card details</Modal.Description>
      {/* body */}
      <Modal.Close>Cancel</Modal.Close>
    </Modal.Content>
  </Modal.Portal>
</Modal.Root>;
```

## Sub-components

| Export              | Element           | Notes                                                                                                                                          |
| ------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `Modal.Root`        | context provider  | Owns open state. Exposes `ModalImperativeApi` via `ref`                                                                                        |
| `Modal.Trigger`     | `<button>`        | `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`. `asChild`                                                                          |
| `Modal.Portal`      | `createPortal`    | `container?: HTMLElement` (default `document.body`). `forceMount`                                                                              |
| `Modal.Overlay`     | `<div>` (sibling) | Decorative / animation target — **not** a click-outside event surface (see below). `aria-hidden="true"`. `data-state`. `asChild`, `forceMount` |
| `Modal.Content`     | `<dialog>`        | Native modal dialog. `data-state`. Escape hatches for Esc / click-outside                                                                      |
| `Modal.Title`       | `<h2>`            | Auto-wires `aria-labelledby` on Content. `asChild`                                                                                             |
| `Modal.Description` | `<p>`             | Auto-wires `aria-describedby` on Content. `asChild`                                                                                            |
| `Modal.Close`       | `<button>`        | Closes the modal. `asChild`                                                                                                                    |

## Keyboard interaction

| Key   | Behaviour                                                                     |
| ----- | ----------------------------------------------------------------------------- |
| `Esc` | Closes the modal (native `cancel` event). Preventable via `onEscapeKeyDown`   |
| `Tab` | Focus is trapped inside the dialog by the browser's native modal dialog logic |

## State modes

- **Uncontrolled** — pass `defaultOpen` (or omit for closed on mount).
- **Controlled** — pass `open` **and** `onOpenChange` together.

The two shapes are statically discriminated at the type level; TypeScript
rejects mixing them.

```tsx
// Uncontrolled
<Modal.Root defaultOpen>…</Modal.Root>;

// Controlled
const [open, setOpen] = useState(false);
<Modal.Root open={open} onOpenChange={setOpen}>
  …
</Modal.Root>;
```

## Escape hatches

Both close paths — `Esc` and click-outside — fire observable callbacks
on `Modal.Content`. Call `event.preventDefault()` to keep the modal
open. `onPointerDownOutside` receives the native `PointerEvent`
(fires on `pointerdown`, not `click`, matching the prop name).

```tsx
<Modal.Content
  onEscapeKeyDown={(event) => {
    if (hasUnsavedChanges) event.preventDefault();
  }}
  onPointerDownOutside={(event) => {
    if (isRequiredFlow) event.preventDefault();
  }}
>
  …
</Modal.Content>
```

## Imperative API

```tsx
import { Modal, type ModalImperativeApi } from "@primitiv-ui/react";

const ref = useRef<ModalImperativeApi>(null);

<Modal.Root ref={ref}>…</Modal.Root>;

ref.current?.open();
ref.current?.close();
```

In controlled mode the imperative methods delegate to `onOpenChange` —
the parent stays in charge of the actual state update.

## `asChild` composition

`Modal.Trigger`, `Modal.Close`, `Modal.Title`, `Modal.Description`, and
`Modal.Overlay` accept an `asChild` boolean. When set, the component
delegates rendering to its single child element and merges its own ARIA
attributes, ids, composed event handlers, and ref onto the child
following the asChild pattern (child handler runs first, then the
library's). `Modal.Overlay` is decorative and has no library-side
handlers, so only its ARIA and `data-state` are forwarded.

```tsx
// Router link with dialog-trigger semantics
<Modal.Trigger asChild>
  <Link to="/upgrade">Upgrade</Link>
</Modal.Trigger>

// Alternate heading level
<Modal.Title asChild>
  <h3>Payment</h3>
</Modal.Title>

// Motion wrapper on the backdrop
<Modal.Overlay asChild>
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
</Modal.Overlay>
```

`Modal.Content` is intentionally **not** slot-able. Its native
`<dialog>` element is the whole reason Modal works without a focus
trap or a scroll-lock library, so we don't expose a way to swap it.

## Animation hooks

`Modal.Portal` and `Modal.Overlay` accept a `forceMount` boolean. When
set, the subtree stays in the DOM regardless of `open` state so a CSS
animation can play against the `data-state="closed"` attribute:

```tsx
<Modal.Portal forceMount>
  <Modal.Overlay forceMount />
  <Modal.Content>…</Modal.Content>
</Modal.Portal>
```

```css
[data-state="open"] {
  animation: fade-in var(--primitiv-motion-duration-control) var(--primitiv-motion-easing-enter);
}
[data-state="closed"] {
  animation: fade-out var(--primitiv-motion-duration-feedback) var(--primitiv-motion-easing-exit) forwards;
}
```

Consumers who use `forceMount` own the unmount lifecycle themselves
(e.g. by tracking a separate `presence` state that flips false only
once the exit animation ends).

## Scroll lock

Modal intentionally ships no JavaScript scroll lock. The one-line CSS
equivalent works in every modern browser:

```css
html:has(dialog[open]) {
  overflow: hidden;
}
```

## Styling hooks

`data-state="open" | "closed"` is set on `Modal.Overlay` and
`Modal.Content`, letting any CSS system target the two phases.

```css
dialog[data-state="open"] {
  display: grid;
  place-items: center;
}

dialog::backdrop {
  background: oklch(0 0 0 / 0.6);
}
```

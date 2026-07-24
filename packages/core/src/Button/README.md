# Button — core

The framework-agnostic half of Button: one pure function and the constant it
falls back to.

```ts
import { getButtonRootAttributes } from "@primitiv-ui/core";
```

## `getButtonRootAttributes(state)`

Derives the DOM attributes a Button root node carries.

| Field of `state` | Type | Default | Effect |
| --- | --- | --- | --- |
| `type` | `ButtonType` | `"button"` | Emitted as the native `type` attribute |
| `disabled` | `boolean` | `false` | Emits native `disabled` **and** `data-disabled=""` |
| `asChild` | `boolean` | `false` | Withholds `type` — the delegated element owns its own type semantics |

```ts
getButtonRootAttributes({});                    // { type: "button" }
getButtonRootAttributes({ type: "submit" });    // { type: "submit" }
getButtonRootAttributes({ asChild: true });     // {}
getButtonRootAttributes({ disabled: true });    // { type: "button", disabled: true, "data-disabled": "" }
```

### Why `type` defaults to `"button"`

The DOM's own default is `"submit"`, so a bare `<button>` inside a `<form>`
submits it. Defaulting to `"button"` means a Button never triggers an
accidental submit unless asked to. `BUTTON_DEFAULT_TYPE` names this so adapters
share one definition rather than each repeating the string.

### Why `disabled` emits two things

The native attribute removes the button from the tab order and suppresses
clicks; `data-disabled=""` lets CSS target `[data-disabled]` without the
`:disabled` pseudo-class. The pairing matters most under `asChild`, where the
delegated element may be an `<a>` or `<span>` with no `:disabled` state to
match at all.

### Why keys are omitted, not `undefined`

`{ "data-disabled": undefined }` and an absent key render identically in React,
Vue and Solid. They do **not** behave identically in an adapter that applies
attributes imperatively — `setAttribute("data-disabled", undefined)` writes the
string `"undefined"`. Omitting the key keeps the map safe to iterate:

```ts
for (const [name, value] of Object.entries(getButtonRootAttributes(state))) {
  node.setAttribute(name, String(value));
}
```

## Adapter usage

React (`@primitiv-ui/react`):

```tsx
const rootProps = {
  ...rest,
  ref,
  ...getButtonRootAttributes({ type, disabled, asChild }),
};

return asChild
  ? <Slot {...rootProps}>{children}</Slot>
  : <button {...rootProps}>{children}</button>;
```

Note the ordering: core's attributes spread **after** the forwarded props, so a
derived attribute always wins over a stray pass-through.

Vue would compute the same map and `v-bind` it; Svelte would spread it, or
apply it imperatively from an action. None of them re-decide any of the three
rules above.

## What stayed in the adapter

Not everything about Button is here, and shouldn't be. Rendering, `ref`
forwarding, prop pass-through, and the `asChild` merge (React's `Slot` composes
event handlers, `style` and `className`) are all framework-shaped. Core's only
say in `asChild` is the single decision that `type` is withheld under it.

# Select — future work

The shipped `@primitiv/react` `Select` is a thin wrapper over the native
`<select>` element. This doc captures the design conversation behind
the two richer components that are deliberately deferred, so the next
session can pick them up cold.

## Tiers

| Tier            | What it is                                                            | Status                                                |
| --------------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| Native Select   | Wrapper over `<select>` / `<option>` / `<optgroup>`.                  | **Shipped.** See `packages/react/src/Select/README.md`. |
| Rich Select     | Headless, fully styleable Select with custom item rendering, indicators, groups, etc. | Deferred.                                             |
| Combobox        | Filterable Select with free-text entry, async loading, etc.           | Deferred.                                             |

Native covers the Harmoni plugin's workspace picker and collection
dropdown (flat short lists). The Rich Select and Combobox unlock the
remaining use cases — icons next to options, indicator checkmarks,
search, etc.

## Settled design decisions for the Rich Select

These were agreed during the planning conversation for the Native
tier. Revisit them if you're starting the Rich Select cycle.

- **Popup layer: Popover API only, manual placement via consumer CSS.**
  Content uses `popover="auto"` for the top-layer + light-dismiss
  behaviour. The component does **not** ship CSS anchor positioning;
  consumers receive `data-side` / `data-align` data hooks and place the
  popup themselves via their own CSS. Most resilient across browsers
  and keeps the component free of placement math.
- **No `Select.Portal` sub-component.** `popover="auto"` puts Content in
  the top layer; an explicit Portal would be redundant.
- **Selection model: single-select only.** Multi-select belongs in a
  separate `Listbox` / `MultiSelect` if and when it's needed.
- **Drop `ScrollUpButton` / `ScrollDownButton`.** Rely on viewport
  overflow scrolling.
- **Drop `position="item-aligned"`.** Ship popper-style placement only.
- **Drop `Select.Arrow`.** Consumers who want an arrow use CSS
  pseudo-elements on Content.
- **Form integration: hidden native `<select>`.** Render an invisible
  `<select name=…>` so submission works through the browser, mirroring
  what the Native tier already gets for free.

## Open questions for the Combobox

- Filtering strategy — owned by the component (built-in `filter` prop /
  string-match predicate) or by the consumer (always-controlled with a
  `useDeferredValue`-style API)?
- Async option loading — does the component own request state, or just
  call back with the current filter string?
- Multi-select on Combobox specifically — token chips inside the input?
  Separate `MultiCombobox`?
- Virtualization — accept a `windowed` prop, or document a recipe with
  `react-virtual` / `tanstack-virtual`?

## Browser-support caveat

Popover API support is Chromium/Safari evergreen as of 2026-05-28;
Firefox is patchy. Re-check browser support before starting the Rich
Select cycle — if Firefox stable still doesn't have it, evaluate the
Floating-only fallback that was on the table during the planning
conversation (fixed positioning + ResizeObserver) vs the Popover API
with a polyfill.

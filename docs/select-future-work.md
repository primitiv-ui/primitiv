# Select — future work

The shipped `@primitiv-ui/react` `Select` is a thin wrapper over the native
`<select>` element. This doc captures the design conversation behind
folding a richer, fully-styleable render path into that same component,
plus the separately-deferred Combobox, so the next session can pick either
up cold.

## One `Select`, not a second component (D: unify, 2026-07-24)

Originally planned as two components — a shipped "Native Select" and a
deferred "Rich Select" — this is now **one `Select` compound with a `native`
boolean prop**, not a second component:

- **`native` (default `false`)** — the rich render path: a Popover-API
  listbox (`Select.Content`/`Item`/`Group`/`ItemIndicator`, custom item
  rendering, icons, indicators). This is the new default.
- **`native={true}`** — today's shipped behaviour: a thin wrapper over a
  real `<select>`/`<option>`/`<optgroup>`, for the flat/OS-native cases
  (the Harmoni plugin's workspace picker, a mobile-native picker wheel).

Rationale: the two tiers share the same `value`/`onChange`/`disabled`/form
`name` API and largely-overlapping behaviour (both need arrow-key nav,
though native gets it free from the OS) — building them as one component
with one composition tree, rather than two components with two APIs to
document and keep in sync, is the simpler long-term shape. This does **not**
reduce the Rich-mode implementation work (the popover listbox internals
still need to be built from scratch) — it only unifies the exported API
surface and the docs.

**Composition converges, but doesn't unify perfectly.** `Select.Item`
children can be arbitrary JSX in rich mode (icon + label + indicator), but a
real `<option>` can't render arbitrary elements. Under `native`, the
component walks each `Select.Item`'s children (the same `Children.map`
string/number-vs-element split used elsewhere in this library — Button,
Accordion, ToggleGroup — but inverted: **keep only the string/number nodes,
joined as the option's text; drop every element child** — icons and
indicators simply don't render) to build the real `<option>`. Document this
plainly rather than adding a runtime dev-warning (nothing else in this
library warns on this class of prop misuse); flag the edge case where an
icon-only item with no text renders an empty, unlabelled `<option>` under
`native`.

`Select.Group`'s label is a plain **string prop**, not JSX children —
`<optgroup>` only accepts a `label` attribute, so making it a string from
the start sidesteps the same extraction problem for groups entirely rather
than relying on the text-filtering trick twice.

**No backward-compatibility path needed.** `@primitiv-ui/react` isn't being
released again imminently, so flipping the default from native to rich is
free to do outright — no `native` deprecation window, no major-version
gymnastics.

## Settled design decisions for the rich render path

These were agreed during the planning conversation for the original Native
tier and still hold for `Select`'s default (non-`native`) render path.

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
  what `native` mode already gets for free.

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
Firefox is patchy. Re-check browser support before starting the `Select`
rich-mode build — if Firefox stable still doesn't have it, evaluate the
Floating-only fallback that was on the table during the planning
conversation (fixed positioning + ResizeObserver) vs the Popover API
with a polyfill.

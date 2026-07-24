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
`<optgroup>` only accepts a `label` attribute, so this sidesteps the same
extraction problem for groups entirely rather than relying on the
text-filtering trick twice. **Already the shipped shape** (checked
`packages/react/src/Select/Select.tsx` — `SelectGroup` already takes
`label` as a prop and renders `<optgroup label={label}>`, unchanged since
groups were first built): nothing needs to change here for `native` mode;
rich mode's group heading just needs to render that same string.

**No backward-compatibility path needed.** `@primitiv-ui/react` isn't being
released again imminently, so flipping the default from native to rich is
free to do outright — no `native` deprecation window, no major-version
gymnastics.

## Rich value display — icons in the trigger, not just text (D: 2026-07-24)

A real-world case (screenshot: a "Framework" picker — a leading React/Vue/
Svelte icon in **both** the closed trigger and each open row, a trailing
checkmark on the selected row, a trailing "Soon" badge on disabled rows)
means `Select.Item` content (icon + label + trailing decoration) has to
show up in the **closed trigger**, not just the open listbox — plain-text
mirroring isn't enough.

Settled mechanism (same shape as Radix's `Select.Value`, which solves this
exact problem): a `Select.Value` sub-component, placed inside
`Select.Trigger`, that **automatically mirrors the currently-selected
`Select.Item`'s children** — the consumer writes the icon + label once, on
the `Item`, and never duplicates it for the trigger. `Select.Value` accepts
a `placeholder` prop shown only when nothing is selected.

- **Registration, not prop-drilling.** Each mounted `Select.Item` registers
  `{ value, children }` in a shared collection via context — the same
  `useCollection` shape already used by Tabs/RadioGroup elsewhere in this
  library (see the `react-component-patterns` skill) — and `Select.Value`
  looks up the entry matching the current `value` to render.
- **The mirror excludes `Select.ItemIndicator`.** The screenshot's
  checkmark is meaningful only inside the open row (it answers "which one
  is selected" — redundant and confusing repeated on the trigger it already
  represents); an icon or any other Item child mirrors through untouched.
  Mechanically: `Select.Value`'s render walks the matched Item's children
  and drops any element whose type is `SelectItemIndicator`, keeping
  everything else (text and any other elements — icons, badges) — a
  narrower, targeted filter, not the same string/number-vs-element split
  used for the `native`-mode text extraction above.
- **A trailing badge/pill (the screenshot's "Soon") needs no dedicated
  API** — it's just another child of `Select.Item`, disabled items are
  still visible/unselectable via the existing `disabled` prop (matches
  `Select.Option`'s current `disabled` behaviour), and it mirrors into the
  trigger like any other non-indicator child *if* that item is ever
  selected (uncommon for a disabled option, but not prevented).

## Figma design — landed (2026-07-24)

The rich-mode listbox is designed and built in Figma, reusing Dropdown's own
components rather than inventing new ones (confirmed viable with a
reference composition before committing to the real build):

- **`Select` (was plain "Select") renamed to `Select / Trigger`** — no
  behaviour change, purely a naming split matching the
  `Collapsible / Trigger` + `Collapsible` precedent. All 5 sizes are a flat
  240px width (only height scales by size) — the composed set's Content
  frame therefore always matches the Trigger at 240px regardless of size.
- **A new composed `Select` component set** (`Variant` closed|open ×
  `Size` xs-xl, 10 variants) instances the size-matched `Select / Trigger`
  and, when open, stacks a **detached, restyled `Dropdown / Panel`**
  instance below it (same fill/stroke/radius/shadow tokens as Dropdown,
  `space-4` gap matching the `--primitiv-dropdown-offset` registry token)
  containing 3 `Dropdown / CheckboxItem` rows (checkmark model, not
  RadioItem's dot — confirmed as the right choice per the earlier
  reference). The Trigger's `Value` text and all 3 row instances are
  `isExposedInstance=true`, editable directly on a top-level `Select`
  instance.
- **No formal SLOT property** — attempted (so a designer could freely
  add/remove/reorder rows, matching Collapsible's `Content` slot), but the
  dedicated Figma slot-creation tools (`figma_add_slot_property` /
  `figma_create_slot` / `figma_append_to_slot`, plus `figma_get_slots`) all
  required an approval gate unavailable in that session — every call
  returned `MCP error -32003: MCP tool call requires approval`. Separately,
  Dropdown's own `Panel` component already carries a `Slot` property, but
  it turned out to be non-functional for stacking: the slot's own frame is
  `layoutMode: NONE` with a stale `layoutSizingVertical: FIXED` height (a
  second instance of the exact "bound token, but sizing mode ignores it"
  bug already found and fixed on `Dropdown / Separator` — **not yet fixed
  on `Dropdown / Panel`'s Slot**, flagged here as a known follow-up since
  fixing it might also fix the Panel's-own-Slot approach and make it usable
  for Select too). Retry the dedicated tools in a future session (or ask
  the user to grant the approval) before ruling a real SLOT out — the panel
  content is a real, exposed-property-editable composition in the meantime,
  just not swappable via Figma's "Swap instance" UX.

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

## Browser-support caveat — resolved (2026-07-24)

Re-checked: Firefox shipped a full, spec-compliant Popover API in **Firefox
125** (April 2024), over two years before this recheck, with follow-on
consistency fixes as recently as Firefox 153. Combined with Chrome 114+ and
Safari 17.4+, all four evergreen engines (Chrome/Edge/Firefox/Safari) have
had stable support for years — Firefox is no longer the caveat it was when
this doc was first written. No fallback (Floating-UI-style fixed
positioning + ResizeObserver, or a polyfill) is needed; build directly on
the Popover API as settled above.

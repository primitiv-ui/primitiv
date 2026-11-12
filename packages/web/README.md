# @primitiv-ui/web

Primitiv's headless components as **standard custom elements**: light DOM, no
framework and no runtime dependencies beyond
[`@primitiv-ui/core`](../core/README.md). They work in a plain HTML page, any
server-rendered stack (HTMX, Rails, Django, Laravel, Spring …), and inside
React, Vue, Angular or any other framework.

> **Status: published.** Tabs, Accordion, Collapsible, Modal, Popover, Tooltip, Dropdown, Context Menu, Toggle Group, Segmented Control, Radio Card, Checkbox Card, Slider, Split Button, Listbox and Select so far. See
> [RFC 0033](../../docs/rfcs/0033-web-components.md) for the design.

## Components

| Component | Elements | Change event | First release |
|---|---|---|---|
| Tabs | `primitiv-tabs`, `-list`, `-trigger`, `-content` | `primitiv-tabs-change` | 0.1.42 |
| Accordion | `primitiv-accordion`, `-item`, `-trigger`, `-content`, `-trigger-icon` | `primitiv-accordion-change` | 0.1.44 |
| Collapsible | `primitiv-collapsible`, `-trigger`, `-content`, `-trigger-icon` | `primitiv-collapsible-change` | 0.1.47 |
| Modal | `primitiv-modal`, `-trigger`, `-content`, `-title`, `-description`, `-close` | `primitiv-modal-change` | 0.1.54 |
| Popover | `primitiv-popover`, `-trigger`, `-anchor`, `-content`, `-title`, `-description`, `-close` | `primitiv-popover-change` | 0.1.55 |
| Tooltip | `primitiv-tooltip`, `-provider`, `-trigger`, `-content`, `-arrow` | `primitiv-tooltip-change` | 0.1.56 |
| Dropdown | `primitiv-dropdown`, `-trigger`, `-content`, `-item`, `-checkbox-item`, `-radio-group`, `-radio-item`, `-item-indicator`, `-group`, `-label`, `-separator`, `-sub`, `-sub-trigger`, `-sub-content` | `primitiv-dropdown-change`, `-sub-change`, `-select`, `-checked-change`, `-value-change` | 0.1.57 |
| Context Menu | `primitiv-context-menu`, and the same thirteen parts as Dropdown under `primitiv-context-menu-` | `primitiv-context-menu-change`, `-sub-change`, `-select`, `-checked-change`, `-value-change` | 0.1.58 |
| Toggle Group | `primitiv-toggle-group`, `-item` | `primitiv-toggle-group-change` | 0.1.59 |
| Segmented Control | `primitiv-segmented-control`, `-item` | `primitiv-segmented-control-change` | 0.1.60 |
| Radio Card | `primitiv-radio-card`, `-item`, `-indicator` | `primitiv-radio-card-change` | 0.1.61 |
| Checkbox Card | `primitiv-checkbox-card`, `-indicator` | `primitiv-checkbox-card-change` | 0.1.61 |
| Slider | `primitiv-slider`, `-track`, `-range`, `-thumb` | `primitiv-slider-change`, `primitiv-slider-commit` | 0.1.61 |
| Split Button | `primitiv-split-button`, `-action` (its menu is a nested `primitiv-dropdown`) | the Dropdown's | 0.1.62 |
| Listbox | `primitiv-listbox`, `-option`, `-group`, `-group-label` | `primitiv-listbox-change` | 0.2.1 |
| Select | `primitiv-select`, `-trigger`, `-value`, `-content`, `-item`, `-item-indicator`, `-group`, `-separator` | `primitiv-select-change`, `-open-change` | 0.2.1 |

## Use it

**No build step** — one script tag per component defines that component's
elements and nothing else:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@primitiv-ui/web@<version>/dist/cdn/tabs.js"></script>

<primitiv-tabs value="overview">
  <primitiv-tabs-list label="Account sections">
    <primitiv-tabs-trigger value="overview"><button type="button">Overview</button></primitiv-tabs-trigger>
    <primitiv-tabs-trigger value="billing"><button type="button">Billing</button></primitiv-tabs-trigger>
  </primitiv-tabs-list>
  <primitiv-tabs-content value="overview">…</primitiv-tabs-content>
  <primitiv-tabs-content value="billing" hidden>…</primitiv-tabs-content>
</primitiv-tabs>
```

**With a bundler** — import a `define` entry once, anywhere:

```ts
import "@primitiv-ui/web/define/tabs";  // one component's elements
import "@primitiv-ui/web/define";       // or every element
```

Each `dist/cdn/<component>.js` imports the code components share from
`dist/cdn/chunks/` by a relative URL, so a page that loads two components
downloads it once. `dist/primitiv-web.js` is the alternative: every element in
one file. Per-component files ship from 0.1.43.

The main entry (`@primitiv-ui/web`, `/tabs`, `/accordion`, `/collapsible`,
`/modal`, `/popover`, `/tooltip`, `/dropdown`, `/context-menu`, `/toggle-group`, `/segmented-control`, `/radio-card`, `/checkbox-card`, `/slider`, `/split-button`, `/listbox`, `/select`) exports the classes and `defineTabs(registry?)` /
`defineAccordion(registry?)` / `defineCollapsible(registry?)` /
`defineModal(registry?)` / `definePopover(registry?)` / `defineTooltip(registry?)` /
`defineDropdown(registry?)` / `defineContextMenu(registry?)` /
`defineToggleGroup(registry?)` / `defineSegmentedControl(registry?)` /
`defineRadioCard(registry?)` / `defineCheckboxCard(registry?)` / `defineSlider(registry?)` / `defineSplitButton(registry?)` /
`defineListbox(registry?)` / `defineSelect(registry?)` with **no side
effects**.

**Render `hidden` on inactive panels yourself.** Until the module loads, CSS
cannot tell which panel is active, so markup that omits it shows every panel.

**Listen with `primitiv-tabs-change`** (bubbles, cancelable, `detail: { value,
index }`) — call `preventDefault()` to veto a change — and `primitiv-tabs-show`
on a panel as it becomes active, for lazy loading.

### Accordion

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@primitiv-ui/web@<version>/dist/cdn/accordion.js"></script>

<primitiv-accordion value="shipping">
  <primitiv-accordion-item value="shipping">
    <h3>
      <primitiv-accordion-trigger><button type="button">Shipping</button></primitiv-accordion-trigger>
    </h3>
    <primitiv-accordion-content>Free on orders over £50.</primitiv-accordion-content>
  </primitiv-accordion-item>
  <primitiv-accordion-item value="returns">
    <h3>
      <primitiv-accordion-trigger><button type="button">Returns</button></primitiv-accordion-trigger>
    </h3>
    <primitiv-accordion-content hidden>30 days, no questions asked.</primitiv-accordion-content>
  </primitiv-accordion-item>
</primitiv-accordion>
```

- **`value` lists the open items, separated by spaces** (so item values cannot
  contain whitespace), and is reflected as items toggle. `multiple` lets more
  than one be open; `orientation="horizontal"` switches the arrow pair. The
  `value` property reads as an array and accepts an array or a string.
- **The heading is yours.** Wrap each trigger in a real `<h2>`–`<h6>` at the
  level your outline needs; there is no header element.
- **`force-mount` on a panel** keeps it unhidden so styles can animate it,
  hiding it with `aria-hidden` while closed instead — the registry stylesheet
  needs it.
- **`role="none"` on a panel** opts it out of being a region landmark, for an
  accordion with many items.
- **Listen with `primitiv-accordion-change`** (bubbles, cancelable, `detail: {
  value }`, every item open afterwards) and `primitiv-accordion-show` on a panel
  as its item opens. Render `hidden` on closed panels yourself, as for Tabs.

### Collapsible

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@primitiv-ui/web@<version>/dist/cdn/collapsible.js"></script>

<primitiv-collapsible>
  <primitiv-collapsible-trigger><button type="button">Shipping details</button></primitiv-collapsible-trigger>
  <primitiv-collapsible-content hidden>Orders ship within two business days.</primitiv-collapsible-content>
</primitiv-collapsible>
```

- **`open` is the state**, a boolean attribute reflected as the user toggles,
  and the `open` property reads and sets it. `disabled` on the root keeps the
  button focusable but stops it toggling.
- **`collapsed-height` on the panel** shows a clamped preview while closed (the
  read-more pattern): a bare number is pixels, anything else a CSS length. It is
  published as `--primitiv-collapsible-collapsed-height` with
  `data-clamped="true"`, and the panel is never hidden, since the preview is
  real content. `force-mount` keeps a closed panel unhidden for your own
  animation, with `aria-hidden` instead.
- **Listen with `primitiv-collapsible-change`** (bubbles, cancelable, `detail: {
  open }`) and `primitiv-collapsible-show` on the panel as it opens. Render
  `hidden` on a closed panel yourself, as for Tabs.

### Modal

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@primitiv-ui/web@<version>/dist/cdn/modal.js"></script>

<primitiv-modal>
  <primitiv-modal-trigger><button type="button">Edit profile</button></primitiv-modal-trigger>
  <primitiv-modal-content>
    <dialog>
      <primitiv-modal-title><h2>Edit profile</h2></primitiv-modal-title>
      <primitiv-modal-description><p>Changes apply to every workspace.</p></primitiv-modal-description>
      <primitiv-modal-close><button type="button">Done</button></primitiv-modal-close>
    </dialog>
  </primitiv-modal-content>
</primitiv-modal>
```

- **It is a native `<dialog>`, opened with `showModal()`**: the browser supplies
  the top layer, the `::backdrop` and the inert page. The element adds the
  Tab wrap, closing on Escape and on a backdrop press, and the ARIA wiring —
  `aria-haspopup`, `aria-expanded` and `aria-controls` on the trigger's button,
  `aria-labelledby` / `aria-describedby` from the title's heading and the
  description's paragraph. Focus returns to the trigger on close.
- **`open` on the root is the state**, reflected as the user opens and dismisses
  it; the `open` property reads and sets it, and setting it is not announced.
  Leave `open` off the `<dialog>` itself — the root opens it modally, and
  reopens modally one that arrives with it (a history snapshot).
- **Several triggers and close buttons** are fine. There is no overlay element:
  style `::backdrop`.
- **Listen with `primitiv-modal-change`** (bubbles, cancelable, `detail: { open
  }`), fired before every user-driven change — trigger, close, Escape, a backdrop
  press, a `<form method="dialog">` — so `preventDefault()` keeps a dirty form
  open.

### Popover

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@primitiv-ui/web@<version>/dist/cdn/popover.js"></script>

<primitiv-popover>
  <primitiv-popover-trigger><button type="button">Share</button></primitiv-popover-trigger>
  <primitiv-popover-content popover="auto">
    <primitiv-popover-title><h2>Share this page</h2></primitiv-popover-title>
    <primitiv-popover-description><p>Anyone with the link can view it.</p></primitiv-popover-description>
    <primitiv-popover-close><button type="button">Done</button></primitiv-popover-close>
  </primitiv-popover-content>
</primitiv-popover>
```

- **It is a native `popover="auto"` panel**: the browser supplies the top layer
  and light dismiss. The element adds `role="dialog"` and the trigger's ARIA,
  moves focus into the panel on open, and closes it on Escape with focus back on
  the trigger. Write `popover="auto"` yourself so the panel is hidden before the
  script loads.
- **No anchor wiring.** The panel is shown with its trigger as its source (or
  the element inside `<primitiv-popover-anchor>`), which makes it the implicit
  anchor, so CSS anchor positioning (`position-area`) places it with no
  `anchor-name` / `position-anchor` pair.
- **`open` on the root is the state**; the `open` property reads and sets it.
  **Listen with `primitiv-popover-change`** (bubbles, cancelable, `detail: {
  open }`), fired before every user-driven change, a light dismiss included.

### Tooltip

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@primitiv-ui/web@<version>/dist/cdn/tooltip.js"></script>

<primitiv-tooltip>
  <primitiv-tooltip-trigger><button type="button">Save</button></primitiv-tooltip-trigger>
  <primitiv-tooltip-content popover="manual">
    Saves your work
    <primitiv-tooltip-arrow></primitiv-tooltip-arrow>
  </primitiv-tooltip-content>
</primitiv-tooltip>
```

- **It opens on hover after `delay-duration` (700 ms) and on focus at once**,
  and closes when the pointer leaves (after a short grace period, so the pointer
  can reach the bubble — `disable-hoverable-content` turns that off), on blur,
  on Escape and on a press outside. The element gives the bubble
  `role="tooltip"` and the trigger's button `aria-describedby`.
- **It is a native `popover="manual"`** in the top layer, shown with the
  trigger as its source, so CSS anchor positioning places it with no
  `anchor-name` / `position-anchor` pair. Write `popover="manual"` yourself so
  the bubble is hidden before the script loads.
- **Moving from one trigger to the next opens each next tooltip at once** (the
  skip delay, 300 ms). Tooltips inside a `<primitiv-tooltip-provider>` share its
  `delay-duration` and `skip-delay-duration`; the rest share a document-wide
  window.
- **`open` on the root is the state**; the `open` property reads and sets it.
  **Listen with `primitiv-tooltip-change`** (bubbles, cancelable, `detail: {
  open }`), fired before every user-driven change.

### Dropdown

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@primitiv-ui/web@<version>/dist/cdn/dropdown.js"></script>

<primitiv-dropdown>
  <primitiv-dropdown-trigger><button type="button">Options</button></primitiv-dropdown-trigger>
  <primitiv-dropdown-content popover="auto">
    <primitiv-dropdown-item><li>Copy</li></primitiv-dropdown-item>
    <primitiv-dropdown-checkbox-item checked><li>Show grid</li></primitiv-dropdown-checkbox-item>
    <primitiv-dropdown-sub>
      <primitiv-dropdown-sub-trigger><li>Share</li></primitiv-dropdown-sub-trigger>
      <primitiv-dropdown-sub-content popover="auto">
        <primitiv-dropdown-item><li>Email</li></primitiv-dropdown-item>
      </primitiv-dropdown-sub-content>
    </primitiv-dropdown-sub>
  </primitiv-dropdown-content>
</primitiv-dropdown>
```

- **A menu button over a native `popover="auto"`**, anchored to its trigger
  with no wiring. It opens focused on the first item; the arrows, Home and End
  move, Enter and Space choose, typing finds an item, and Escape, a press
  outside or a chosen item closes it with focus back on the trigger.
- **Each row wraps the element you write** (an `<li>`, or a link), which gets
  its menu role. Close every `<li>`: the HTML parser ends an open `<li>` at the
  next one, custom elements or not. `disabled` on a row skips it.
- **State is attributes**: `open` on the root and on each
  `<primitiv-dropdown-sub>`, `checked` on a checkbox item (`indeterminate` for
  mixed), `value` on a radio group. Each change fires a cancelable event first;
  **listen for `primitiv-dropdown-select`** on an item to act on it, and cancel
  it to keep the menu open.

### Context Menu

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@primitiv-ui/web@<version>/dist/cdn/context-menu.js"></script>

<primitiv-context-menu>
  <primitiv-context-menu-trigger>Right-click here</primitiv-context-menu-trigger>
  <primitiv-context-menu-content popover="manual">
    <primitiv-context-menu-item><li>Copy</li></primitiv-context-menu-item>
    <primitiv-context-menu-item><li>Delete</li></primitiv-context-menu-item>
  </primitiv-context-menu-content>
</primitiv-context-menu>
```

- **Dropdown's menu, opened at the pointer**: a right-click in the
  `<primitiv-context-menu-trigger>` region — which is the region itself, not a
  wrapper — or the keyboard's context-menu key on it opens the menu, with the
  same rows, keyboard, typeahead, submenus, attributes and events (prefixed
  `primitiv-context-menu-`). `disabled` on the region leaves the browser its
  own menu.
- **The menu is `popover="manual"`**: an `auto` one would close on the
  right-click's own release. Escape, a press outside and a chosen item close it,
  and its submenus close with it.
- **Position it from `--primitiv-context-menu-x` / `-y`**, the pointer's
  position the element publishes on the menu — the one style the elements
  write, since a point cannot be an anchor: `left: var(--primitiv-context-menu-x);
  top: var(--primitiv-context-menu-y)`. The registry stylesheet does this.

### Toggle Group

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@primitiv-ui/web@<version>/dist/cdn/toggle-group.js"></script>

<primitiv-toggle-group type="multiple" value="bold" aria-label="Formatting">
  <primitiv-toggle-group-item value="bold"><button type="button">Bold</button></primitiv-toggle-group-item>
  <primitiv-toggle-group-item value="italic"><button type="button">Italic</button></primitiv-toggle-group-item>
</primitiv-toggle-group>
```

- **The root is the `role="group"`**: name it with `aria-label`. Each item
  wraps the `<button>` you write, which gets `aria-pressed` and
  `data-state="on" | "off"`.
- **`value` lists the pressed items**, separated by spaces. `type="multiple"`
  lets items toggle independently; without it the group is single, and pressing
  the pressed item clears it. `primitiv-toggle-group-change` fires first, with
  every item pressed afterwards, and is cancelable.
- **One Tab stop for the group**, on the item focus last moved to, else the
  first pressed item, else the first. The arrows move focus without pressing,
  skipping `disabled` items; Enter and Space toggle.

### Segmented Control

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@primitiv-ui/web@<version>/dist/cdn/segmented-control.js"></script>

<primitiv-segmented-control value="week" aria-label="Range">
  <primitiv-segmented-control-item value="day"><button type="button">Day</button></primitiv-segmented-control-item>
  <primitiv-segmented-control-item value="week"><button type="button">Week</button></primitiv-segmented-control-item>
</primitiv-segmented-control>
```

- **The root is the `role="radiogroup"`**: name it with `aria-label`. Each
  segment wraps the `<button>` you write, which gets `role="radio"`,
  `aria-checked` and `data-state="checked" | "unchecked"`.
- **`value` is the selected segment**, and a selected segment never lets go —
  unlike a toggle group, the control cannot be emptied by the user.
  `primitiv-segmented-control-change` fires first, with the segment selected
  afterwards, and is cancelable. `disabled` on the root disables every segment.
- **One Tab stop for the control**, on the selected segment, else the first
  enabled one. The arrows move focus **and** selection, skipping `disabled`
  segments and wrapping; Enter and Space are the button's own click.

### Breadcrumb Overflow

No element of its own: write Breadcrumb's markup with the collapsed crumbs in a
`<primitiv-dropdown>`, each `<a>` wrapped in a `<primitiv-dropdown-item>`, and
load `dist/cdn/dropdown.js`. The menu anchors to its `...` trigger with no
`anchor-name`, and Enter on a hidden crumb follows its link.

### Radio Card

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@primitiv-ui/web@<version>/dist/cdn/radio-card.js"></script>

<primitiv-radio-card value="pro" aria-label="Plan">
  <primitiv-radio-card-item value="basic">
    <button type="button"><primitiv-radio-card-indicator></primitiv-radio-card-indicator>Basic</button>
  </primitiv-radio-card-item>
  <primitiv-radio-card-item value="pro">
    <button type="button"><primitiv-radio-card-indicator></primitiv-radio-card-indicator>Pro</button>
  </primitiv-radio-card-item>
</primitiv-radio-card>
```

- **The same radio group as Segmented Control, laid out as cards**: the root is
  the `role="radiogroup"`, each card's `<button>` a `role="radio"`, and `value`
  the selected card. It lays nothing out — put the cards in a Stack or grid.
- **`orientation` defaults to `both`**: all four arrows move the selection, for
  cards that wrap into a grid. `horizontal` or `vertical` keeps to one pair and
  writes `aria-orientation`.
- **`<primitiv-radio-card-indicator>`** anywhere in a card is `hidden` while the
  card is unchecked, unless it carries `force-mount` (so a stylesheet can animate
  it from `data-state`).

### Checkbox Card

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@primitiv-ui/web@<version>/dist/cdn/checkbox-card.js"></script>

<primitiv-checkbox-card checked>
  <button type="button"><primitiv-checkbox-card-indicator></primitiv-checkbox-card-indicator>Email updates</button>
</primitiv-checkbox-card>
```

- **One card, one checkbox**: it decorates the `<button>` you write as a
  `role="checkbox"`. `checked` is present, absent, or `"indeterminate"`
  (`aria-checked="mixed"`); a press on a mixed card checks it.
  `primitiv-checkbox-card-change` fires first, with `checked` afterwards, and is
  cancelable.
- **Cards are independent** and each is its own tab stop; Space and Enter are
  the button's own click. Like the radio card, it submits nothing with a form.

### Slider

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@primitiv-ui/web@<version>/dist/cdn/slider.js"></script>

<primitiv-slider value="20 80" min="0" max="100" name="price">
  <primitiv-slider-track><primitiv-slider-range></primitiv-slider-range></primitiv-slider-track>
  <primitiv-slider-thumb aria-label="Minimum"></primitiv-slider-thumb>
  <primitiv-slider-thumb aria-label="Maximum"></primitiv-slider-thumb>
</primitiv-slider>
```

- **`value` lists one number per thumb**, separated by spaces; the number of
  thumbs is the number of thumb elements. `step`, `min-steps-between-thumbs`,
  `orientation`, `inverted` and `disabled` work as on React's Slider.
- **Each thumb is the `role="slider"`**: name it, not the root. The arrows step,
  Page Up / Page Down step ten, Home / End jump; a press on the slider jumps the
  nearest thumb and drags it.
- **Positions are written inline.** Each thumb and the range get
  `position: absolute` and their inset along the track as a percentage, as
  React's Slider does — the one style the elements write, since it is the value.
- **Two events**: `primitiv-slider-change` before each change (cancelable, on
  every step of a drag), `primitiv-slider-commit` once the interaction ends.
- **`name` submits it with a form**: the slider keeps one hidden `<input>` per
  value inside itself (`name[]` for several thumbs).

### Split Button

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@primitiv-ui/web@<version>/dist/cdn/split-button.js"></script>

<primitiv-split-button>
  <primitiv-split-button-action><button type="button">Save</button></primitiv-split-button-action>
  <primitiv-dropdown>
    <primitiv-dropdown-trigger><button type="button" aria-label="Change save action">⌄</button></primitiv-dropdown-trigger>
    <primitiv-dropdown-content popover="auto">
      <primitiv-dropdown-item><li>Save and close</li></primitiv-dropdown-item>
      <primitiv-dropdown-item><li>Save as draft</li></primitiv-dropdown-item>
    </primitiv-dropdown-content>
  </primitiv-dropdown>
</primitiv-split-button>
```

- **The menu is a Dropdown**: its `open` state and events are
  `<primitiv-dropdown>`'s, and `split-button.js` defines the Dropdown elements
  too. The group is the `role="group"`, mirroring the menu in `data-state`.
- **ArrowDown on the action opens the menu** on its first item, through the
  trigger, so the cancelable `primitiv-dropdown-change` still fires.
- **The trigger is named for you**: unless its `<button>` has `aria-label` or
  `aria-labelledby`, it gets `aria-labelledby="<trigger id> <action id>"`.
- **`disabled`** on the group disables both halves; put it on
  `<primitiv-split-button-action>` or `<primitiv-dropdown-trigger>` to disable
  one half alone.

**TypeScript** — opt into the tag map so DOM queries return the element classes:
`import type {} from "@primitiv-ui/web/tags"` (npm only).

**React 19 JSX** — `import type {} from "@primitiv-ui/web/react"` types the
tags, their attributes and the raw `onprimitiv-tabs-change` handler (npm only).
React 19 passes a custom element's event prop to `addEventListener` exactly as
written, which is why the prop reads that way; most React projects want
`@primitiv-ui/react`, whose `onValueChange` is the idiomatic name.

**Vue 3 templates** — `import type {} from "@primitiv-ui/web/vue"` lets
`vue-tsc` check each tag's attributes and its `@primitiv-tabs-change` handler
(npm only). Also tell Vue's compiler the tags are custom elements:
`compilerOptions.isCustomElement: (tag) => tag.startsWith("primitiv-")`.

**Svelte 5 templates** — `import type {} from "@primitiv-ui/web/svelte"` lets
`svelte-check` check each tag's attributes and its `onprimitiv-tabs-change`
handler (npm only). Svelte needs no other setup: it renders unknown tags as
custom elements already.

**Angular** — add `CUSTOM_ELEMENTS_SCHEMA` to the component's `schemas`, bind
the value as a property (`[value]="value()"`), the other options as attributes
(`[attr.activation-mode]="mode"`), and listen with
`(primitiv-tabs-change)="onChange($event)"`. There is no typing entry: Angular
types a custom element's `$event` as `Event`, so cast it to
`CustomEvent<{ value: string; index: number }>` in the handler.

**Tooling** — `dist/custom-elements.json` is a Custom Elements Manifest, listed
as `customElements` in `package.json`, for editor completion and Storybook.

The elements write no `class` and no `style`. For the registry look, apply the
`primitiv-tabs*` classes from the registry stylesheet to your markup.

### Listbox

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@primitiv-ui/web@<version>/dist/cdn/listbox.js"></script>

<primitiv-listbox value="apple" aria-label="Fruit">
  <primitiv-listbox-option value="apple">Apple</primitiv-listbox-option>
  <primitiv-listbox-option value="banana">Banana</primitiv-listbox-option>
</primitiv-listbox>
```

- **The root is the `role="listbox"` and the only Tab stop**: name it with
  `aria-label`. Each option element *is* the `role="option"` — there is no
  button to write, since an option is never focused.
- **A cursor instead of focus.** Real focus stays on the root; the option under
  the cursor is published as `aria-activedescendant` and marked
  `data-highlighted`, so style that, not `:focus`. The cursor lands on the
  first selected option (else the first) when the list takes focus, and is
  cleared when it loses it. The arrows, Home, End and typing move it; Enter,
  Space or a click chooses.
- **`value` lists the selected options**, separated by spaces.
  `type="multiple"` lets options toggle independently and adds Shift+Arrow,
  Ctrl/Cmd+A and Ctrl/Cmd+Shift+Home/End range selection;
  `selection-follows-focus` selects as the cursor moves.
  `primitiv-listbox-change` fires first, with every option selected
  afterwards, and is cancelable.
- **Group options** in `<primitiv-listbox-group>`, named by a
  `<primitiv-listbox-group-label>` inside it. `disabled` options are skipped
  and never chosen.

### Select

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@primitiv-ui/web@<version>/dist/cdn/select.js"></script>

<primitiv-select name="fruit" value="apple">
  <primitiv-select-trigger>
    <button type="button" aria-label="Fruit"><primitiv-select-value placeholder="Pick a fruit"></primitiv-select-value></button>
  </primitiv-select-trigger>
  <primitiv-select-content>
    <primitiv-select-item value="apple">Apple</primitiv-select-item>
    <primitiv-select-item value="banana">Banana</primitiv-select-item>
  </primitiv-select-content>
</primitiv-select>
```

- **The `<button>` you write opens the list**; `<primitiv-select-content>` is
  the list itself, a `role="listbox"` shown as a `popover="auto"` panel in the
  top layer and anchored to the button. Each `<primitiv-select-item>` is an
  option. Opening focuses the chosen item; the arrows, Home, End and typing
  move; Enter, Space or a click chooses and returns focus to the button.
- **`value` is the chosen item**, mirrored into `<primitiv-select-value>` (an
  item's `<primitiv-select-item-indicator>` left out), which shows its
  `placeholder` until something is chosen. `primitiv-select-change` fires
  first and is cancelable; `primitiv-select-open-change` does the same for
  `open`.
- **A form control with a `name`.** The select keeps a visually hidden native
  `<select>` inside itself — as React's Select does — so the value submits,
  `required` blocks an empty submit, `disabled` leaves it out, and a form reset
  restores the value it first rendered with.
- A native `<select>` with the registry classes needs no element at all: reach
  for it when the list needs nothing but text.

## Layers

- **Controllers** (`TabsController`, `AccordionController`, `CollapsibleController`) hold a component's DOM behaviour —
  listeners, focus, the ordered collection of parts — and attach to whatever
  elements register with them. They never own state; their host does.
- **Element hosts** (`<primitiv-tabs>` …) are the public face: they keep state
  in reflected attributes and write the ARIA. The React adapter in
  `@primitiv-ui/react` is a second host over the same controllers.

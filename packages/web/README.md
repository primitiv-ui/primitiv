# @primitiv-ui/web

Primitiv's headless components as **standard custom elements**: light DOM, no
framework and no runtime dependencies beyond
[`@primitiv-ui/core`](../core/README.md). They work in a plain HTML page, any
server-rendered stack (HTMX, Rails, Django, Laravel, Spring …), and inside
React, Vue, Angular or any other framework.

> **Status: published.** Tabs, Accordion, Collapsible, Modal, Popover, Tooltip, Dropdown and Context Menu so far. See
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
`/modal`, `/popover`, `/tooltip`, `/dropdown`, `/context-menu`) exports the classes and `defineTabs(registry?)` /
`defineAccordion(registry?)` / `defineCollapsible(registry?)` /
`defineModal(registry?)` / `definePopover(registry?)` / `defineTooltip(registry?)` /
`defineDropdown(registry?)` / `defineContextMenu(registry?)` with **no side
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

## Layers

- **Controllers** (`TabsController`, `AccordionController`, `CollapsibleController`) hold a component's DOM behaviour —
  listeners, focus, the ordered collection of parts — and attach to whatever
  elements register with them. They never own state; their host does.
- **Element hosts** (`<primitiv-tabs>` …) are the public face: they keep state
  in reflected attributes and write the ARIA. The React adapter in
  `@primitiv-ui/react` is a second host over the same controllers.

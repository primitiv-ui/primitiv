# @primitiv-ui/web

Primitiv's headless components as **standard custom elements**: light DOM, no
framework and no runtime dependencies beyond
[`@primitiv-ui/core`](../core/README.md). They work in a plain HTML page, any
server-rendered stack (HTMX, Rails, Django, Laravel, Spring …), and inside
React, Vue, Angular or any other framework.

> **Status: published.** Tabs, Accordion and Collapsible so far. See
> [RFC 0033](../../docs/rfcs/0033-web-components.md) for the design.

## Components

| Component | Elements | Change event | First release |
|---|---|---|---|
| Tabs | `primitiv-tabs`, `-list`, `-trigger`, `-content` | `primitiv-tabs-change` | 0.1.42 |
| Accordion | `primitiv-accordion`, `-item`, `-trigger`, `-content`, `-trigger-icon` | `primitiv-accordion-change` | 0.1.44 |
| Collapsible | `primitiv-collapsible`, `-trigger`, `-content`, `-trigger-icon` | `primitiv-collapsible-change` | 0.1.46 |

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

The main entry (`@primitiv-ui/web`, `/tabs`, `/accordion`, `/collapsible`)
exports the classes and `defineTabs(registry?)` / `defineAccordion(registry?)` /
`defineCollapsible(registry?)` with **no side effects**.

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

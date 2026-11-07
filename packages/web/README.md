# @primitiv-ui/web

Primitiv's headless components as **standard custom elements**: light DOM, no
framework and no runtime dependencies beyond
[`@primitiv-ui/core`](../core/README.md). They work in a plain HTML page, any
server-rendered stack (HTMX, Rails, Django, Laravel, Spring …), and inside
React, Vue, Angular or any other framework.

> **Status: publish-ready, first release pending.** Tabs is the first
> component. See [RFC 0033](../../docs/rfcs/0033-web-components.md) for the
> design.

## Use it

**No build step** — one script tag defines every element:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@primitiv-ui/web@<version>/dist/primitiv-web.js"></script>

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
import "@primitiv-ui/web/define";       // every element
import "@primitiv-ui/web/define/tabs";  // or one component's
```

The main entry (`@primitiv-ui/web`, `/tabs`) exports the classes and
`defineTabs(registry?)` with **no side effects**.

**Render `hidden` on inactive panels yourself.** Until the module loads, CSS
cannot tell which panel is active, so markup that omits it shows every panel.

**Listen with `primitiv-tabs-change`** (bubbles, cancelable, `detail: { value,
index }`) — call `preventDefault()` to veto a change — and `primitiv-tabs-show`
on a panel as it becomes active, for lazy loading.

**TypeScript** — opt into the tag map so DOM queries return the element classes:
`import type {} from "@primitiv-ui/web/tags"` (npm only).

**React 19 JSX** — `import type {} from "@primitiv-ui/web/react"` types the
tags, their attributes and the raw `onprimitiv-tabs-change` handler (npm only).
React 19 passes a custom element's event prop to `addEventListener` exactly as
written, which is why the prop reads that way; most React projects want
`@primitiv-ui/react`, whose `onValueChange` is the idiomatic name.

**Tooling** — `dist/custom-elements.json` is a Custom Elements Manifest, listed
as `customElements` in `package.json`, for editor completion and Storybook.

The elements write no `class` and no `style`. For the registry look, apply the
`primitiv-tabs*` classes from the registry stylesheet to your markup.

## Layers

- **Controllers** (`TabsController`) hold a component's DOM behaviour —
  listeners, focus, the ordered collection of parts — and attach to whatever
  elements register with them. They never own state; their host does.
- **Element hosts** (`<primitiv-tabs>` …) are the public face: they keep state
  in reflected attributes and write the ARIA. The React adapter in
  `@primitiv-ui/react` is a second host over the same controllers.

# @primitiv-ui/web

Primitiv's headless components as **standard custom elements**: light DOM, no
framework and no runtime dependencies beyond
[`@primitiv-ui/core`](../core/README.md). They work in a plain HTML page, any
server-rendered stack (HTMX, Rails, Django, Laravel, Spring …), and inside
React, Vue, Angular or any other framework.

> **Status: in development, not yet published.** Tabs is the first component
> (RFC 0033 Phase 2). The package is marked `private` until its distribution
> phase lands. See [RFC 0033](../../docs/rfcs/0033-web-components.md) for the
> design.

## Layers

- **Controllers** (`TabsController`) hold a component's DOM behaviour —
  listeners, focus, the ordered collection of parts — and attach to whatever
  elements register with them. They never own state; their host does.
- **Element hosts** (`<primitiv-tabs>` …) are the public face: they keep state
  in reflected attributes and write the ARIA. The React adapter in
  `@primitiv-ui/react` is a second host over the same controllers.

---
title: Introduction
---

# Introduction

**Primitiv** is a design system. **Harmoni** is the palette-generation engine
that powers it. This site documents both, plus a live, interactive workbench.

## Two names, one project

- **Primitiv** — the product: a headless, accessible React component library
  (`@primitiv-ui/react`) with zero styles shipped, plus an icon set
  (`@primitiv-ui/icons`) and design tokens (`@primitiv-ui/tokens`).
- **Harmoni** — the engine: a pure-Rust palette generator (`harmoni-core`)
  with a WebAssembly adapter (`harmoni-wasm`) that runs it in the browser.

## Repo layout

```
primitiv/
├── crates/
│   ├── harmoni-core/   # Pure-Rust palette generation + contrast audit
│   └── harmoni-wasm/   # wasm-bindgen adapter, consumed in the browser
├── packages/
│   ├── react/          # Headless React component library
│   ├── icons/          # Fill-based SVG icon library
│   └── tokens/         # DTCG design tokens
└── apps/
    ├── workbench/      # React dev surface (bundled into this site)
    ├── docs/           # This documentation site (VitePress)
    └── harmoni-figma-plugin/
```

## What's here

- [**CLI**](/guide/cli) — add styled components to a Vite or Next.js project
  from the command line.
- [**React components**](/react/) — every `@primitiv-ui/react` component, with its
  README and a runnable workbench example.
- [**Harmoni**](/harmoni/) — the Rust API and its WASM/TypeScript surface.
- [**Workbench**](/workbench/) — the live app; exercise any component in the
  browser, including on a phone.

> This site is pre-release. The content is the priority for now; a fully
> branded design comes later.

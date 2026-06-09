---
title: Getting started
---

# Getting started

Primitiv is developed as a pnpm + Cargo monorepo. During pre-release the
packages aren't published to npm — you work with them in the repo.

## Prerequisites

- Rust (stable)
- Node 20+ and pnpm 10
- [`wasm-pack`](https://rustwasm.github.io/wasm-pack/installer/) — only needed
  to rebuild the WASM package the workbench consumes

## Install & test

```sh
pnpm install
cargo test --workspace
```

## Run the workbench locally

```sh
pnpm run build:wasm   # regenerates crates/harmoni-wasm/pkg
pnpm run dev          # starts the workbench dev server
```

`build:wasm` rebuilds `crates/harmoni-wasm/pkg/`, which `apps/workbench`
consumes via a pnpm workspace link. That directory is not tracked in git; it is
always rebuilt from source.

Prefer not to run anything? The [workbench](/workbench/) is bundled into this
site — open it and try every component directly in your browser.

## Run the docs site locally

```sh
pnpm --filter @primitiv-ui/docs docs:dev
```

The React component pages are generated from the shared component list. After
adding a component to `packages/react`, update
`apps/docs/.vitepress/components.mjs` and regenerate:

```sh
pnpm --filter @primitiv-ui/docs gen:react
```

## Using a component

Every `@primitiv-ui/react` component is headless — accessible behaviour with zero
styles. Import it and bring your own CSS:

```tsx
import { Tabs } from "@primitiv-ui/react";

<Tabs.Root defaultValue="overview">
  <Tabs.List label="Account sections">
    <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
    <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="overview">…</Tabs.Content>
  <Tabs.Content value="settings">…</Tabs.Content>
</Tabs.Root>;
```

See the [React components](/react/) section for the full catalogue.

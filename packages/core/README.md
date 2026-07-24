# @primitiv-ui/core

The framework-agnostic half of Primitiv's components: pure TypeScript
constants, state derivation and DOM-attribute builders, with **no dependency
on any UI framework** — and no dependency on the DOM either.

```ts
import { getButtonRootAttributes } from "@primitiv-ui/core";

getButtonRootAttributes({ disabled: true });
// → { type: "button", disabled: true, "data-disabled": "" }
```

You do not normally install this package directly. It ships as a dependency of
a framework adapter — today `@primitiv-ui/react` — and exists so that a Vue,
Svelte, Solid or Angular adapter can be written without reimplementing (or
re-testing) a single behavioural rule.

## What belongs here

Anything a component decides that isn't about *how a particular framework
renders*:

- **Defaults** that carry meaning (`BUTTON_DEFAULT_TYPE` is `"button"`, not the
  DOM's `"submit"`).
- **Attribute derivation** — which ARIA and `data-*` attributes a part carries
  in a given state.
- **State transitions** — "which item does `ArrowDown` move to", "does this
  press select or deselect".
- **Value narrowing types** shared by every adapter (`ButtonType`).

## What does not

Anything that only has an answer inside a framework:

- Rendering, and choosing the host element.
- Reactivity: hooks, signals, stores, lifecycle.
- Prop forwarding, `ref` composition, and the `asChild` / slot mechanism.
- Portals, context, and event-handler binding.

The split has a useful test: if writing it down requires naming React, it is
not core.

## The adapter contract

A core module exposes plain functions over plain data. An adapter's job around
one is mechanical and looks the same in every framework:

1. Take the consumer's props.
2. Pass the *deriving* subset to the core function.
3. Spread the returned attributes **over** the forwarded props, so a derived
   attribute always wins.
4. Pick the host element and render.

Attribute maps omit keys rather than setting them to `undefined`. Declarative
frameworks (React, Vue, Solid) treat the two identically, but an imperative
adapter — a Svelte action, an Angular directive, plain JS — can then iterate
the map straight into `setAttribute` without filtering.

## Layout

```
src/<Component>/
  <component>.ts    the logic — constants and pure functions
  types.ts          the state input and attribute output shapes
  __tests__/        one file per concern, node environment, no DOM
  index.ts          barrel
```

## Testing

Same gates as `@primitiv-ui/react`, deliberately: 100% coverage (lines,
branches, functions, statements) **and** a 100% Stryker mutation score for
every component on the allowlist. Logic that migrates out of an adapter must
arrive under the same gate it left, or the extraction has quietly weakened the
suite.

```sh
pnpm --filter @primitiv-ui/core qa:units              # tests + coverage
pnpm --filter @primitiv-ui/core mutate:component Button
pnpm --filter @primitiv-ui/core typecheck
```

Tests run in vitest's `node` environment — core touches no DOM API, and the
tsconfig omits the `DOM` lib so that stays a compile-time guarantee rather than
a convention.

## Components

| Component | Exports |
| --- | --- |
| [Button](src/Button/README.md) | `getButtonRootAttributes`, `BUTTON_DEFAULT_TYPE`, `ButtonType`, `ButtonState`, `ButtonRootAttributes` |

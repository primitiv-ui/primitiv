# Framework-agnostic core — a study on Button

**Status:** exploratory study, one component landed as proof.
**Date:** 2026-07-24.

The question: can a component's logic be extracted into a framework-agnostic
`core` package, so that Vue, Svelte, Solid or Angular adapters consume it
instead of reimplementing it — with no behaviour lost or added, and every test
and mutation suite still passing?

**Short answer: yes.** `Button` is done and in the repo. The rest of this
document is what it cost, what it bought, and what the next twenty components
will actually be like — because Button is the easy case and the honest read of
this study is mostly about the hard ones.

---

## 1. What landed

A new workspace package, `@primitiv-ui/core` (`packages/core`):

- Zero runtime dependencies. No framework, and **no DOM** — the tsconfig omits
  the `DOM` lib so that stays a compile-time guarantee rather than a
  convention, and its tests run in vitest's `node` environment.
- Same gates as `@primitiv-ui/react`, deliberately: 100% coverage (lines,
  branches, functions, statements) and a hard 100% Stryker mutation score.
- Built by the repo's normal cycle: five red-green cycles, five commits, no
  characterisation tests.

The whole of Button's framework-agnostic behaviour is one function:

```ts
export function getButtonRootAttributes(state: ButtonState): ButtonRootAttributes {
  return {
    ...(state.asChild ? {} : { type: state.type ?? BUTTON_DEFAULT_TYPE }),
    ...(state.disabled ? { disabled: true, "data-disabled": "" } : {}),
  };
}
```

Three rules: `type` defaults to `"button"` not the DOM's `"submit"`; `type` is
withheld under `asChild`; `disabled` emits the native attribute **and**
`data-disabled=""`. React's `Button.tsx` now reads:

```tsx
const rootProps = { ...rest, ref, ...getButtonRootAttributes({ type, disabled, asChild }) };

if (asChild) return <Slot {...rootProps}>{children}</Slot>;
return <button {...rootProps}>{children}</button>;
```

What's left in the adapter is exactly React's share: forward props, forward the
ref, choose the host element.

### Verification

| Check | Before | After |
| --- | --- | --- |
| Button tests (React) | 33 pass | **33 pass, none modified** |
| Full React suite | 2115 pass, 100% coverage | **2115 pass, 100% coverage** |
| Button mutation (React) | 100%, 9 mutants | **100%, 8 mutants** |
| Button mutation (core) | — | **100%, 8 mutants** |
| `qa:prop-collisions` | clean | clean |
| `qa:registry-types` | clean | clean |
| Type-check (react, core) | clean | clean |

Not one Button test was touched. That is the load-bearing result: the extraction
is provably behaviour-preserving, because the entire existing suite — written
against the React component, never against the core function — still passes
unaltered.

*(The workbench build fails in the sandbox, but identically before and after:
every error is the pre-existing missing-`wasm-pack` gap logged in the
`sandbox-gotchas` skill. Zero errors come from this change.)*

### One deliberate behaviour-preserving change of shape

The old code emitted `"data-disabled": disabled ? "" : undefined`. Core omits
the key instead. In React, Vue and Solid these render identically — which is
why no test changed. But an adapter that applies attributes imperatively (a
Svelte action, an Angular directive, plain JS) would write the literal string
`"undefined"`. Omitting keys keeps the map safe to iterate:

```ts
for (const [name, value] of Object.entries(getButtonRootAttributes(state))) {
  node.setAttribute(name, String(value));
}
```

This is the first genuinely new design constraint the study surfaced: **core
returns data that is safe to apply imperatively, not just data that happens to
spread correctly in JSX.**

---

## 2. The dividing line

The split that held up, and the test that made it easy to apply.

**Core** — anything a component *decides*:

- Defaults that carry meaning (`BUTTON_DEFAULT_TYPE`).
- Attribute derivation: which ARIA and `data-*` attributes a part carries in a
  given state.
- State transitions: which item `ArrowDown` moves to; whether a press selects
  or deselects.
- Value-narrowing types every adapter shares (`ButtonType`).

**Adapter** — anything that only has an answer inside a framework:

- Rendering and choosing the host element.
- Reactivity: hooks, signals, stores, lifecycle.
- Prop forwarding, `ref` composition, the `asChild` / slot mechanism.
- Portals, context, event-handler binding.

**The test:** if writing the rule down requires naming React, it isn't core.
Applied to `asChild`, this cleanly says: the *merge* (composing handlers,
concatenating `className`) is React's; the single decision that `type` is
withheld is core's. That's the only say core has in `asChild`, and it's the
right one.

### The adapter contract

Every adapter's job around a core function is the same four mechanical steps:

1. Take the consumer's props.
2. Pass the deriving subset to the core function.
3. Spread the returned attributes **over** the forwarded props, so a derived
   attribute always wins.
4. Pick the host element and render.

No adapter re-decides any rule. That is the property that makes a second and
third adapter cheap.

---

## 3. What the next components will actually be like

Button is the easy case, and the ratio is unflattering: three lines of logic
extracted from a component that was already only 25 lines. The interesting
question is whether the split survives contact with `Tabs`, `Slider` and
`Carousel`. From reading the existing code, components fall into four tiers.

### Tier 1 — already core, just in the wrong package (free)

Several modules under `packages/react/src/utils/` contain **no React at all**
today:

- `getKeyToActionMap.ts` — 95 lines mapping key → roving-tabindex action, with
  the orientation / RTL / Home-End / Enter-Space conventions. Pure data in,
  pure data out. This is textbook core logic.
- `deriveId.ts` — a template literal.
- `focusable.ts` — a CSS selector constant.

These move with a change of import path and nothing else. They are the obvious
first tranche: real value, essentially zero risk, and they immediately give a
Vue adapter the whole keyboard-convention layer.

### Tier 2 — policy is agnostic, mechanism is not (the interesting tier)

`useControllableState` is the archetype. Its *policy* is framework-neutral:
`isControlled = controlled !== undefined`; the setter always notifies
`onChange` but only writes internal state when uncontrolled; it deliberately
doesn't dedupe. Its *mechanism* — `useState`, `useCallback` — is entirely
React's.

The extraction shape is: core owns the decision, the adapter owns the storage.

```ts
// core
export function resolveControllableState<T>(controlled: T | undefined, internal: T | undefined) {
  return { isControlled: controlled !== undefined, value: controlled ?? internal };
}
```

with `useControllableState` reduced to a `useState` around it, and Vue's
equivalent a `ref` around the same call. Same for `useRovingTabindex` (178
lines: index arithmetic and skip-disabled logic are core; focus calls and refs
are not) and `useCollection`.

This tier is where the real payoff is — it is also where a caution applies. For
a 15-line hook, splitting policy from mechanism can be more ceremony than
value. The rule of thumb the Button exercise suggests: **extract when the
policy is something you'd otherwise have to re-explain to a second adapter
author**, not merely when it happens to be expressible without React.

### Tier 3 — DOM but not framework

`Modal`'s focus trap, `Popover`/`Tooltip` anchor positioning, `Carousel`'s
scroll measurement, `Slider`'s pointer-to-value maths. None of this is React,
but all of it touches `Element`, `getBoundingClientRect`, `scrollLeft`.

The `no DOM lib` rule that makes core's boundary crisp today would have to bend
here — either core gains a second, explicitly DOM-touching entry point, or
these stay in adapters and get duplicated. **This is the open architectural
question and it should be settled before extraction gets past tier 2**, because
retrofitting a tier split into a published package is expensive. Note that the
pure-maths half usually *can* be separated: `Slider`'s "given a fraction, a
min/max/step and thumb constraints, what's the value" is pure, and only the
"read the track rect" part is not.

### Tier 4 — genuinely adapter-only

Portals, context providers, `Slot`, `forceMount`, ref composition. These have
no core half and shouldn't get one. Roughly: every component keeps a real
React implementation; none of them become a thin shell.

---

## 4. Costs, honestly

**Two suites, two gates per component.** Button now carries 8 mutants in core
and 8 in react (was 9 total). Mutation CI runs both halves — folded into the
same job, since a core pass takes ~3s against the React pass's ~20s, and a
separate matrix would repeat the wasm build and install for no benefit.

**A real published dependency.** `@primitiv-ui/react` publishes raw source, so
`@primitiv-ui/core` must be a genuine published package, not an internal one.
That means: an 11th npm package and a 4th JSR package, both moving in lockstep,
plus publish ordering (core before react on JSR).

**The npm-vs-JSR asymmetry — the sharpest new edge.** On npm the dependency is
`"workspace:*"`, which `pnpm -r publish` rewrites at publish time. JSR has no
workspace protocol, so the same edge is declared as an import-map range in
`packages/react/jsr.json` (`jsr:@primitiv-ui/core@^<version>`), which
`bump-version.mjs` now moves alongside the 15 version fields, and which forces
core to publish to JSR first.

> ⚠️ **Unverified.** The JSR path could not be exercised in this sandbox — the
> `jsr` CLI fails to fetch its Deno binary through the agent proxy (hash
> mismatch). The npm side, the workspace linking, both test suites, both
> mutation gates and the bump-script round-trip were all verified locally. The
> JSR import-map approach is the documented mechanism for cross-package
> references, but **run `npx jsr publish --dry-run` in `packages/react` on a
> normal machine before the next release.** `publish.yml` already runs that
> dry-run as a preflight before any npm publish precisely so a JSR failure
> aborts with nothing published — so the blast radius of being wrong here is a
> failed workflow, not skewed registries.

**Indirection.** Reading `Button.tsx` no longer tells you the whole story. For
Button that's a poor trade; for `Tabs` it will be a good one. This is a real
cost and it argues against extracting tier-2 logic that only one adapter will
ever use.

---

## 5. Recommendation

The approach works, and the mechanism is now proven end-to-end and in the repo.
If it's worth continuing:

1. **Move tier 1 first** (`getKeyToActionMap`, `deriveId`, `focusable`). Pure
   relocation, no behaviour surface, immediate value to any second adapter.
2. **Settle the tier-3 DOM question** before extracting more. Either core gets
   a documented DOM-touching entry point or it doesn't, and that decision wants
   making while there's one component in the package rather than twenty.
3. **Then take one genuinely hard component end-to-end — `ToggleGroup` or
   `Tabs`** — and re-run this study's measurements. Button proves the mechanism
   but not the economics; a compound component with roving tabindex and
   controllable state is what actually tells you whether the split pays.
4. **Only then decide about adapters.** A second adapter is the entire point,
   and nothing before this step is verified against a non-React consumer. A
   throwaway Vue Button against the current core package would validate the
   contract cheaply.

Not recommended: extracting components one at a time in inventory order.
Without step 2 settled, half of them will need reworking.

If this direction is adopted, this document should be promoted to an RFC
(0020) — it is currently a study, not a decided design.

---
name: react-component-patterns
description: Reference for the architectural patterns shared by every headless component in packages/react. TRIGGER on any of: Slot, asChild, createStrictContext, useControllableState, useCollection, useRovingTabindex, deriveId, compound component, roving tabindex, controllable state, data-state/data-orientation/data-disabled, ref-as-prop, compose refs; or when scaffolding a compound component or wiring keyboard navigation / context for one. SKIP for read-only inspection turns and for non-React work.
---

# React component patterns

The headless components in `packages/react` share a small set of
patterns. Reuse them rather than reinventing — every existing component
(Accordion, Button, Carousel, Checkbox, Collapsible, Dropdown, Modal,
RadioGroup, Table, Tabs) is built on this foundation.

## 1. Compound component with strict context

Every compound component has a `Root` that owns state and emits a
context, plus sub-components (`.List`, `.Trigger`, `.Content`, etc.)
that consume that context. The context is paired with a strict hook
that throws when the sub-component is rendered outside its provider.

Build the pair with `createStrictContext`
(`packages/react/src/utils/createStrictContext.ts`):

```ts
import type { Context } from "react";

type FooContextValue = { activeValue: string; setActive: (v: string) => void };

// `createStrictContext` returns a tuple, but JSR rejects array-destructured
// exports as a "slow type". Bind the pair to a local const and re-export the
// two halves with explicit types so the public API stays analysable:
const fooContext = createStrictContext<FooContextValue>(
  "Foo sub-components must be rendered inside <Foo.Root>.",
  "FooContext",
);

export const FooContext: Context<FooContextValue | null> = fooContext[0];
export const useFooContext: () => FooContextValue = fooContext[1];
```

Convention: state lives in `use<Component>Root`, the context value is
assembled there, and `Root` renders `<FooContext.Provider value={ctx}>`.

> **JSR / slow types.** This package publishes to JSR, which forbids
> "slow types" (types that must be inferred). Two rules bite when authoring
> a component: never array-destructure an export (above), and **give every
> exported component an explicit return type** — `ReactElement` (or
> `ReactElement | null` / `ReactPortal`). `forwardRef` / `createContext`
> consts need an explicit type too. Verify with `npx jsr publish --dry-run`;
> see RELEASING.md §6.

## 2. Controlled vs uncontrolled state

Use `useControllableState`
(`packages/react/src/hooks/useControllableState.ts`) for any
`value` / `defaultValue` / `onValueChange` triple. Don't re-roll the
"is the consumer driving this?" branch.

```ts
const [value, setValue, isControlled] = useControllableState(
  controlledValue,        // T | undefined from props
  defaultValue ?? "",     // initial value for uncontrolled mode
  onValueChange,          // optional change notification
);
```

The setter notifies `onChange` in both modes. It does **not** dedupe —
add an early-return at the call site when the value hasn't changed
(see RadioGroup's `select`, Dropdown's `setOpen`).

Type-level: the props shape uses a discriminated union so consumers
can't pass both `value` and `defaultValue`. Mirror the shape in your
component's `types.ts`.

## 3. Item registration via useCollection

When a Root needs to know which Triggers/Items currently exist (for
roving tabindex, keyboard nav, dynamic validation), use `useCollection`
(`packages/react/src/hooks/useCollection.ts`):

```ts
const { register, itemsRef, keys } = useCollection<string, HTMLButtonElement>();
// in Trigger:
useEffect(() => {
  register(value, ref.current);
  return () => register(value, null);
}, [value, register]);
```

`keys` is React state, so re-renders fire when items mount/unmount —
required for the first registered item to be the keyboard home base.
`itemsRef.current` is a live `Map` for imperative reads inside event
handlers.

For collections that may unmount after a render-time throw (Accordion's
trigger validation), pass `{ updateKeysOnCleanup: false }` to keep the
keys array stable until the next mount.

## 4. Roving tabindex

`useRovingTabindex` (`packages/react/src/hooks/useRovingTabindex.ts`)
is the keyboard half of the WAI-ARIA roving-tabindex pattern. It maps
keypresses to abstract actions (`next`, `prev`, `first`, `last`,
`activate`) and delegates the actual focus/selection to `onNavigate`.

Caller is responsible for filtering `navigable`:
- RadioGroup, Accordion: pre-filter disabled items (arrow skips them).
- Tabs: pass unfiltered (arrow lands on disabled, doesn't activate) —
  this is Tabs' specific keyboard contract.

```ts
const { handleKeyDown } = useRovingTabindex({
  orientation, dir,
  navigable: triggerValues,
  currentKey: value,
  includeHomeEnd: true,
  includeActivate: true,
  onNavigate: (target, action) => {
    const shouldActivate =
      !disabledSet.has(target) &&
      (activationMode === "automatic" ||
        (activationMode === "manual" && action === "activate"));
    if (shouldActivate) activateTab(target);
    focusItem(target);
  },
});
```

Only horizontal respects `dir`. `orientation: "both"` enables all
arrows with no RTL inversion (used by RadioGroup).

## 5. Stable ID derivation

Wire `aria-controls` / `aria-labelledby` / matching DOM `id`s with
`deriveId` (`packages/react/src/utils/deriveId.ts`):

```ts
const rootId = useId();
const triggerId = deriveId(rootId, "trigger", value);
const panelId   = deriveId(rootId, "panel",   value);
```

Don't construct these template literals yourself — use the helper so
every compound stays consistent.

## 6. Slot / asChild pattern

`Slot` (`packages/react/src/Slot/Slot.tsx`) implements the Radix-style
`asChild` composition pattern with zero dependencies. Merge rules:

- **Event handlers compose** — child's handler runs first, then Slot's.
- **`style`** is shallow-merged; child wins on key collisions.
- **`className`** strings are concatenated.
- All other props default to the child's value; Slot is the fallback.
- Refs from both sides are composed via `composeRefs`.

Use in a sub-component:

```tsx
if (asChild) {
  return <Slot {...buttonProps}>{children}</Slot>;
}
return <button {...buttonProps}>{children}</button>;
```

Slot throws if `children` isn't exactly one React element. It reads
the child's ref from `element.props.ref` (React 19+) with fallback to
`element.ref` (React ≤18), so it composes refs correctly across both
runtime versions.

## 7. data-* styling surface

Every interactive element exposes its state via `data-*` attributes —
these are the primary styling hook for consumers (zero styles ship
with the library). Use the established vocabulary:

- `data-state="active" | "inactive"` — tab/accordion/radio selection.
- `data-state="open" | "closed"` — collapsible/dropdown/modal disclosure.
- `data-orientation="horizontal" | "vertical"`.
- `data-disabled` — present when disabled, omit otherwise.

Don't invent ad-hoc names; match what existing components use.

## 8. React 19 ref-as-prop

Sub-components destructure `ref` directly from props. No `forwardRef`
wrapper. Slot itself still uses `forwardRef` (a deliberate compatibility
choice to compose into both React 18 and 19 consumer trees).

## 9. JSDoc for docgen extraction

Every component's JSDoc is not just for editor hovers — the public docs
site generates its per-component / per-prop prop tables by running
`react-docgen-typescript` over this source (see
`docs/docs-site-planning.md` §1.5–1.16). Thin or mis-shaped JSDoc
produces thin or **silently broken** generated docs. The whole library
was brought to a single bar; a new component must land at that bar in
its DOCS commit, not later. Reference gold-standard examples:
`Button`, `Tabs`, `Select` (`.tsx` + `types.ts` of each).

**Component-level JSDoc** (block above each exported sub-component in
`<Component>.tsx`):

- Real prose describing what it renders and how it behaves — ARIA
  semantics, controlled/uncontrolled shape, context requirements,
  composition/`asChild` notes, gotchas. Not a one-liner.
- An `@extends HTMLXElement` tag mapping the root element to its DOM
  interface (`div`→`HTMLDivElement`, `button`→`HTMLButtonElement`,
  `ul`→`HTMLUListElement`, `li`→`HTMLLIElement`, `a`→`HTMLAnchorElement`,
  `input`→`HTMLInputElement`, `label`→`HTMLLabelElement`,
  `dialog`→`HTMLDialogElement`, `nav`/`section`→`HTMLElement`, …).
- One or more `@example` blocks (basic case + a common variant + any
  gotcha such as `asChild`).
- **Placement rule (a real bug the project hit, §1.16):** a JSDoc block
  tag consumes every line after it up to the *next* tag. `@extends`
  MUST sit immediately before the first `@example` (or be the very last
  tag when there is no `@example`) — never in the middle of prose, or it
  silently swallows the rest of the comment.
- Components that render **no DOM element** — pure context providers
  (`Root`/`Provider`) and `Portal`-style wrappers — carry **no
  `@extends`**. The compound namespace export (`export const Foo = {...}`)
  also carries none; document it with prose + a sub-component list +
  `@see` refs (mirror Select).

**Per-prop JSDoc** (in `types.ts`): every prop gets a real doc comment
(what it does, when to use it, interactions with other props), a
`@default` tag when it has a default, and `{@link OtherType.prop}` /
`{@link Component}` cross-references. Mirror the density of Tabs/Select.

**The `Omit`-narrowing rule — `Omit` a native attribute before you narrow
it (§1.16 / §1.21).** Any custom prop that **narrows or redefines a
same-named native HTML attribute** MUST appear in the
`Omit<ComponentProps<"tag">, "...">` list on that type first. If it
doesn't, TypeScript keeps *both* declarations (yours + the `node_modules`
one) and resolves them into an **intersection artifact** — and because TS
resolves that to something assignable, there is **no compile error** to
warn you:

- the resolved type turns into noise like
  `defaultValue: string | (readonly string[] & string)` instead of clean
  `string` — leaked into consumer hovers and the generated prop tables;
- a `ref` narrowed to a *different* element (e.g. `Ref<HTMLMenuElement>` on
  a base `<menu>` whose native ref is `HTMLElement`) becomes
  `Ref<HTMLElement> & Ref<HTMLMenuElement>` — a genuinely unusable type that
  breaks a styled wrapper spreading the props straight back (D58);
- `react-docgen-typescript` can also pick only the wider `node_modules`
  declaration and silently drop the narrowed type + its JSDoc.

A package-wide sweep (§1.21) found this in **10 components / 19 props** —
`defaultValue` on every value-bearing collection root (Accordion,
RadioGroup, RadioCard, SegmentedControl, ToggleGroup, MillerColumns,
Dropdown, Tabs), `value` on `Tabs.Trigger`, and `ref` on the
ContextMenu/Dropdown menu `Content`/`SubContent`. The fix is always the
same: add the attribute to the base `Omit`.

**Catch it automatically — don't rely on remembering to grep.** Run
**`pnpm qa:prop-collisions`** (`scripts/docs-data/scan-prop-collisions.mjs`):
it scans every exported `*Props`, flags any prop declared in *both*
own-source and `node_modules`, classifies NARROW (real artifact) vs benign
same-type redefinition, and **exits non-zero on any NARROW**. Run it before
the DOCS commit — it is the guard that keeps a new component from
reintroducing this, and belongs in CI. Common offenders it watches for:
`dir`, `value`, `defaultValue`, `label`, `type`, `role`, `size`, `checked`.
(`ref` / `children` re-declared with the *same* type for narrowing/JSDoc
are benign — the scan lists them separately; follow the established
convention.)

Verify the generated shape end-to-end when in doubt:
`react-docgen-typescript@2.4.0` works against the repo's `typescript@6.x`
(not `7.x`, which changed the internal API it relies on) — see §1.14 for
the working `propFilter`.

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
type FooContextValue = { activeValue: string; setActive: (v: string) => void };

export const [FooContext, useFooContext] = createStrictContext<FooContextValue>(
  "Foo sub-components must be rendered inside <Foo.Root>.",
  "FooContext",
);
```

Convention: state lives in `use<Component>Root`, the context value is
assembled there, and `Root` renders `<FooContext.Provider value={ctx}>`.

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

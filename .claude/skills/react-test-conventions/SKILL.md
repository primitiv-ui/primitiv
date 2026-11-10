---
name: react-test-conventions
description: How tests are organised, named, and written in packages/react — concern-based file splits, shared fixtures, userEvent v14 conventions and the literal-space gotcha, scoped vitest invocation, coverage exclusions. TRIGGER when writing or running tests in packages/react, when naming a new test file, when using userEvent, when wiring Arrange/Act/Assert blocks, or when filtering vitest to a single component. SKIP for non-React-test work.
---

# React test conventions

## Where tests live

```
packages/react/src/<Component>/__tests__/
├── <Component>.basic-rendering.test.tsx
├── <Component>.keyboard-interaction.test.tsx
├── <Component>.mouse-interaction.test.tsx
├── <Component>.controlled-state.test.tsx
├── <Component>.uncontrolled-state.test.tsx
├── <Component>.error-handling.test.tsx
├── <Component>.asChild.test.tsx
├── <Component>.fixtures.ts          # shared test data — not a test file
└── <Component>.<other-concern>.test.tsx
```

One test file per **concern**, not per sub-component. The taxonomy of
suffixes observed across Tabs/Accordion/Carousel/etc. is in
`.claude/skills/new-react-component/_generated/test-file-taxonomy.md`.

## File anatomy

- Top-of-file imports: the component, Testing Library `render`/`screen`,
  `userEvent` from `@testing-library/user-event`, fixtures from
  `./<Component>.fixtures`.
- `describe.each(fixtureArray)(...)` for parameterised cases.
- Arrange / Act / Assert structure inside each `it`. Don't comment the
  three letters explicitly — let the blank lines signal it.
- No helper render functions inside `__tests__/`. Tests call `render()`
  directly with complete JSX. Shared *data* belongs in `*.fixtures.ts`;
  shared *behaviour* doesn't.

## userEvent v14 conventions

```ts
const user = userEvent.setup();
await user.click(screen.getByRole("tab", { name: /home/i }));
await user.keyboard("{ArrowRight}");
await user.keyboard(" "); // ← literal space, NOT "{Space}"
```

The space gotcha is real: `user.keyboard("{Space}")` emits
`e.key === "Space"`, which doesn't match what real browsers produce.
The keymap in this library checks for `" "`. Always use the literal.

Every interaction is `await`ed. **Don't use `fireEvent` in new tests** —
drive everything through `userEvent`. `fireEvent` dispatches only the event
you name, so it skips what a real browser fires around it (`focusin`,
`pointerover`, the press before a click) and can test a path no user takes.
Where jsdom is missing the browser behaviour a real key or press would cause
(a `<dialog>`'s Escape → `cancel`), add it to the test polyfill rather than
firing the resulting event by hand.

## Coverage

Coverage is enforced at 100% by discipline. `vite.config.ts` excludes:
test files, `__tests__/`, `/test/`, `index.ts`, `types.ts`. Don't add
your own exclusions to pass a gap — close the gap with a test or
remove the unreachable code.

## Running tests

Scoped (during a TDD cycle):

```sh
pnpm --filter @primitiv-ui/react vitest run src/<Component>
```

Full suite with coverage (before a docs commit or at end of cycle):

```sh
pnpm --filter @primitiv-ui/react qa:units
```

Watch mode:

```sh
pnpm --filter @primitiv-ui/react qa:units:watch
```

Per CLAUDE.md efficiency notes: one test run per green check is
enough. Skip the redundant full-suite + `--coverage` after every
single commit unless you suspect a coverage gap or cross-component
regression.

## jsdom polyfills

`vitest.setup.ts` polyfills APIs missing in jsdom: `popover`,
`scrollIntoView`, `IntersectionObserver`. If a new component depends
on another browser-only API, add the polyfill to the setup file
rather than guarding each test.

## Fixtures

`<Component>.fixtures.ts` exports constant arrays of cases for
`describe.each`. Typical shape:

```ts
export const arrowKeyCases = [
  { key: "{ArrowRight}", from: "tab1", expected: "tab2" },
  { key: "{ArrowLeft}",  from: "tab2", expected: "tab1" },
  // ...
] as const;
```

Don't export render helpers from fixture files. Don't put `it`/`test`
calls there either — fixtures are pure data.

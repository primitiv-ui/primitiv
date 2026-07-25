# NavigationMenu — mutation hardening handoff

**Status:** headless component landed and green on tests; **mutation gate not
met.** Scoped run on 2026-07-25:

```
Mutation score 77.29% — 251 mutants, 60 survived, 3 no-coverage, 1 timeout
```

`NavigationMenu` is deliberately **not** in
`packages/react/mutation-allowlist.json` — that file is gated at
`thresholds.break = 100`, so adding it before the score is 100% turns the
mutation CI job red.

Reproduce:

```sh
pnpm --filter @primitiv-ui/react mutate:component NavigationMenu
node scripts/mutation-survivors.mjs NavigationMenu
```

The component's own suite is 76 tests at 100% lines / branches / statements /
functions, so **everything below is a missing assertion, not missing
coverage.** Load the `mutation-testing` and `react-test-conventions` skills
before starting.

---

## Two decisions the human deferred to this work

### 1. Dependency-array mutants — judge case by case

Roughly 13 survivors are `ArrayDeclaration` mutants on `useCallback` /
`useMemo` / `useEffect` dependency arrays (`[deps]` → `[]` or
`["Stryker was here"]`). Freezing the array pins the closure at first render.

The agreed approach, in preference order:

1. **If a dep can actually change, write the re-render test.** The stale
   closure is then a real bug and the test is meaningful. `delayDuration`,
   `closeDelay`, `orientation` and `dir` are all consumer props that can
   change between renders — these are genuinely killable.
2. **Only where the dep is provably a stable identity** (a `useRef` object, a
   `useId` value, a `useState` setter, another `useCallback` with `[]` deps)
   does a `// Stryker disable next-line ArrayDeclaration` become acceptable —
   **with a written justification naming why that specific dep cannot
   change.**
3. **Do not** apply one blanket disable across all deps-array mutants. It was
   considered and rejected: it would hide a real stale-closure bug the day one
   of those deps becomes dynamic.

### 2. Prefer deleting the mutant over disabling it

Several survivors exist only because of defensive code that isn't needed. Two
already identified — fix these by simplifying, which removes the mutants
altogether rather than arguing about equivalence:

- **`useNavigationMenuRoot` L25–L27 (the 3 no-coverage mutants).** The hook
  declares `orientation = "horizontal"`, `dir = "ltr"`, `openOnHover = true`
  as default parameters, but `NavigationMenuRoot` has its own defaults for all
  of them and always passes explicit values — so the hook's defaults are
  unreachable. Delete them from the hook and let the component own the
  defaults (it already does).
- **`cancelOpen` / `cancelClose` null guards (L78–L83, L85–L90).** The
  `if (timerRef.current !== null)` wrapper produces a cluster of mutants,
  including a genuinely equivalent `ConditionalExpression -> true` (calling
  `clearTimeout(null)` and re-nulling an already-null ref are both no-ops).
  `clearTimeout(undefined)` is a spec'd no-op, so the guard is unnecessary:
  switch the refs to `ReturnType<typeof setTimeout> | undefined` and
  unconditionally `clearTimeout(ref.current); ref.current = undefined;`. The
  whole cluster disappears.

---

## Survivors by file, with the test that should kill each

Line numbers are against the commit this doc lands on. Re-run the report
first — the simplifications above will shift them.

### `hooks/useNavigationMenuRoot.ts` — 26 survivors, the bulk of the work

| Lines | Mutants | Kill with |
|---|---|---|
| L25–27 | 3 × NoCoverage on default params | Delete the redundant defaults (see above) |
| L54 | `OptionalChaining` on `entriesRef.current.get(key)?.focus()` | Arrow-key onto an entry whose element has unregistered — a `navigable` key with no live element. Without `?.` it throws |
| L78–83, L85–90 | `cancelOpen`/`cancelClose` guard cluster | Simplify the guards away (see above). What remains needs a test where cancelling **matters**: hover trigger A so its open timer is pending, then click trigger B — A's timer must not later steal the open panel back |
| L99 `ConditionalExpression -> false` | forces the timer path even when a panel is already open | The existing "switches panels with no delay" test *should* kill this and doesn't — **investigate before writing a new test.** Suspect `perTest` coverage attribution. Try an explicit assertion that `onValueChange` fires synchronously on the sibling hover |
| L117 `ConditionalExpression -> false`, `StringLiteral` | the `if (value === "") return` early-out in `closeAndRefocusTrigger` | Controlled nav, nothing open, press Escape → assert `onValueChange` is **not called**. The current test only asserts focus didn't move, which the mutant also satisfies |
| L120 | `OptionalChaining` on the trigger refocus | Controlled `value="ghost"` naming no rendered trigger, press Escape → must not throw |
| L121 | `StringLiteral -> "Stryker was here!"` on `setOpenValue("")` | Controlled nav, Escape → assert `onValueChange` called with exactly `""`. Current test asserts the panel is hidden, which a bogus open value also satisfies |
| L128 | `StringLiteral` on `setOpenValue("")` in `closeWithDelay` | Controlled nav, pointer-leave the `<nav>` → assert `onValueChange` called with exactly `""` |
| L133 | `ArrowFunction`/`BlockStatement` on the unmount cleanup | Fake timers: start a hover-open with a long `delayDuration`, unmount, advance past the delay, assert `onValueChange` was never called |
| L56, 66, 83, 90, 108, 122, 130, 137 | deps arrays | Decision 1. `L108` (`delayDuration`) and `L130` (`closeDelay`) are the genuinely killable ones — re-render with a changed prop and assert the new timing applies |

### `hooks/useNavigationMenuTrigger.ts` — 12 survivors

| Lines | Mutants | Kill with |
|---|---|---|
| L84 | `BooleanLiteral` — `useRef(false)` → `useRef(true)` | Real bug: with `defaultValue` set, a `true` initial flag makes the effect steal focus into the panel on mount. Assert focus is **not** moved on mount when `defaultValue` opens a panel |
| L86 | `LogicalOperator` — `!pending \|\| !open` → `&&` | Falls out of the mount-focus test above plus the existing ArrowDown tests; verify |
| L87, L103 | `BooleanLiteral` on the pending-flag resets | Press the enter-panel arrow twice; focus must land in the panel both times without a second spurious focus move |
| L88, L104 | 4 × `OptionalChaining` on the panel focus lookup | ArrowDown into a `Content` with **no focusable children** must not throw. Add a fixture entry whose panel holds only text |
| L67 | `BlockStatement` on `pointerLeave` | Hover a trigger with a long delay, leave it, wait past the delay → panel must not open |
| L65, L70, L112 | deps arrays | Decision 1 |

### `hooks/useNavigationMenuIndicator.ts` — 5 survivors

| Lines | Mutants | Kill with |
|---|---|---|
| L30 | `ConditionalExpression`, `StringLiteral`, `BlockStatement` on the `openValue === ""` early-out | Open a panel (geometry published), then close it → assert both custom properties are cleared, not left stale |
| L56 | `ArrowFunction`, `StringLiteral` on the `resize` listener registration | The existing resize test covers the happy path; add the unlisten side — unmount and dispatch `resize`, asserting no error, and assert the listener is `removeEventListener`'d with the same reference |

### `hooks/useNavigationMenuEntry.ts` — 3 survivors

| Lines | Mutants | Kill with |
|---|---|---|
| L25 | `StringLiteral -> ""` | The thrown error message. Existing test uses a substring `toThrow` that the mutant still satisfies — tighten it |
| L30 | `ConditionalExpression -> true`, `StringLiteral` on `openValue !== "" && openValue === value` | Assert an entry whose value is `""` is **not** treated as open |

### `hooks/useNavigationMenuTopLevelEntry.ts` — 3 survivors

| Lines | Mutants | Kill with |
|---|---|---|
| L37 | `ArrowFunction` on the registration effect's cleanup | Unmount one entry from a 3-entry nav, then arrow from a survivor — travel must skip the removed entry rather than focusing a detached node |
| L38, L46 | deps arrays | Decision 1. `L46` guards the `enabled ? entryKeys : []` narrowing and is likely killable |

### `utils.ts` — 2 survivors

`L11`/`L12`: the `"trigger"` / `"panel"` `deriveId` suffixes → `""`. Both sides
derive through the same helper so the ids stay mutually consistent and nothing
observable changes. **Killable and worth killing** — the DOM ids are a public
surface. Add an `ids` test (the taxonomy already has that suffix, used by Tabs)
asserting the trigger id contains `-trigger-` and the panel id `-panel-`.

### `NavigationMenuContext.ts` — 2 survivors

`L14`/`L35`: the strict-context error strings → `""`. The existing
error-handling test asserts these messages, so **check why they survived** —
most likely the `createStrictContext` call passes the message as one argument
and the mutant hits the `displayName` argument instead. Assert
`NavigationMenuContext.displayName` and `NavigationMenuItemContext.displayName`
directly.

### `NavigationMenu.tsx` — 3 survivors

| Lines | Mutants | Kill with |
|---|---|---|
| L268 | deps array on `Item`'s `useMemo` | Decision 1 — `value` is a real prop, so a re-render changing an Item's `value` should be observable |
| L357, L671 | `ObjectLiteral -> {}` on the spread prop objects | Assert a pass-through prop (e.g. `className`, `data-*`) actually reaches the rendered element for `Trigger` and `Link` |

---

## Definition of done for this handoff

1. `pnpm --filter @primitiv-ui/react mutate:component NavigationMenu` reports
   **100%**, no survivors, no no-coverage.
2. Every `// Stryker disable` carries a justification naming the specific
   reason that mutant is equivalent. Aim for as few as possible; prefer
   deleting the code that generates them.
3. `pnpm --filter @primitiv-ui/react exec vitest run src/NavigationMenu` green
   **and** `pnpm --filter @primitiv-ui/react typecheck` clean — vitest runs
   through esbuild and will not catch a type error.
4. `NavigationMenu` added to `packages/react/mutation-allowlist.json`.
5. `CLAUDE.md`'s NavigationMenu bullet updated: replace the "mutation
   hardening is NOT finished" paragraph with the achieved score.
6. This file deleted — it is a handoff, not permanent documentation.

## What is explicitly *not* in scope here

Registry styles and the kitchen-sink example are a **separate** follow-up
session (the human's call). Examples now live in `apps/kitchen-sink`, **not**
the workbench — a workbench example was built during the original session and
deliberately reverted. Don't re-add one.

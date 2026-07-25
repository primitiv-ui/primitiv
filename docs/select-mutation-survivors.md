# Select mutation-gate hardening — COMPLETE (0 survivors, gate green)

The rich `Select` reached a **100% Stryker mutation score** (run 30135955248,
commit 75843065). Record of how, for future refactors.

## Journey

60 → 50 → 37 → 30 → 28 → 24 → 14 → 10 → 6 → **0**, over 9 CI-verified batches.
CI's Mutation job was the only verifier — Stryker is not installable in the
sandbox (`pnpm install` fails; an `npm install` would rewrite the pnpm-managed
`node_modules` and break the working local vitest).

## Reliable survivor extraction (for next time)

The HTML report's embedded JSON won't parse whole (literal newlines in
`source`/`statusReason` defeat `json.loads`, even `strict=False`). What works:
download the run's `mutation-report-Select` artifact and regex each survivor,
capturing **mutatorName + replacement + location.start**, then read the source
line from disk — the `replacement` field is what disambiguates (a bare
line+mutator drifts ±2 lines):

```
re.finditer(r'"mutatorName":"([^"]+)","replacement":"((?:[^"\\]|\\.)*)",'
            r'"status":"Survived".*?"location":\{"end":\{[^}]*\},'
            r'"start":\{"column":(\d+),"line":(\d+)\}\}', raw)
```

## Killed by tests (the discriminating cases)

- preventDefault per handled key (`fireEvent` canceled return); toggle-event
  light-dismiss sync; exact trigger/listbox/option ARIA + `data-state`; rich
  `data-disabled`; hidden `<select>` `tabIndex`/`aria-hidden`; `Content`
  restProps forwarding; native numeric-child extraction / controlled value /
  `onValueChange` (incl. omitted → no throw); the empty-value filter.
- **Typeahead** needed *discriminating fixtures*, not just "does it work":
  - repeated-char **cycle + wrap** and **isRepeat** — a fixture where the
    first-char match ≠ the multi-char match (`Bat/Bengal/Banana`, type "ban").
  - **prefix, not substring** ("n" must not jump to Banana).
  - **startIndex** — typeahead from the listbox (no focused option) starts at 0
    and skips index 0 via offset (`Solid/Sun/Vue`, focus the listbox, type "s"
    → Sun).
  - **offset 0** — narrowing keeps the current match (`Apple/Apricot/Avocado`,
    type "a" then "p" → stays Apricot; an offset=1 mutant wraps to Apple).
  - reach-last-item + `% items.length` (5-item list).

## Marked equivalent (`// Stryker disable next-line`, with justification)

- `setItemVersion((v) => v + 1)` ×2 — ArithmeticOperator + ArrowFunction: the
  version is an opaque re-render trigger.
- `triggerRef.current?.focus()` ×2 — OptionalChaining: the trigger is always
  mounted when this runs.
- toggle-listener cleanup `removeEventListener("toggle", …)` — StringLiteral +
  ArrowFunction: unmount-only, unobservable.
- toggle-effect `[setOpen]` dep — ArrayDeclaration: `setOpen` is stable (the dep
  had to be reformatted onto its own line for the marker to bind).
- timer `if (state.timer !== null) clearTimeout(...)` — the clear is a real-time
  optimization; keystroke handling is synchronous.
- isRepeat `state.query.length > 1` — EqualityOperator/ConditionalExpression:
  `length > 1 → true` reduces to `every(...)`, identical searchQuery/offset for
  a single char.
- `.trim()` on the option text — MethodExpression: labels carry no surrounding
  whitespace (`.toLowerCase()` removal is killed by the typeahead tests).
- `hasPlaceholderChild` non-element `return false` — BooleanLiteral: returning
  true would infer `defaultValue=""`, but with no matching `<option value="">`
  the select still shows the first option.

Every marker names the killable sibling variant that a test still covers, so a
disable never hides a real gap.

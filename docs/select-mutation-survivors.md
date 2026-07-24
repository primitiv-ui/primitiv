# Select mutation-gate hardening — progress

Tracking the Stryker mutation gate for the new rich `Select` (added to the
allowlist 2026-07-24). CI's Mutation job is the source of truth — Stryker is
**not** installable in the sandbox (`pnpm install` fails; an `npm install`
would rewrite the pnpm-managed `node_modules` and break the working local
vitest), so each batch is verified by a CI re-run (~12 min) rather than
locally.

## Progress

- **Initial (commit 9f63dc01):** 60 survivors.
- **Batch 1 (5c43299e):** preventDefault-on-handled-keys, toggle-event
  light-dismiss sync, exact trigger/listbox/option ARIA + data-state wiring.
  → 50.
- **Batch 2 (d1f055d8):** dedicated typeahead suite (same-first-letter fixture:
  single-char jump, offset skip, repeated-char cycle + wrap, multi-char prefix,
  no-match) + `[setOpen]` equivalent marker. → **37.**

## Remaining (37, after run 30128847909)

The tail is **equivalent-mutant-heavy** — mutants with no observable behaviour
difference, retired with `// Stryker disable next-line <Mutator>: <reason>`
(repo convention; see RadioGroup / Accordion), not tests. High-confidence
equivalents to mark:

- `useSelectRoot.ts` `setItemVersion((v) => v + 1)` (ArithmeticOperator) — the
  version value is opaque; any change fires the same re-render.
- `useSelectContent.ts` cleanup `removeEventListener("toggle", …)` (StringLiteral)
  — a wrong event name on unmount leaks a listener but is unobservable in test.
- `useSelectRoot.ts` `itemValues` memo dep / `Array.from(keys())` — assess:
  likely equivalent under jsdom's `<select>` value handling, but verify before
  disabling.

Genuinely-testable remainder: typeahead `every`/`split`/boundary internals, the
`select()` close path, and native text-extraction / Value-mirror conditionals
in `Select.tsx`.

Regenerate the exact line list from the latest run's `mutation-report-Select`
artifact before each batch (parse survivors by `"status":"Survived"` + the
trailing `location.start`). Note: regex extraction from the HTML report has
been slightly unreliable on line attribution — for confident
equivalent-vs-testable calls, prefer per-mutant manual mutation (apply to
source, run the covering vitest, confirm it fails, revert) or a session with
working local Stryker.

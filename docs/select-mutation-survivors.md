# Select mutation-gate hardening — progress & residual

Stryker mutation gate for the rich `Select` (in the allowlist since
2026-07-24). CI's Mutation job is the source of truth — Stryker is **not**
installable in the sandbox (`pnpm install` fails; `npm install` would rewrite
the pnpm-managed `node_modules` and break the working local vitest), so each
batch is verified by a CI re-run (~12 min).

## Progress

- Initial (9f63dc01): **60** survivors.
- Batch 1 (5c43299e): preventDefault-per-key, toggle light-dismiss sync, exact
  ARIA/data-state wiring. → 50.
- Batch 2 (d1f055d8): dedicated typeahead suite (single/offset/cycle/wrap/
  prefix). → 37.
- Batch 3 (55b93fa0): equivalents (opaque `setItemVersion(v+1)` ×2, unreachable
  `triggerRef?.focus()` ×2, cleanup `removeEventListener`) + select-commit
  onOpenChange-once + hidden-form-field tests. → 30.
- Batch 4 (0de0d9f1): Enter-selects-first, typeahead prefix-not-substring,
  cleanup-arrow equivalent. → **28**.

## Residual (28, run 30131345016) — the hard tail

Line numbers below are approximate (±2 — the HTML report's embedded source has
literal newlines that defeat JSON parsing, so extraction is regex-based). Group
by construct, not line.

### `useSelectContent.ts` — typeahead boundary logic (~17)
`if (event.key.length === 1)`, `if (state.timer !== null) clearTimeout(...)`,
`state.query.length > 1 && every(c === query[0])`,
`searchQuery = isRepeat ? query[0] : query`,
`startIndex = currentIndex < 0 ? 0 : currentIndex`,
`offset = searchQuery.length === 1 || isRepeat ? 1 : 0`,
`for (i=0; i<items.length; i++)`, `(startIndex + offset + i) % items.length`.
- **Killable** (add discriminating tests): the `%` modulo (a 5+ item fixture
  where the wrap index differs under `*`/`+`), `i < items.length` bound (a
  match only at the last item), `timer !== null` (type two chars within the
  window vs after — a first-keystroke path has `timer===null`).
- **Equivalent variants** (mark per-line with justification, à la RadioGroup):
  `length > 1` → `>= 1` is equivalent because a single char already takes the
  `length === 1` offset path identically; `searchQuery.length === 1 || isRepeat`
  has overlapping true-regions. Mark ConditionalExpression/EqualityOperator on
  those two lines with a note that the killable sibling is covered by the
  cycle/offset tests and the residual variant is behaviourally identical.

### `Select.tsx` — conditionals (~10)
`onValueChange?.(…)` (native), `value !== undefined ? {value} : …` (controlProps),
rich item `tabIndex`/`data-disabled ? "" : undefined`, `itemValues.filter(v => v !== "")`,
native text-extraction `typeof child === "string" || … === "number"`, Group/Content
`asChild` branches.
- **Killable**: assert a rich item with `disabled` gets `data-disabled=""` and an
  enabled one does not (kills the `disabled ? "" : undefined`); assert native
  controlled vs uncontrolled `value`/`defaultValue` reach the `<select>`
  (controlProps); assert native text-extraction keeps a *number* child (kills the
  `=== "number"` arm); assert Content/Group `asChild` compose (some already
  tested — extend).

### `useSelectRoot.ts` (~1)
`useControllableState` call args (likely equivalent / covered) — verify.

## How to continue efficiently
1. Regenerate the residual before each batch: download the run's
   `mutation-report-Select` artifact and grep survivors
   (`"status":"Survived"` + trailing `location.start`); cross-check each line
   against the current source (regex drifts ±2).
2. Prefer **killable tests first**; only mark a mutant equivalent when you can
   state *why* a test cannot distinguish it (unreachable branch, opaque value,
   overlapping condition region) — never blanket-disable to force green.
3. Each batch → commit → push → CI Mutation re-run → repeat until the Select
   job reports score 100 and the gate is green.

A fresh session (more budget) or one with working local Stryker/`--incremental`
would close this out fastest.

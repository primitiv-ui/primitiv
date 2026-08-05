# Consumer-testing findings & fixes log

A running log of concrete engineering action items surfaced by RFC 0026
runs, appended to after each run's reviewer report — never edited
retroactively, only added to. This is distinct from the per-run
`report.md` files themselves, which live in the scratch repo
(`simonrevill/primitiv-consumer-testing/runs/<folder>/report.md`) and stay
there: this doc tracks what actually got *done* about a finding, since
fixes land here in `primitiv-ui/primitiv`, not in the scratch repo. Not
mirrored to the scratch repo — this is operator-side tracking, not
something a builder or reviewer session needs handed to it.

**Status values:** `open` (surfaced, not yet actioned) · `fixed` (landed,
commit linked) · `wontfix` (considered, deliberately not changing — reason
given) · `tracked` (already has its own RFC/ROADMAP entry, no separate
action needed here).

## Profile A — 2026-08-05 (Fernglass Plant Co.)

Full report: `simonrevill/primitiv-consumer-testing/runs/2026-08-05-fernglass-plant-co/report.md`

- **`Button` breaks `asChild` for a single child.** `Children.map` always
  returns an array even for one child, so the copied `button.tsx`'s
  unconditional text-wrapping step hands `Slot` an array instead of one
  element — `Slot` requires exactly one. Confirmed real, reproducible,
  root-caused (`button.tsx:45-60`). Every `primitiv add button` consumer
  gets the same broken generated file today. **Status: open** — fix
  belongs in the `contract.json` generator, not as a per-consumer patch.
- **`primitiv init` doesn't generate the theme layer from `theme.brand`.**
  A consumer who answers the brand-colour prompt during `init` still has
  to separately discover and run `primitiv theme --brand` by hand.
  **Status: open** — candidate fix: `init` calls `theme` automatically
  once `theme.brand` is set.
- **`primitiv add` defaults to a caret range**, not an exact pin — no flag
  to pin a component's dependency exactly without a manual
  `package.json` edit afterward. **Status: open.**
- **`@primitiv-ui/react` ships raw TS source incompatible with Vite's
  default `verbatimModuleSyntax`** setting — errors surface *inside
  `node_modules`*, which is a confusing place for a consumer to have to
  look. **Status: open** — worth a README note at minimum, a packaging
  fix at best.
- **Generated `tokens.css` has no generic font-family fallback** on
  `--primitiv-font-family-*`. **Status: open** — small emitter fix.
- **`Table`'s horizontal scroll has no visual affordance** — no
  shadow/gradient hint that `.primitiv-table__scroll-area` scrolls.
  Works correctly, but reads as broken from a screenshot alone.
  **Status: open.**
- **`AvatarGroup`'s initials-fallback overlap is close to illegible**
  once every avatar in a stack is simultaneously in fallback state — the
  ~30% overlap is tuned for photographic faces, not two-character text.
  Only exposed in this run because the sandbox blocked the placeholder
  image host, but it's a real, reproducible boundary case (any consumer
  whose avatar images fail to load hits the same thing). **Status: open**
  — needs a design decision (smaller fallback-mode overlap? a
  minimum-legible-size floor?), not just a token tweak.
- RFC 0026 wasn't visible in the reviewer's checkout because this branch
  hadn't been merged to `main` yet, so it fell back to citing RFC
  0022/0025 instead (self-corrected fine, but worth fixing). **Status:
  fixed** — this merge.

`Container`/`Grid`/breakpoints (known-gap, already tracked at RFC 0022
§4/§7/§9) and the home nav's flat-link mobile layout (not a gap — a
correct, documented scope call) don't need entries here; see the full
report for those.

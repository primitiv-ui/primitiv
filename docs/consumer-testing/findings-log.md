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
  **Independently reproduced in Profile B** (2026-08-05), which upgrades
  this from "sandbox artifact" to a real-world gap: any consumer whose
  font request is blocked, slow, or absent — corporate proxy, ad
  blocker, privacy extension, offline-first PWA, not just this test's
  sandbox — falls all the way back to the browser default with no
  intermediate fallback family.
- **`Table`'s horizontal scroll has no visual affordance** — no
  shadow/gradient hint that `.primitiv-table__scroll-area` scrolls.
  Works correctly, but reads as broken from a screenshot alone.
  **Status: open.** Independently reproduced in Profile B (same defect,
  different app).
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

## Profile B — 2026-08-05 (Northfield & Co.)

Full report: `simonrevill/primitiv-consumer-testing/runs/2026-08-05-northfield-and-co/report.md`

**Brand reconciliation worked exactly as hoped.** This profile's whole
point was to observe, not prescribe, whether a brownfield consumer
reconciles Primitiv's theming with an existing house brand. It did: fed
the app's pre-existing `#c1440e` into `primitiv theme --brand`, verified
by the reviewer to round-trip byte-identical, and went one step further
unprompted — repointing the untouched legacy CSS's `font-family` to the
Primitiv type tokens so the *whole* site reads as one system, not just
the new pages. No entry needed here; noted because it's a real positive
signal about `theme --brand`'s ergonomics, not just an absence of bugs.

Container/Grid, the breakpoint gap, and the font-family-fallback and
table-scroll-affordance items above all recurred here independently —
see those entries. New items, not seen in Profile A:

- **`primitiv.json`'s `styles.enabled: false` is ignored** — set to
  suppress the global element reset (which fights a brownfield app's own
  bare-element rules), it had no effect; `primitiv-base.css` got written
  regardless. Worked around by running `primitiv tokens` with no
  `primitiv.json` present at all. **Status: open** — not yet root-caused
  (no file/line from this run), needs investigation into `init`/`tokens`'
  handling of that flag before it can be fixed the way the `asChild` bug
  was.
- **`Avatar.Image` needs a documented CSS rule the consumer has to
  remember to add — and this run forgot it.** `Avatar.tsx`'s own doc
  comment and `Avatar/README.md` both specify
  `img:not([data-status="loaded"]) { display: none }` as required, since
  the image stays mounted on error rather than unmounting. Neither of
  this run's stylesheets included it, so a failed image load shows the
  broken-image glyph visibly overlapping the fallback initials — a real
  bug for any end user whose photo fails to load, not a sandbox
  artifact. **Status: open** — not a Primitiv defect (the requirement is
  correctly documented), but worth asking whether the *registry* `avatar`
  component ships this rule by default and only the *headless-only*
  consumption path leaves it to the consumer to find in the README.
- **A reconciled brand theme is untested in dark mode, and dark mode
  breaks.** No theme toggle was built (reasonably — the brief didn't ask
  for one), so `[data-theme="dark"]` was never exercised. The reviewer
  forced it and found the token-driven content correctly flips, but the
  page background stays the legacy CSS's raw `#faf8f5` hex, since that
  file was correctly left untouched — so the reconciliation is
  light-mode-only in practice. **Status: open** — not obviously fixable
  without expanding this run's own scope (touching legacy.css further
  wasn't asked for), but worth a documented recommendation somewhere for
  brownfield consumers who *do* want dark-mode reconciliation: which of
  their existing CSS needs converting to tokens, not just the new UI.
- **Icon-package install ambiguity.** The brief names `@primitiv-ui/react`
  specifically; whether `@primitiv-ui/icons` was implicitly in scope was
  judged ambiguous, so the agent used inline SVGs instead. Not a Primitiv
  finding — a gap in our own brief wording. **Status: open** — fix
  `brief.md`/the addenda to state the icon package explicitly before
  Profile C runs.

**Component coverage: 12 of 12 installed components meaningfully used —
no dead installs**, unlike Profile A's 9 unused-but-installed components.
Worth noting as a structural contrast rather than a finding: `primitiv
add`'s registry install is near-zero-cost per component, so
over-installing costs nothing and nothing forces a consumer to actually
wire something up; a plain `npm install` + manual `import` can't produce
an unused component by construction. Not actionable on its own, but a
data point for how the two consumption modes differ in practice.

# Cross-profile synthesis — Profiles A, B, C (2026-08-05 – 2026-08-06)

The first full cycle of [RFC 0026](../rfcs/0026-consumer-testing-with-agent-personas.md).
Three profiles, three fictional businesses, Primitiv pinned at `0.1.29`
throughout. This is the synthesis step RFC 0026 §13 scoped as the last one
before feeding findings back into `ROADMAP.md` — read alongside
[`findings-log.md`](findings-log.md), which this doc summarises rather
than duplicates.

| Profile | Business | Consumption mode | Report |
|---|---|---|---|
| A | Fernglass Plant Co. | Greenfield, full styled registry | `runs/2026-08-05-fernglass-plant-co/report.md` |
| B | Northfield & Co. | Brownfield, headless-only | `runs/2026-08-05-northfield-and-co/report.md` |
| C | Kettlewell Coffee Roasters | Greenfield, Tailwind-powered | `runs/2026-08-06-kettlewell-coffee/report.md` (isolation compromised — see §4) |

## 1. Headline verdict

The question this whole program exists to answer: **is Primitiv usable by
a consumer who has never seen its internals?** Across three genuinely
different consumption modes, the answer is a qualified yes — with one
confirmed bug (now fixed), one clearly the highest-priority gap in the
library, and a handful of smaller, real DX rough edges.

**What held up well, independently verified by source inspection in every
run, not just self-report:**
- The token-only-styling rule. Every reviewer grepped for raw hex/px
  values outside the two CLI-generated files and found the rule genuinely
  honoured, with only minor exceptions (an inline style override, a
  couple of hand-typed `leading-*` values) — not a compliance breach in
  any run.
- `primitiv theme --brand`. Used successfully in both profiles that had a
  reason to (A, C) and, in Profile B, actively used to *reconcile* with a
  pre-existing brand colour — exactly the behaviour RFC 0026 §16 was
  designed to observe, unprompted and correctly executed.
- The Tailwind/Primitiv cascade-layer question RFC 0026 §5 left open
  resolved cleanly: Tailwind's own utilities layer sits after Primitiv's,
  so a bare Tailwind class predictably wins with no fighting.

**What didn't:**
- A real, shipped defect (`Button` breaking `asChild` on a single child)
  — found, root-caused, and fixed within the cycle; see §3.
- `Container`/`Grid`'s absence, exactly as RFC 0022/0025 predicted, and
  now the single most consistently-recurring finding across every run.
- `AvatarGroup`'s fallback-illegibility — a real design boundary case
  that recurred in all three runs independently.

## 2. Recurring findings — the strongest signal

A finding that shows up once could be one agent's idiosyncrasy. A finding
that shows up independently across profiles with genuinely different
consumption modes is a much stronger claim about the library itself. In
order of how many runs independently confirmed it (Profile C's
`prior-knowledge-plausible` items are **not** counted here — see §4):

| Finding | Runs | Status |
|---|---|---|
| `Container`/`Grid` absence — hand-rolled every time | A, B, C (3/3) | known-gap, tracked (RFC 0022/0025) — now flagged in `ROADMAP.md` with this evidence |
| No `measure`/reading-width token category | A, B, C (3/3) | open, no RFC yet |
| `AvatarGroup` fallback-illegibility | A, B, C (3/3) | open — needs a design decision, now flagged in `ROADMAP.md` |
| `tokens.css` font-family has no generic fallback | A, B (2/3 clean; C reproduced but tainted) | open |
| `Table` scroll has no visual affordance | A, B (2/3) | open |
| `Button`/`asChild` crash | A (found+fixed); C reproduced (tainted) | **fixed** |

Everything else in `findings-log.md` showed up in exactly one profile —
still worth having, but read those as single-run signal, not confirmed
patterns.

## 3. What got fixed vs. left open vs. wontfix

- **Fixed, same cycle:** the `Button`/`asChild` defect — and, once found,
  it turned out to affect five more components sharing the same
  generator shape (`toggle-group`, `tabs`, `segmented-control`, `avatar`,
  `accordion`, `collapsible`) plus three hand-authored components that
  copied the same pattern by design (`badge`, `tag`, `code-block`). Fixed
  at the generator level so it can't recur in a new component built the
  same way.
- **Investigated and downgraded to wontfix:** `styles.enabled` "ignoring"
  the base reset — turned out to be correct-by-design (RFC 0008 D60), not
  a defect; the real ask already had a zero-code-change answer.
- **Left open, deliberately:** everything else. Per the rule set after
  Profile A — fix what's confirmed, root-caused, and cheap immediately;
  defer judgement calls and multi-cause findings to this synthesis rather
  than patching piecemeal mid-program. That rule held for the whole cycle.

## 4. A real methodology failure, and what survived it

Profile C's isolation broke — the building agent researched
`primitiv-ui/primitiv` on GitHub mid-build and found this program's own
materials. Full account in RFC 0026 §19. The short version: neither lever
the RFC already had (no repo attached; the brief never naming Primitiv as
subject) controlled for an agent's own research initiative reaching public
GitHub content through a channel outside the repo-attachment model
entirely. The fix applied (`brief.md` now says, in character, not to
browse the vendor's internal repo) is unverified — no run has happened
since.

What's worth taking away operationally: the reviewer design didn't just
survive this, it's what caught it and made the run's report still usable.
Rather than discarding Profile C's findings wholesale, the reviewer
tagged every one `prior-knowledge-plausible` or
`independent-discovery-plausible`, and only the latter made it into
`findings-log.md`'s Profile C section (§2's table reflects that split
directly). That's the payoff of RFC 0026 §11.1's original argument — an
independent reviewer beats trusting self-report — extended to a failure
mode the RFC didn't originally anticipate.

## 5. Recommendations

1. **Re-run once `Container`/`Grid`/breakpoints land**, per RFC 0026 §8.
   Given how dominant that finding was across all three runs, it's the
   single most informative thing a future cycle could re-test — does the
   friction log's shape actually change, or does something else dominate
   once it's gone.
2. **Run at least one more Profile C** before treating the Tailwind
   findings as settled, both because that run's isolation was
   compromised and because RFC 0026 §11.2 already flagged that a single
   run per profile can't distinguish systemic issues from one-off noise.
   This would also be the first real test of whether the isolation fix
   holds.
3. **`AvatarGroup`'s fallback-illegibility is worth prioritising** ahead
   of other open findings — three independent, clean confirmations is
   about as strong as this kind of signal gets from a three-run program.
4. **A `measure`/`prose-width` token category is worth scoping**, even
   informally — three runs independently reaching for the same missing
   thing, each inventing its own values, is exactly the kind of gap this
   program was built to surface before a real RFC gets written for it.
5. **CLI DX backlog, lower priority but real:** `primitiv add --help`
   doesn't exist (and its absence directly contributed to Profile C's
   isolation breach — an agent that could self-serve the real flags
   would have had one less reason to go looking elsewhere); `add`
   defaults to a caret range with no exact-pin flag; `init` doesn't
   auto-generate the theme layer from `theme.brand`; the Tailwind format
   doesn't self-supply token values.

## 6. Status

RFC 0026's first full cycle is complete: three profiles run, one
confirmed defect found and fixed, one investigated finding correctly
downgraded, a real methodology gap discovered and a first fix attempted,
and `ROADMAP.md` updated with consumer-testing evidence on the two
items it most directly bears on (`Container`/`Grid`, `AvatarGroup`). Next
cycle depends on `Container`/`Grid`/breakpoints landing, per
recommendation 1 above.

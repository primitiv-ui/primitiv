You're reviewing the output of a consumer-testing run against the
Primitiv design system. This session has two repos attached:
`primitiv-ui/primitiv` (the design system itself — `ROADMAP.md` and
`docs/rfcs/` are what you need) and `simonrevill/primitiv-consumer-testing`
(the run's output, under `runs/<folder>/` — you'll be told which folder).

Follow this order strictly — it matters:

1. **Before reading anything else in the run folder**, install and run the
   built site yourself (`npm install`, then whatever dev/build/preview
   script it has) and take your own screenshots of all three pages at
   390px, 768px, and 1440px. Form your own first impression cold.
2. **Then** read the run folder's `NOTES.md` and its own screenshots.
   Compare against what you just saw yourself — note any place the two
   disagree (something `NOTES.md` claims that your own render doesn't
   support, or vice versa).
3. Scan the produced project's CSS/markup for any value that doesn't
   trace back to a Primitiv token (`--primitiv-*` custom property) —
   raw hex colours, arbitrary px/rem values, anything hand-rolled beyond
   plain structural layout. Cross-reference `docs/rfcs/` and
   `ROADMAP.md` in `primitiv-ui/primitiv` to tag each one `known-gap`
   (already tracked — Container/Grid and responsive breakpoints are the
   expected headline item, per RFC 0026 §7/§9) or `new-finding`.
4. Fill in `primitiv-ui/primitiv`'s `docs/consumer-testing/report-template.md`
   (copy its structure) with everything you found — run metadata,
   escape-hatch log, missing-component log, friction notes, component
   coverage, brand/theming notes, your screenshots, and your own
   independent reviewer-pass writeup.
5. Commit the filled-in report as `report.md` inside the same
   `runs/<folder>/` directory in `simonrevill/primitiv-consumer-testing`.

Be plain and specific — cite exact files/lines/values, not general
impressions. This report is what the actual decision-making happens from
afterward, so vague findings aren't useful.

The run folder to review: **[fill in the exact `runs/...` path once the
build session has finished and pushed]**

# Run report — [profile] / [run date]

Filled in by the reviewer after the run, from the built site, the
building agent's `NOTES.md`, its screenshots, and a fresh look at the
project — never by the building agent itself. See
[`README.md`](README.md) for why the split matters.

## Run metadata

- **Profile:** A / B / C
- **Primitiv version:** (should be `0.1.29` — flag if it drifted)
- **Model / harness:** (exact model id + Claude Code version or
  equivalent)
- **Environment:** (bare/repo-free session — confirm, don't assume)
- **Date:**
- **Turn/time budget set vs. actually used:**

## Escape-hatch log

Every raw value or hand-rolled CSS construct used outside a Primitiv
token/component — pulled from `NOTES.md` plus a scan of the produced CSS
for values that don't trace back to a `--primitiv-*` custom property.
Tag each `known-gap` (already tracked in `ROADMAP.md` or an open RFC —
Container/Grid and responsive breakpoints are the expected headline
item) or `new-finding`.

| Value/construct | Where | Reason (from NOTES.md) | Tag |
|---|---|---|---|
| | | | |

## Missing-component log

Anything the site wanted that doesn't exist in Primitiv today. Same
`known-gap`/`new-finding` tagging as above.

| Wanted | Where it would've been used | Tag |
|---|---|---|
| | | |

## Friction notes

Anything that took longer than it should have, any README/contract
ambiguity, any prop or token name that misled — read straight off
`NOTES.md`, not re-interpreted or embellished.

## Component coverage

List of components actually used *meaningfully* (styled and rendered with
real content, not just imported). Not a target to hit — a record of what
naturally got reached for.

## Brand / theming

- Command(s) run to set the brand colour, if any (verbatim).
- The emitted theme-token diff, if any.
- For Profile B specifically: did the agent attempt to reconcile
  Primitiv's theme with the existing `#c1440e` brand, or leave it
  unthemed and take only headless behaviour? Which, and how well did it
  hold together visually either way?
- Where a theme was set, does the auto-generated dark pairing actually
  read correctly against real content, per the reviewer's own screenshot
  check (not just the builder's say-so)?

## Screenshots

All three pages, at 390px / 768px / 1440px, confirmed present and
matching what `NOTES.md` claims was built. Note any mismatch between the
screenshots and the narrative.

## Reviewer pass

The reviewer's own independent read — rendered cold, without having seen
`NOTES.md` first if possible, then compared against it afterward. Anything
the builder missed, over-stated, or under-stated. This section is the
actual value of having a second session review at all — it should not
just restate the sections above.

# Carousel development log

> **Running journal.** The settled plan and decisions live in
> [`carousel-development-plan.md`](./carousel-development-plan.md). This
> file is the append-only memory between sessions: what landed each
> iteration, headless gaps discovered/filled, QA feedback + resolution,
> Figma-sync status, the live backlog, and open questions. Update it at
> the end of every iteration.

## Decisions (dated, append-only)

The seven locked decisions are in the plan doc's "Locked decisions"
section — read those first. New decisions taken during the cycle are
appended here:

- **2026-07-08 — Kickoff.** Locked decisions 1–7 established (kitchen-sink
  target, `/tweak-component` fast loop, Tabs-style knob+modifier API,
  reactive TDD gap-filling, basic-responsive-single-slide first, Figma
  designs read as the starting point, responsiveness a hard requirement).
  Iteration 1 spec agreed. Push-straight-to-`main` authorised for this
  workstream's fast kitchen-sink feedback loop.

## Iterations

### Iteration 0 — Setup (in progress)

- [ ] Dedicated Carousel page added to `apps/kitchen-sink` (routing).
- [ ] Registry surface `registry/components/carousel/` created +
      registered (registry.json, CLI `registry.rs`, `cli.rs` roster,
      emit goldens).
- [ ] Kitchen-sink hand-sync of the copied surface.
- [x] Plan + log docs committed to the repo.

### Iteration 1 — Basic responsive single-slide (not started)

_Spec: see the plan doc. Fill in on completion — knobs added, classes,
modifiers, headless gaps, QA feedback, Figma-sync status._

## Backlog (examples still to build)

Seeded from `ROADMAP.md` "Carousel example backlog (Blossom parity)".
Reorder as priorities shift; each is human-approved before it starts.

**Basic**

- Basic responsive single-slide _(iteration 1 — in progress)_
- Multi-slide-per-view (slidesPerPage, gap, peek)
- Dots / indicators variations (below, overlaid, thumbnails)
- Snapping (centred) — `snapAlign="center"`
- Right-to-left — needs explicit RTL confirmation/tests
- Masonry — grid-based with complex snapping cells
- Sticky Slides — sticky labels/content inside slides

**Advanced**

- Cover Flow (scroll-driven 3D, `--cf-*` playground)
- Autoplay + play/pause
- Crossfade / dissolve (`transition="none"`)
- Multi-step (slide + fade)
- Variable-size slides
- Programmatic control (imperative API, progress bar)
- Slideshow (parallax), Stories (3D + overscroll), Smart Stack,
  Cards, Flipbook, Timeline

## Headless gaps (drive reactively, per example)

Tracked so we know what's outstanding; only built when an example needs
it (decision 4).

- [ ] Looping / infinite (next/previous hard-clamp today; autoplay stops
      at last page)
- [ ] Vertical orientation + `data-orientation` (not emitted at all today)
- [ ] Mouse-drag gesture (only native scroll today)
- [ ] Explicit RTL tests (mirrors implicitly via logical properties;
      no dedicated coverage)

## Open questions (for the human)

- _(none currently — add as they arise)_

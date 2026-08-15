# RFC 0027 — Ramp quality metrics & generation feedback

> **Status:** Draft — proposed, nothing built
> **Author:** simonrevill, with architectural review
> **Date:** 2026-08-15
> **Relates to:** RFC 0002 (Harmoni → Intent → Plugin); RFC 0003 (Dynamic
> foreground wiring) — this extends the same idea from per-swatch contrast to
> per-ramp quality; RFC 0010 (OKLCH colour picker) §gamut, whose
> `linear_in_gamut` change is the regression this RFC's metrics caught.
> **Evidence:** `docs/interface-audit.md` (2026-08-15, `better-colors` +
> addendum); `.github/workflows/ramp-audit.yml`;
> `crates/harmoni-core/examples/ramp-audit.rs`.

---

## 0. Summary

Harmoni generates palettes and **nothing knows whether they are any good.**

The engine is rigorous about the one quality question it does ask — every
`Swatch` carries a `ContrastResult` with an AA/AAA rating, and across all 100
generated swatches there is not a single `Fail`. But that is per-swatch
foreground contrast. Nothing measures the *ramp*: whether it holds its hue,
whether its steps are evenly spaced, whether it is as colourful as the hue
permits. So a ramp can degrade silently, and one did.

A throwaway audit example written in an afternoon caught a chroma regression
that had been sitting in `main` since RFC 0010. That is not a reporting win — it
is a missing engine capability, found by accident.

This RFC proposes promoting those measurements into the engine as a first-class
`RampQuality` type, then consuming it in three places that currently have no
answer to "is this ramp good?":

1. **`cargo test`** — golden metrics per seed, so a generation regression fails
   at the commit that causes it.
2. **The Harmoni plugin UI** — telling a designer, at pick time, what their
   chosen hue can and cannot do in the target gamut.
3. **The generator itself** — an objective function to tune curves against,
   rather than tuning by eye.

It also proposes one metric change that matters more than the rest: measure
chroma against **what the gamut allows**, not against a committed baseline.

---

## 1. The problem: no objective function

Ask "is `warning` a good ramp?" and there is currently no way to answer except
by looking at it. That has three consequences.

**Regressions are invisible.** RFC 0010's third follow-up tightened
`linear_in_gamut` from `±1e-3` to `1e-5` to kill spikes in the picker's Hue
chart. Correct for the chart. But the palette generator shares
`max_in_gamut_chroma`, so it also received less chroma — and nobody noticed,
because nothing measures chroma. The single source of truth that RFC 0010
treats as a virtue is exactly how the change propagated.

The damage, measured against the committed palette:

| ramp | light-end chroma vs committed |
|---|---:|
| brand, danger | ±0% |
| success | −3% light, −1% dark |
| warning | **−21%** light, −4% dark |
| info | **−41%** light, **−15%** dark |

Steps 500–900 are byte-identical; only the steps *lighter* than the seed moved,
which is the signature of a gamut-mapping change (the seed pins step 500).
`info-300` went from a vivid `#00cbd5` to a washed-out `#80cdd8`.

**Good metrics can be read backwards.** The same regeneration *improved* `info`'s
hue span from 22.1° to 6.0°, and the audit's first conclusion was that the engine
had fixed `info`. It had not — a ramp that loses 41% of its chroma trivially
holds hue, because there is less colour left to drift and near-neutral steps
drop out of the measurement entirely. **A grey ramp scores perfectly on every
hue metric.** Any quality system built here has to defend against that.

**Users get no feedback.** A designer picks a brand colour and receives ten
swatches. Some hues are genuinely harder than others — sRGB's gamut is far
tighter in yellow and cyan, so those ramps *will* mute at the light end no
matter how good the engine is. That is physics, not a defect. But the designer
discovers it by eye, months later, if ever.

---

## 2. What the audit measured, and what it proved

Four measurements, from
`crates/harmoni-core/examples/ramp-audit.rs`. Two produced findings nobody had.

**Hue span, measured twice.** The engine's *intended* OKLCH hue span is **0.0° on
all ten ramps** — it holds hue exactly, by construction. Every degree of observed
drift appears only after quantising to sRGB. So the ramp definition was never the
problem; the gamut mapping is. Measuring only intended values reports a flawless
engine; measuring only rendered values blames the wrong component. Both are
needed, and the *gap between them* is the diagnostic.

**Lightness spacing.** Steps must be distinguishable as surfaces. `warning`'s
light end sits at ΔL 0.0 — steps 50/100/200 are effectively one colour.

**Chroma retention.** Added last, after the near-miss above, and immediately the
most valuable column.

**Foreground contrast**, which the engine already computes. Worth stating
plainly: **zero failures across 100 swatches, 72 AAA, 28 AA** — the guarantee is
real, and holds even on the defective ramps.

But its *scope* is the gap. `ForegroundSource` returns `Step900`, `Step50`,
`SoftWhite`, `SoftBlack`, `PureWhite` or `PureBlack` — ramp ends and anchors,
answering *"what text goes on this solid fill"*. It has no answer for *"which
mid-ramp step is readable on some other surface"*, which is the shape of a link
colour, a muted-text colour and a border. Those three roles are consequently
hand-picked in the Intent layer with nothing checking them, and all three have
drifted below threshold (measured: 3.78:1, 4.20:1, 2.24:1). **Extending that API
is the durable fix for a whole class of contrast bug**, versus re-binding three
tokens.

---

## 3. `RampQuality` — the engine-side API

Promote the metrics out of the example and into `harmoni-core::audit`, beside
the existing contrast work. One implementation, four consumers.

Sketch, not a signature:

```rust
pub struct StepQuality {
    pub label: SwatchLabel,
    /// Chroma actually used, as a fraction of what the gamut allows at this
    /// lightness and hue. 1.0 = riding the boundary; 0.5 = leaving half on
    /// the table. See §4 — this is the metric that matters most.
    pub chroma_utilisation: f32,
    /// Perceived-lightness distance from the previous step, absolute.
    pub delta_l: Option<f32>,
    /// Rendered hue after sRGB quantisation, vs the hue the engine intended.
    pub hue_error: f32,
}

pub struct RampQuality {
    pub steps: Vec<StepQuality>,
    pub hue_span_intended: f32,
    pub hue_span_rendered: f32,
    pub min_delta_l: f32,
    pub mean_chroma_utilisation: f32,
    /// Whether every step has an accessible foreground. Already true today;
    /// stated so a future change cannot quietly break it.
    pub foreground_coverage: ForegroundCoverage,
    pub gamut: Gamut,
}

pub fn assess(palette: &Palette, gamut: Gamut) -> RampQuality;
```

Two design notes.

**It takes a `Palette`, not a seed.** Assessment is separate from generation, so
it can be pointed at any palette — including one imported from elsewhere, or the
committed `palette.json`, without regenerating.

**It takes a `Gamut`.** RFC 0010 already introduced the enum for the picker. A
ramp's quality is meaningless without saying which gamut it is being judged
against — the same hue that mutes badly in sRGB may be entirely comfortable in
Display P3, and that difference is exactly what §6 wants to show the user.

---

## 4. Measure chroma against the gamut, not against a baseline

The audit's current chroma metric compares against the **committed palette**.
That works, and it caught the regression, but it is the wrong long-term shape:

- it needs a reference palette to exist,
- the reference is whatever was committed last, so the bar moves,
- and it can only answer "did this change?", never "is this good?".

The engine can do better, because it already knows the answer.
`max_in_gamut_chroma` computes the maximum chroma available at a given lightness
and hue. So the real metric is **chroma utilisation**: what fraction of the
available chroma is this step actually using?

That is absolute, self-contained, needs no baseline, and answers the question
that matters — *is this ramp as colourful as this hue permits?* It would also
have caught the RFC 0010 regression more directly and with a clearer diagnosis:
utilisation dropping while the gamut boundary stayed put means the generator
stopped reaching for available chroma, which points at the search rather than at
the boundary.

It also enables §6, because utilisation is per-step and comparable across hues,
which a raw chroma number is not.

Keep the baseline comparison in the CI report as a *drift* check — it answers a
different and still-useful question ("has the committed palette diverged from the
engine?"). It just should not be the primary quality signal.

---

## 5. Regression tests

With `assess()` in the engine, the chroma collapse becomes a test:

```rust
#[test]
fn light_steps_use_most_of_the_available_chroma() {
    let p = generate_brand_pair(ColorInput::Css("#008e9d".into())).unwrap();
    let q = assess(&p.light, Gamut::Srgb);
    assert!(q.mean_chroma_utilisation > 0.9, "…");
}
```

The point is not the exact threshold — it is that **RFC 0010's change would have
failed CI at the commit that made it**, with a message naming the ramp, instead
of surviving months and being found by an unrelated design audit.

Worth being deliberate about which ramps are covered. Every seed in
`packages/tokens/harmoni-seeds.json` is the obvious set, plus at least one
deliberately hard hue (a yellow near the gamut edge) so the tests exercise the
case where the mapping actually has to make a decision.

Note this cuts against the CI workflow's current "report, never gate" stance,
and deliberately so: **the workflow reports because ramp quality is a design
judgement; the tests gate because a 40% chroma drop is not.** Different
questions, different mechanisms.

---

## 6. Feedback in the picker

The most valuable consumer, and the one furthest from what exists today.

Right now the OKLCH picker (RFC 0010) shows a designer *what a colour is*. It
does not show them **what that colour can do as a ramp**. Since the picker
already paints gamut boundaries — it has `max_in_gamut_chroma`, the dual
sRGB/P3 boundary curves, and the three-chart net — the data is on screen
already; it is simply not interpreted.

Three things worth surfacing, in order of value:

**Chroma headroom per step.** For the chosen hue, how much chroma each generated
step will actually get versus what it wants. This is where a designer learns
that their cyan will mute at the light end *before* they build a design system
on it, rather than after.

**A gamut comparison.** The picker already computes both boundaries. "In sRGB
your light steps reach 60% of requested chroma; in Display P3, 95%" is a
concrete, honest statement about a real trade-off, and it makes the P3 work
already in `harmoni-core` visible to the person deciding.

**Contrast reach.** The engine knows each swatch's accessible foreground. Showing
which steps can carry text — and, once §7 lands, which steps are usable as
*foregrounds* on the surfaces in play — turns a silent guarantee into a design
input.

What this should **not** become is a score out of ten. The goal is to make the
constraints legible, not to rank the designer's colour choice. A hue that mutes
in sRGB is not a bad hue; it is a hue with a known consequence, and the UI's job
is to state it.

---

## 7. Extending the foreground API

Separable from the rest, and independently valuable.

Today: `best_foreground(swatch) -> ramp end or anchor`. Answers "text on this
fill". Proposed addition: given a **ramp**, a **surface** and a **threshold**,
return the step that clears it — the question that link, muted-text and border
colours actually ask.

The Intent layer then consumes a guarantee instead of a hand-picked step, and
the three measured contrast failures in `docs/interface-audit.md` become
structurally impossible rather than individually fixed. This is the same move
RFC 0003 made for foregrounds: stop throwing away an answer the engine is
capable of computing.

---

## 8. What this explicitly does not do

**It does not let metrics decide.** They inform. The fastest route to a perfect
hue-span score is a grey ramp — this document exists partly because that trap
was walked into during the audit, and the generator must not be allowed to
optimise its way there. Chroma utilisation and hue stability pull against each
other by design, and a human resolves that tension.

**It does not gate the CI report.** §5's tests gate specific, objective
regressions. The `ramp-audit` workflow keeps reporting without failing, because
gating ramp quality would block the very commits trying to improve it.

**It does not change any shipped colour.** No regeneration, no re-binding.
Those are downstream decisions this RFC only makes measurable.

---

## 9. Build order

1. **`assess()` + `chroma_utilisation`** in `harmoni-core::audit` (§3, §4).
   Everything else depends on it. TDD as usual.
2. **Regression tests** (§5) — cheapest real protection, and the immediate
   payoff.
3. **Point `ramp-audit` at `assess()`** instead of its own private maths, so the
   example and the engine cannot disagree.
4. **Diagnose the RFC 0010 chroma regression** using the new utilisation metric,
   and fix the gamut mapping. This unblocks regeneration.
5. **Regenerate the palette**, verifying utilisation is back before committing.
6. **Foreground API extension** (§7).
7. **Picker feedback** (§6) — the largest surface, and it wants 1–4 settled
   first so it is displaying trustworthy numbers.

Steps 1–3 are one focused session. Step 4 is the one with real unknowns.

---

## 10. Decision log

- **D1 — Quality lives in the engine, not in CI.** The audit example proved the
  metrics are useful; leaving them there would mean the plugin, the CLI and the
  test suite each reimplementing them, and disagreeing. `harmoni-core::audit`
  already owns the contrast half.
- **D2 — Chroma is measured against the gamut, not a baseline.** Absolute beats
  relative: no reference palette required, the bar cannot drift, and it answers
  "is this good?" rather than only "did this change?" (§4).
- **D3 — Hue is measured twice, intended and rendered.** The gap between them is
  what localises a fault to the ramp definition versus the gamut mapping. One
  number alone misleads in both directions (§2).
- **D4 — Tests gate; the report does not.** A 40% chroma drop is an objective
  regression and should fail CI. "Is this ramp attractive" is a design
  judgement and should not (§5).
- **D5 — The picker states constraints, it does not score colours.** A hue that
  mutes in sRGB is not a bad hue. The UI's job is to make the consequence
  visible before the decision, not to grade it afterwards (§6).
- **D6 — No colour changes in this RFC.** Regeneration and re-binding are
  downstream of the measurement work; bundling them would make an engine change
  and a design change indistinguishable in review (§8).

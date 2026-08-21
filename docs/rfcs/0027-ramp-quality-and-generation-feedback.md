# RFC 0027 — Ramp quality metrics & generation feedback

> **Status:** Steps 1–7 landed (2026-08-20/21) — `assess()` in the engine, regression
> tests gating the shipped seeds, and the `ramp-audit` example measuring through
> the engine, the gamut mapping fixed, and the light lightness curve anchored.
> **Step 5 (regenerate) is done — palette, emitted token layers and Figma
> variables are in lockstep (§12.4).** Step 6's API is landed (§13); step 7 and
> step 7's picker feedback is landed (§14). Only the Intent-layer consumption of
> §7 remains open. See §11 for what building
> it found, including a correction to §1's diagnosis.
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

1. ~~**`assess()` + `chroma_utilisation`** in `harmoni-core::audit` (§3, §4).
   Everything else depends on it. TDD as usual.~~ **Landed.**
2. ~~**Regression tests** (§5) — cheapest real protection, and the immediate
   payoff.~~ **Landed** — `crates/harmoni-core/tests/ramp_regression.rs`.
3. ~~**Point `ramp-audit` at `assess()`** instead of its own private maths, so the
   example and the engine cannot disagree.~~ **Landed**, and the rewired report is
   byte-identical to the private maths it replaced.
4. ~~**Diagnose the RFC 0010 chroma regression** using the new utilisation metric,
   and fix the gamut mapping. This unblocks regeneration.~~ **Landed** — see §11.1
   for the diagnosis and §12 for what it unmasked.
5. ~~**Regenerate the palette**, verifying utilisation is back before committing.~~
   **Landed** — see §12.4.
6. ~~**Foreground API extension** (§7).~~ **API landed** — see §13. Having the
   Intent layer *consume* it is the remaining half.
7. ~~**Picker feedback** (§6) — the largest surface, and it wants 1–4 settled
   first so it is displaying trustworthy numbers.~~ **Landed** — see §14.

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


---

## 11. What building steps 1–3 found (2026-08-20)

Three findings, in descending order of how much they change what happens next.
Two of them correct this document.

### 11.1 §1's diagnosis is wrong: the generator has never been gamut-aware

§1 says "the palette generator shares `max_in_gamut_chroma`", so RFC 0010's
tolerance change propagated into generation. It does not share it. The generator
has **its own copy** — `palette::generator::max_in_gamut_chroma` — which uses the
*clamped* conversion, and whose own doc comment already admitted the predicate
"effectively always passes and it returns the `hi` ceiling".

Measured, it returns the constant `0.4` at every lightness and hue:

| lightness | hue | generator | true sRGB boundary |
|---:|---:|---:|---:|
| 0.97 | 70° | 0.400000 | 0.021674 |
| 0.83 | 70° | 0.400000 | 0.134867 |
| 0.55 | 70° | 0.400000 | 0.119155 |
| 0.15 | 70° | 0.400000 | 0.032632 |

So the `0.4` cancels out of the ratio and every step's chroma reduces to
`base_chroma × 0.95 × chroma_factor` — **independent of what the gamut permits at
that lightness**. There is no gamut mapping in generation at all; there is a
constant, and then hard channel clamping at the very end when the colour is
written to hex.

That reframes step 4. It is not "find what RFC 0010 broke and revert it" — it is
"the chroma search has never worked, and the light end has always been asking for
colour that does not exist". The committed palette still fails to reproduce on
six ramps, so something *did* change; but the fix is a gamut-aware search, not a
tolerance revert.

### 11.2 §5's proposed threshold would not have worked

§5 sketches `assert!(q.mean_chroma_utilisation > 0.9)`. Under §3's definition —
chroma used as a fraction of what the gamut allows — that assertion passes on a
visibly broken ramp, because the measurement routinely exceeds `1.0`:

| ramp (light) | mean, intended chroma ÷ boundary |
|---|---:|
| success | 0.91 |
| info | 0.99 |
| brand | 1.27 |
| danger | 1.70 |
| **warning** | **3.48** |

`warning/200` alone asks for **14.9×** the chroma sRGB has at that lightness. A
single number cannot be both "did the generator ask for something impossible?"
and "is the ramp as colourful as it could be?", so the metric is now **measured
twice**, exactly as hue already is (D3):

- **`chroma_demand`** — the intended chroma over the boundary. Above `1.0` the
  generator is asking for colour that does not exist.
- **`chroma_utilisation`** — the *rendered* chroma over the boundary, measured at
  the rendered colour's own lightness and hue. Never meaningfully above `1.0`.
  This is the quality metric §4 wanted.

The gap between them is chroma asked for and not received. It is also, directly,
where the hue drift comes from: the excess is absorbed by channel clamping, and
clamping moves hue. The correlation is visible per step —
`warning/200` demands 14.9× and drifts **28.4°**; every `success` light step
demands under 1.0× and drifts under **0.5°**.

### 11.3 Two defects the metrics now name, both still open

Neither is gated, because both fail today (D4 gates regressions, not existing
defects):

- **`warning` light has a light-end ΔL of exactly 0.0** — steps 50/100/200 are
  one colour, as §2 predicted. The cause is now visible: their intended lightness
  is clamped to the `0.99` ceiling, so three steps land on the same value.
- **Rendered hue spans of 33.4° (`warning` light) and 31.2° (`brand` dark)**, far
  past the 15° guideline, with intended spans of 0.0° on every ramp. The ramp
  definitions are flawless; the clamping is doing all of it.

### 11.4 What is gated, and what deliberately is not

`crates/harmoni-core/tests/ramp_regression.rs` runs every seed in
`packages/tokens/harmoni-seeds.json`, both themes, plus a deliberately hard yellow
(`#f5c400`, demand 3.22×, light-end ΔL 0.0) that is **not** in the manifest —
so the guards keep exercising the case where the mapping has to make a decision
even once the shipped ramps are healthy.

Gated: accessible-foreground coverage on every step; mean chroma utilisation at or
above 0.60 (the shipped ramps sit at 0.75–1.00); intended hue span at 0.0°, which
is the control that keeps the rendered span attributable. Plus a fourth test
asserting the guard set is non-empty and covers every manifest seed — without it,
a manifest that failed to parse would make all three pass by iterating over
nothing.

Not gated, per D4 and §8: hue span, chroma demand, and light-end ΔL — all three
have real failures today, and gating them would block the commits trying to fix
them.

### 11.5 Decisions added to §10

- **D7 — Chroma is measured twice, demanded and rendered.** One number cannot
  answer both "did the generator ask for the impossible?" and "is this as
  colourful as the hue permits?", and the version that can exceed `1.0` is
  useless as a quality score (§11.2).
- **D8 — Utilisation's denominator is the boundary at the *rendered* colour**,
  not at the intended one. Gamut mapping moves lightness as well as chroma, so
  dividing rendered chroma by the boundary at the intended lightness mixes two
  different colours into one ratio — and reads above `1.0` whenever the mapping
  lands where the gamut is wider.
- **D9 — Hue spans use the smallest enclosing arc, not the numeric range.**
  Subtracting the extremes puts a seam in the measurement: at 0° for the intended
  hues, and at 180° for the renderer-normalised ones, where a tight ramp either
  side of the seam scores as a near-full-circle swing.
- **D10 — Aggregates are `Option`, and a colourless ramp reports `None`.**
  Reporting `0.0` for a grey ramp's hue span is precisely the trap §2 describes;
  `None` says "there was nothing to measure" instead.


---

## 12. Step 4: the fix, and the defect it unmasked (2026-08-21)

### 12.1 The fix

`palette::generator` no longer has its own gamut search. Every non-seed step now
takes its chroma from:

```rust
let requested = base_chroma * CHROMA_HEADROOM * chroma_factor;
let ceiling = max_in_gamut_chroma(l, hue, Gamut::Srgb) * GAMUT_SAFETY_MARGIN;
let chroma = requested.min(ceiling);
```

The cap is applied **in OkLCH, at constant lightness and hue**. That is the whole
fix. The alternative — request whatever the chroma scale says and let per-channel
clamping absorb the excess at hex time — reduces chroma *and* moves hue, because
the channels do not clip evenly. Giving up the same unrenderable chroma
deliberately, in OkLCH, holds the hue exactly.

Rendered hue span, before → after:

| ramp | before | after |
|---|---:|---:|
| warning light | 33.4° | **1.8°** |
| brand dark | 31.2° | **5.4°** |
| warning dark | 22.8° | **1.9°** |
| brand light | 15.6° | **1.0°** |
| info light | 6.0° | **2.3°** |

Every ramp is now under 6°, against a `better-colors` bar of 15°. The gate §5
could not write — a rendered-hue-span assertion — is now in
`ramp_regression.rs` at 10°.

The request formula deliberately keeps the original `0.95` headroom, so steps
that were already inside the gamut are **byte-identical** and "what changed" is
exactly "what was broken". `primitiv-emit`'s three `theme --brand` goldens moved
accordingly, regenerated via `cargo run -p primitiv-emit --example
regen-brand-goldens` rather than by hand.

### 12.2 What it unmasked: the light model shifts where it should anchor

Holding chroma inside the gamut made a **second, independent defect** visible.
The light palette's lightness model was a *shift*:

```rust
let l = (base_lightness + reference_lightness - 0.55).clamp(0.01, 0.99);
```

So a seed lighter than about `0.60` pushed its top steps past the `0.99` ceiling,
where they collided:

| ramp | seed L | intended lightness | steps at ceiling | min ΔL |
|---|---:|---|---:|---:|
| brand | 0.56 | 0.98 0.92 0.84 0.77 … | 0 | 0.060 |
| info | 0.59 | 0.99 0.95 0.87 0.80 … | 1 | 0.039 |
| warning | 0.72 | **0.99 0.99 0.99** 0.93 … | 3 | **0.000** |
| hard yellow | 0.84 | **0.99 0.99 0.99 0.99** 0.96 … | 4 | **0.000** |

This was not new — `warning`'s ΔL was already exactly 0.0 before the chroma fix
(§11.3). What was new is the *consequence*. Previously those steps had different
requested chromas, and per-channel clipping happened to render them as
distinguishable yellows. Once chroma was honestly capped at a lightness where
sRGB has almost none, they came out as three identical near-whites
(`#fffbf7` ×3), and the hard yellow as four identical `#fffcf3`.

**Fixed by anchoring the light curve**, the model the dark palette has always
used: pin the ramp's two ends to the curve's own ends, pin 500 to the brand, and
shape each half by the curve. Both sides now share one `anchored_lightness`
helper, which reads the same way in both halves — start at the half's anchor and
travel toward the brand by however far along the curve the step sits. A curve
whose half has no span (a flat curve, which `generate_with_lightness` accepts)
collapses onto its anchor, which is both what a flat curve means and what keeps
the division safe.

| ramp | before | after |
|---|---|---|
| warning | `0.99 0.99 0.99 0.93 …` → 3 identical whites | `0.97 0.93 0.89 0.85 …` → `#fef3e9 #fee5cc #fdd1a5 #fdbf7f` |
| hard yellow | `0.99 0.99 0.99 0.99 …` → 4 identical | `0.97 0.95 0.93 0.90 …` → a real ramp |
| brand (L 0.56) | `0.98 0.92 0.84 …` | `0.97 0.91 0.83 …` — essentially unchanged |

It fixes the pale-seed collapse, barely moves mid-lightness seeds, and gives a
pale seed a genuinely dark 900 for the first time (the hard yellow's 900 goes
from L 0.44 to 0.15). Minimum ΔL is now 0.018 across every ramp, which unlocked
the second gate §5 could not write.

### 12.3 What the two fixes cost against the committed palette

Mean rendered chroma across the steps *lighter* than the seed — the ones a
gamut-mapping change moves, since 500 is pinned — as a percentage change from
`packages/tokens/src/palette.json`:

| ramp (light) | committed vs **original** engine | + chroma fix | + anchored lightness |
|---|---:|---:|---:|
| brand | +0% | −10% | **−8%** |
| danger | +0% | −18% | **−8%** |
| warning | −21% | −70% | **−19%** |
| success | −3% | −3% | **−2%** |
| info | −41% | −43% | **−42%** |

Two things this table settles, both of which correct an earlier reading:

**`info`'s −42% is pre-existing drift, not a cost of these fixes.** The committed
`info` ramp was already 41% more chromatic than the engine produced *before any
of this work* — its vivid light steps (`#55dee5`, `#00cbd5`) are more colourful
than the chroma scale even asks for, so the gamut is not the binding constraint
there. That ramp is not reproducible from its seed and has not been for some
time; regenerating will change it, and that is a pre-existing divergence
surfacing rather than a regression.

**The genuine, incremental price of holding hue is about 8%**, on `brand` and
`danger`. Everywhere else the two fixes together land level with or better than
the original engine — `warning` improves from −21% to −19% while going from three
identical near-whites to a real ramp, and its rendered hue span falls from 33.4°
to 1.3°.

### 12.4 Step 5: regenerated, and synced to Figma

**83 of 100 steps changed.** The 17 that did not are step 500 in every ramp
(pinned to the seed by construction) plus seven dark low steps that were already
in gamut. Four surfaces moved together:

- `packages/tokens/src/palette.json` — rewritten by a new
  `regen-palette` example. Until it existed the palette was only ever committed
  as *output*: the seeds were entered interactively in the Harmoni plugin, so an
  engine fix could not reach the shipped tokens without hand-editing a hundred
  hexes.
- The emitted token layers for the kitchen-sink, the workbench **and the docs
  site**. The last had been added without a drift guard and went stale the moment
  the palette moved; `token-drift.yml` now covers it.
- The `Primitives / Palette` Figma variables, both modes, via the Desktop
  Bridge — **83 changed, 17 unchanged**, the same split the regenerator reported,
  which is the cross-check that the two sides agree.

Deliberately untouched: `brand-alpha` (the *seed* at the alpha curve's
opacities, so it is anchored to a colour regeneration does not move), and the
`neutral` families, which come from the `neutral` module rather than
`generate_brand_pair`.

Nothing downstream needed a second pass. In Figma, **203 of 206** Intent values
are aliases into the palette, so they follow automatically; the only three raw
values are `scrim` (black) and `surface/floating` in Dark, neither ramp-derived.
The file carries **no paint styles at all**, so there is nowhere for a raw ramp
colour to hide outside the variable layer. The `foreground/<ramp>/<step>` family
that `intentSpec.ts` can alias does not exist in the file — the Intent foreground
tokens resolve to `color/white`, `color/absolute-white` and `color/neutral/*`
instead — so there was nothing there to strand.

**One trap worth keeping.** The regenerator edits `palette.json` as *text*. Doing
it structurally needs serde_json's `preserve_order` to hold key order, and Cargo
unifies features across the whole workspace build — switching it on silently
flipped `primitiv-emit`'s token ordering from sorted to insertion order and broke
five of its goldens. The text path needs no feature, and was verified to produce a
byte-identical file.


---

## 13. Step 6: `readable_step` (2026-08-21)

`harmoni_core::api::readable_step(ramp, surface, threshold) -> Option<ReadableStep>`
answers the question §7 identified and the engine had no API for: **which step of
this ramp is readable on *that* surface**.

`get_best_foreground` answers a different one — "what text goes on this solid
fill" — and structurally cannot answer this, because `ForegroundSource` only ever
returns ramp ends and the white/black anchors. Link, muted-text and border
colours are all mid-ramp-step-on-a-different-surface, which is why all three were
hand-picked in the semantic tier with nothing checking them, and why all three
drifted below threshold silently.

Three decisions, each driven by a failing test:

- **It returns the *quietest* step that clears, not the first one found.** A role
  wants the least contrast that still passes: a border pushed to body-text weight
  clears any floor and looks like a mistake. Ramp order matches increasing
  contrast only while the ramp and the surface share a theme, so walking the ramp
  gives the right answer by luck rather than by rule — a light ramp on a dark
  surface returns the *loudest* step that way.
- **The threshold is a parameter, and it genuinely changes the answer.** Text
  needs 4.5:1; a border is non-text and WCAG 1.4.11 asks 3:1. This only shows on a
  ramp fine enough to have a step between the two bars — which the neutral ramp is
  (`border/default` sits at `neutral.400`, 3.05:1) and a coarse fixture is not.
- **`None` when nothing clears.** A role that cannot be satisfied says so rather
  than handing back the closest near-miss, which is the guarantee the hand-picked
  tier never had.

**The calibration check that matters:** given the dark brand ramp and the dark
page surface at 4.5:1, the engine returns **`600`** — the exact step the audit had
to hand-pick after finding `dark.action.link.foreground.default` failing at
3.78:1. The engine derives independently what a human found by measuring.

### What remains of §7

The API exists; the semantic tier does not yet consume it. `intent.json` still
hand-picks these steps, and the guarantee is still enforced downstream by
`packages/tokens/src/dark-mode-content.test.ts`, which carries its own
hand-rolled contrast maths — a second implementation that can disagree with the
engine's. Closing that is an architectural question this RFC does not decide:
whether the semantic tier's contrast-bearing roles become *generated* from the
engine rather than authored. Worth noting the 114 token tests pass unchanged
against the regenerated palette, so nothing is failing today.


---

## 14. Step 7: picker feedback (2026-08-21)

`RampFeedback` sits under the brand picker on the Color engine page and states
the three things §6 asked for, in its order: **chroma headroom per step**, the
**sRGB / Display-P3 trade-off**, and **contrast reach**. It states constraints
and does not score the colour (D5).

### 14.1 §6's premise turned out to be wrong, and that shaped the work

§6 says the data "is on screen already; it is simply not interpreted", meaning
the gamut boundary the picker paints. That was true when it was written. It is
not true now, and the reason is step 4: the generator used to request chroma with
no reference to the gamut and let per-channel clipping absorb the excess, so the
over-ask was visible in the output as `chroma_demand`. Capping in OkLCH moved
that decision *inside* generation — demand can no longer exceed the safety
margin, and the request is discarded once capped.

The consequence is that a quiet step now has two causes that look identical from
outside: the chroma scale tapers the ramp's ends deliberately, and a hue the
gamut cannot hold gets cut back. Only the first is by design, and only the
request/grant pair separates them. So the picker could not derive this from the
boundary; the engine had to report it:

```rust
pub fn chroma_headroom(base_500, light_padding, dark_padding, gamut) -> Vec<ChromaHeadroom>
// ChromaHeadroom { label, requested, granted }
```

Generation and `chroma_headroom` share one `plan_light_ramp` derivation, so the
two cannot disagree about what a ramp asks for. `gamut` is a **what-if** —
generation always targets sRGB — and it is what makes the P3 comparison possible
rather than hypothetical.

### 14.2 What the picker shows

- **Chroma headroom.** Only the steps the gamut actually held back, each with the
  fraction of its request it got. A ramp sRGB can hold gets one sentence saying
  so rather than ten bars of noise.
- **Gamut.** "In sRGB this ramp reaches 76% of the chroma it asks for; in
  Display-P3, 96%." When the hue is not constrained by sRGB it says that too, so
  a designer is not left to infer that wide gamut would help when it would not.
- **Contrast reach.** The `ForegroundCoverage` counts from `assess_ramp`.

A failed engine call renders **nothing**. A measurement that could not be taken
must not appear as a measured zero.

### 14.3 Two things found by rendering it

Neither was caught by the tests, which is the argument for rendering:

1. **The contrast sentence contradicted itself.** It opened "Every step carries
   readable text" and then appended ", 1 with no accessible foreground". True of
   nothing the engine ships today, which is exactly why it survived review — the
   failing branch is the one nobody looks at.
2. **The picker's own test harness had been half-dead.** Six of the fourteen
   `OklchPicker` test files could not even resolve `harmoni-wasm`: `vi.mock`
   needs Vite to resolve the specifier first, and the sandbox's install-time stub
   carried a manifest with no entry point. The stub now derives its exports from
   the Rust source, so a new `#[wasm_bindgen]` entry point cannot go missing from
   it, and it regenerates unless the real `.wasm` is present.

### 14.4 One gap worth knowing

**CI does not run the workbench picker suite.** `ci.yml` runs `qa:units` for
`react`, `icons` and `tokens` only; the workbench is type-checked and built but
its 143 tests and 100% threshold are enforced by discipline alone. That predates
this work and is not fixed here, but the picker is now a big enough surface that
it is worth a line in the workflow.

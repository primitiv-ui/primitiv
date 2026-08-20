//! Ramp audit — runs the engine and reports the quality of what it produces.
//!
//! Why this exists: the Rust toolchain does not run in the agent sandbox, so
//! an engine-input change cannot be validated where the design work happens.
//! The colour findings in `docs/interface-audit.md` (2026-08-15,
//! `better-colors`) were measured against the *committed* palette, which is
//! solid as a diagnosis but says nothing about whether a proposed fix works.
//! This example closes that gap: CI runs it, uploads the result as an
//! artefact, and the analysis happens against real engine output.
//!
//! It answers three questions, in order of how much they matter:
//!
//!   1. **Does the committed palette still match the engine?** Every ramp is
//!      regenerated from its seed and compared step-by-step against
//!      `packages/tokens/src/palette.json`. A mismatch means the committed
//!      tokens have drifted from what the engine produces — either the seed
//!      recorded in the manifest is wrong, or the palette was hand-edited, or
//!      the engine changed. All three are worth knowing and none is currently
//!      detectable.
//!
//!   2. **Is each ramp well formed?** Hue span, per-step lightness delta, and
//!      where chroma peaks — the three measurements the `better-colors`
//!      principles actually turn on.
//!
//!   3. **Did a change help?** Run it before and after an engine edit and
//!      diff the two artefacts.
//!
//! Run locally:  cargo run -p harmoni-core --example ramp-audit
//! Outputs:      target/ramp-audit/ramp-audit.json  (machine-readable)
//!               target/ramp-audit/ramp-audit.md    (job summary)
//!
//! Exit code is 0 even when ramps fail their thresholds — this is a *report*,
//! not a gate. Gating on ramp quality would block the very commits that are
//! trying to fix it. Pass `--strict` to exit non-zero on reproduction failure
//! (not on quality thresholds), which is the one condition that always
//! indicates something is genuinely out of sync.

use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

use harmoni_core::api::{assess_ramp, generate_brand_pair, Gamut};
use harmoni_core::{ColorInput, Palette};

/// Steps below this chroma carry no meaningful hue. The engine applies its own
/// floor when measuring hue spans; this copy is only used to decide whether a
/// *committed* value is chromatic enough to compare chroma against.
const CHROMATIC_FLOOR: f32 = 0.02;

/// The `better-colors` guidance treats anything within 15 degrees as the same
/// colour, so a ramp spanning more than that is no longer one hue end to end.
const HUE_SPAN_LIMIT: f32 = 15.0;

/// Steps at the light end exist to be distinguishable surfaces. Below roughly
/// this much perceived-lightness separation they stop being usable as two.
const MIN_LIGHT_END_DELTA_L: f32 = 4.0;

/// How many steps from the light end to hold to the tighter spacing rule.
const LIGHT_END_STEPS: usize = 3;

/// The step the seed pins. Steps at or past it are expected to be stable across
/// engine changes; the interesting movement is below it.
const SEED_STEP: u16 = 500;

/// A mean chroma drop past this much across the light end is a collapse, not a
/// refinement — the ramp is being greyed rather than corrected.
const CHROMA_COLLAPSE_PCT: f32 = -10.0;

struct Seed {
    ramp: String,
    seed: String,
}

/// One step, measured twice.
///
/// `l`/`c`/`h` are what the engine *intends* — the OKLCH it computed. `rendered_*`
/// are what a browser actually paints: the intended colour quantised to an sRGB
/// hex and read back. The two diverge wherever the requested chroma falls
/// outside the sRGB gamut, which is most of the yellow and green regions.
///
/// The first CI run made the distinction unavoidable. Measuring only the
/// intended values reported a hue span of **0.0° for every ramp** — the engine
/// holds hue constant by construction, so of course it does — while the same
/// ramps measured from their committed hex spanned up to 38.7°. The intended
/// number says the engine is behaving; the rendered number says what a user
/// sees. Only the second one can be wrong, so quality metrics use `rendered_*`.
struct StepMetric {
    label: String,
    hex: String,
    l: f32,
    c: f32,
    h: f32,
    rendered_l: f32,
    rendered_c: f32,
    rendered_h: f32,
    /// The engine's own accessible-foreground recommendation for this swatch,
    /// with the tier it came from and the contrast it guarantees. Surfaced
    /// because it changes what several audit findings mean: the engine is not
    /// silent on contrast, it already answers "what text goes on this fill".
    fg_hex: String,
    fg_source: String,
    fg_ratio: f32,
    fg_rating: String,
    /// Absolute perceived-lightness distance from the previous step. Absolute
    /// because dark ramps run the other way — the first run flagged every dark
    /// ramp with a negative delta, which was the metric's bug, not the ramp's.
    delta_l: Option<f32>,
    committed_hex: Option<String>,
    /// Rendered chroma of the *committed* value, so the report can say whether
    /// regenerating would make a ramp more or less colourful. Added after a
    /// regeneration was nearly committed on the strength of an improved hue
    /// span that turned out to be chroma collapse in disguise — a greyer ramp
    /// trivially holds hue, because there is less colour left to drift.
    committed_c: Option<f32>,
    /// What the step got, as a fraction of the chroma the gamut allows.
    chroma_utilisation: Option<f32>,
    /// What the generator asked for, on the same scale. Above 1.0 it asked for
    /// chroma that does not exist, and the excess is what bends the hue.
    chroma_demand: Option<f32>,
}

/// How closely a regenerated step matches the committed one.
#[derive(PartialEq, Clone, Copy)]
enum MatchKind {
    /// Byte-identical.
    Exact,
    /// Every channel within one unit — the engine and the committed value agree,
    /// and the difference is quantisation. Not drift, and not worth reporting as
    /// a failure.
    Rounding,
    /// A real difference: the committed palette was not produced by this engine.
    Drift,
}

struct RampReport {
    ramp: String,
    seed: String,
    theme: String,
    steps: Vec<StepMetric>,
    /// Measured on the rendered colours, so it reflects gamut clamping.
    hue_span: Option<f32>,
    /// The gap between intended and rendered hue span. A large number here is
    /// the signature of gamut clamping bending a ramp the engine believes is
    /// straight, and points the fix at the OKLCH→sRGB mapping rather than at
    /// the ramp definition.
    hue_span_intended: Option<f32>,
    /// Mean chroma the ramp actually got, as a fraction of what the gamut
    /// allows — the answer to "is this ramp as colourful as this hue permits?".
    mean_chroma_utilisation: Option<f32>,
    /// Mean chroma the generator asked for, on the same scale.
    mean_chroma_demand: Option<f32>,
    min_light_end_delta_l: Option<f32>,
    chroma_peak_label: Option<String>,
    /// Mean chroma change, engine vs committed, over the steps *lighter* than
    /// the seed. Those are the steps a gamut-mapping change moves, because the
    /// seed itself is pinned and the dark end has chroma headroom to spare.
    ///
    /// This exists because "regenerate the palette" looked free on the hue
    /// numbers and was not: the engine now produces 17–47% less chroma below
    /// step 500 on warning and info. Without this column the report recommends
    /// its own regression.
    light_end_chroma_delta_pct: Option<f32>,
    reproduces: Option<bool>,
    rounding_only: usize,
    mismatches: Vec<String>,
}

fn main() {
    let strict = std::env::args().any(|a| a == "--strict");
    let root = repo_root();

    let seeds = match read_seeds(&root.join("packages/tokens/harmoni-seeds.json")) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("ramp-audit: could not read the seed manifest: {e}");
            std::process::exit(2);
        }
    };

    // The committed palette is optional: without it the reproduction check is
    // skipped but every quality measurement still runs. That keeps the example
    // useful when pointed at an engine change in isolation.
    let committed = read_committed_palette(&root.join("packages/tokens/src/palette.json"));
    if committed.is_none() {
        eprintln!("ramp-audit: palette.json not readable — skipping the reproduction check.");
    }

    let mut reports: Vec<RampReport> = Vec::new();

    for seed in &seeds {
        let input = ColorInput::Css(seed.seed.clone());
        let pair = match generate_brand_pair(input) {
            Ok(p) => p,
            Err(e) => {
                eprintln!("ramp-audit: {} failed to generate: {e:?}", seed.ramp);
                continue;
            }
        };

        for (theme, palette) in [("light", &pair.light), ("dark", &pair.dark)] {
            reports.push(analyse(seed, theme, palette, committed.as_ref()));
        }
    }

    let out_dir = root.join("target/ramp-audit");
    if let Err(e) = fs::create_dir_all(&out_dir) {
        eprintln!("ramp-audit: could not create {}: {e}", out_dir.display());
        std::process::exit(2);
    }

    let json = render_json(&reports);
    let md = render_markdown(&reports);

    write_or_exit(&out_dir.join("ramp-audit.json"), &json);
    write_or_exit(&out_dir.join("ramp-audit.md"), &md);

    println!("{md}");
    println!("\nWrote {}", out_dir.join("ramp-audit.json").display());

    let repro_failed = reports.iter().any(|r| r.reproduces == Some(false));
    if strict && repro_failed {
        eprintln!(
            "\nramp-audit: --strict and at least one ramp did not reproduce its committed values."
        );
        std::process::exit(1);
    }
}

/// Walk up from the crate directory to the workspace root. `CARGO_MANIFEST_DIR`
/// points at `crates/harmoni-core`, so the repo root is two levels above.
fn repo_root() -> PathBuf {
    let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    manifest
        .parent()
        .and_then(|p| p.parent())
        .map(PathBuf::from)
        .unwrap_or(manifest)
}

fn write_or_exit(path: &Path, contents: &str) {
    if let Err(e) = fs::write(path, contents) {
        eprintln!("ramp-audit: could not write {}: {e}", path.display());
        std::process::exit(2);
    }
}

fn read_seeds(path: &Path) -> Result<Vec<Seed>, String> {
    let raw = fs::read_to_string(path).map_err(|e| format!("{}: {e}", path.display()))?;
    let doc: serde_json::Value =
        serde_json::from_str(&raw).map_err(|e| format!("{}: {e}", path.display()))?;

    let list = doc
        .get("seeds")
        .and_then(|v| v.as_array())
        .ok_or_else(|| "no `seeds` array in the manifest".to_string())?;

    let mut out = Vec::new();
    for entry in list {
        let ramp = entry.get("ramp").and_then(|v| v.as_str());
        let seed = entry.get("seed").and_then(|v| v.as_str());
        match (ramp, seed) {
            (Some(r), Some(s)) => out.push(Seed {
                ramp: r.to_string(),
                seed: s.to_string(),
            }),
            _ => return Err(format!("malformed seed entry: {entry}")),
        }
    }
    Ok(out)
}

/// Flatten `palette.json` into `theme/ramp/step -> hex`, resolving the DTCG
/// `$value` wrapper. Returns `None` if the file cannot be read or parsed, so a
/// missing palette downgrades to "skip the check" rather than aborting.
fn read_committed_palette(path: &Path) -> Option<BTreeMap<String, String>> {
    let raw = fs::read_to_string(path).ok()?;
    let doc: serde_json::Value = serde_json::from_str(&raw).ok()?;

    let mut map = BTreeMap::new();
    for theme in ["light", "dark"] {
        let colors = doc.get(theme).and_then(|t| t.get("color"));
        let Some(colors) = colors.and_then(|c| c.as_object()) else {
            continue;
        };
        for (ramp, steps) in colors {
            let Some(steps) = steps.as_object() else {
                continue;
            };
            for (step, node) in steps {
                if let Some(hex) = node.get("$value").and_then(|v| v.as_str()) {
                    map.insert(format!("{theme}/{ramp}/{step}"), hex.to_lowercase());
                }
            }
        }
    }
    Some(map)
}

fn analyse(
    seed: &Seed,
    theme: &str,
    palette: &Palette,
    committed: Option<&BTreeMap<String, String>>,
) -> RampReport {
    // Every metric below comes from the engine's own assessment rather than a
    // private copy of the same maths, so the report and the tests can never
    // disagree about what a ramp measures (RFC 0027 D1, build order step 3).
    let quality = assess_ramp(palette, Gamut::Srgb);
    let mut steps: Vec<StepMetric> = Vec::new();

    for (swatch, measured) in palette.swatches.iter().zip(&quality.steps) {
        let label = swatch.label.to_string();

        let committed_hex = committed
            .and_then(|m| m.get(&format!("{theme}/{}/{label}", seed.ramp)))
            .cloned();

        steps.push(StepMetric {
            label,
            hex: swatch.hex.to_lowercase(),
            l: swatch.l,
            c: swatch.c,
            h: swatch.h,
            rendered_l: measured.rendered_l,
            rendered_c: measured.rendered_c,
            rendered_h: measured.rendered_h,
            // Scaled to lightness percentage points for display; the engine
            // reports it in its own 0..1 units.
            delta_l: measured.delta_l.map(|d| d * 100.0),
            chroma_utilisation: measured.chroma_utilisation,
            chroma_demand: measured.chroma_demand,
            committed_c: committed_hex.as_deref().and_then(committed_oklch).map(|t| t.1),
            committed_hex,
            fg_hex: swatch.best_foreground.hex.to_lowercase(),
            fg_source: format!("{:?}", swatch.foreground_source),
            fg_ratio: swatch.contrast_result.ratio,
            fg_rating: swatch.contrast_result.rating.clone(),
        });
    }

    // Tightest lightness step among the first few, where surfaces live. The
    // ramp-wide minimum is on the assessment as `min_delta_l`; this report wants
    // the light end specifically, so it narrows the engine's per-step numbers
    // rather than recomputing them.
    let min_light_end_delta_l = steps
        .iter()
        .take(LIGHT_END_STEPS + 1)
        .filter_map(|s| s.delta_l)
        .fold(None::<f32>, |acc, d| Some(acc.map_or(d, |a| a.min(d))));

    let chroma_peak_label = steps
        .iter()
        .fold(None::<&StepMetric>, |acc, s| match acc {
            Some(best) if best.c >= s.c => Some(best),
            _ => Some(s),
        })
        .map(|s| s.label.clone());

    // Reproduction: only meaningful for steps we actually have a committed
    // value for, so a ramp absent from palette.json reports None rather than
    // a misleading pass.
    //
    // Quantisation noise is separated from real drift. The first run reported
    // brand and danger as failures over a single unit in one channel
    // (#1452b5 vs #1453b5), which is the hex round-trip, not a disagreement —
    // reporting that alongside genuine 30-unit differences buried the signal.
    let mut mismatches = Vec::new();
    let mut compared = 0usize;
    let mut rounding_only = 0usize;
    for s in &steps {
        if let Some(expected) = &s.committed_hex {
            compared += 1;
            match classify(&s.hex, expected) {
                MatchKind::Exact => {}
                MatchKind::Rounding => rounding_only += 1,
                MatchKind::Drift => mismatches.push(format!(
                    "{}: engine {} vs committed {}",
                    s.label, s.hex, expected
                )),
            }
        }
    }
    let reproduces = if compared == 0 {
        None
    } else {
        Some(mismatches.is_empty())
    };

    // Chroma change over the steps lighter than the seed. `SEED_STEP` is where
    // the ramp is pinned, so anything at or past it is expected to be stable —
    // including it would dilute the signal with a run of guaranteed zeros.
    let mut ratios: Vec<f32> = Vec::new();
    for s in &steps {
        if s.label.parse::<u16>().map(|n| n >= SEED_STEP).unwrap_or(true) {
            continue;
        }
        if let Some(cc) = s.committed_c {
            if cc > CHROMATIC_FLOOR {
                ratios.push((s.rendered_c - cc) / cc * 100.0);
            }
        }
    }
    let light_end_chroma_delta_pct = if ratios.is_empty() {
        None
    } else {
        Some(ratios.iter().sum::<f32>() / ratios.len() as f32)
    };

    RampReport {
        ramp: seed.ramp.clone(),
        seed: seed.seed.clone(),
        theme: theme.to_string(),
        steps,
        hue_span: quality.hue_span_rendered,
        hue_span_intended: quality.hue_span_intended,
        mean_chroma_utilisation: quality.mean_chroma_utilisation,
        mean_chroma_demand: quality.mean_chroma_demand,
        min_light_end_delta_l,
        chroma_peak_label,
        light_end_chroma_delta_pct,
        reproduces,
        rounding_only,
        mismatches,
    }
}

/// Parse a *committed* hex back to OKLCH so its chroma can be compared against
/// the engine's. Only external values go through here — everything the engine
/// produces is measured by `assess_ramp` instead.
fn committed_oklch(hex: &str) -> Option<(f32, f32, f32)> {
    let oklch = ColorInput::Css(hex.to_string()).to_oklch().ok()?;
    let mut h = oklch.hue.into_degrees();
    if h < 0.0 {
        h += 360.0;
    }
    Some((oklch.l, oklch.chroma, h))
}

/// Byte-identical, within one unit per channel, or genuinely different.
fn classify(engine: &str, committed: &str) -> MatchKind {
    if engine == committed {
        return MatchKind::Exact;
    }
    match (parse_channels(engine), parse_channels(committed)) {
        (Some(a), Some(b)) => {
            if a.iter()
                .zip(b.iter())
                .all(|(x, y)| (i16::from(*x) - i16::from(*y)).abs() <= 1)
            {
                MatchKind::Rounding
            } else {
                MatchKind::Drift
            }
        }
        _ => MatchKind::Drift,
    }
}

fn parse_channels(hex: &str) -> Option<[u8; 3]> {
    let h = hex.trim_start_matches('#');
    if h.len() < 6 {
        return None;
    }
    let r = u8::from_str_radix(&h[0..2], 16).ok()?;
    let g = u8::from_str_radix(&h[2..4], 16).ok()?;
    let b = u8::from_str_radix(&h[4..6], 16).ok()?;
    Some([r, g, b])
}

fn json_escape(s: &str) -> String {
    s.replace('\\', "\\\\").replace('"', "\\\"")
}

fn render_json(reports: &[RampReport]) -> String {
    let mut out = String::from("{\n  \"ramps\": [\n");
    for (i, r) in reports.iter().enumerate() {
        out.push_str("    {\n");
        out.push_str(&format!("      \"ramp\": \"{}\",\n", json_escape(&r.ramp)));
        out.push_str(&format!("      \"theme\": \"{}\",\n", json_escape(&r.theme)));
        out.push_str(&format!("      \"seed\": \"{}\",\n", json_escape(&r.seed)));
        out.push_str(&format!(
            "      \"hueSpan\": {},\n",
            r.hue_span.map_or("null".into(), |v| format!("{v:.2}"))
        ));
        out.push_str(&format!(
            "      \"hueSpanIntended\": {},\n",
            r.hue_span_intended
                .map_or("null".into(), |v| format!("{v:.2}"))
        ));
        out.push_str(&format!("      \"roundingOnly\": {},\n", r.rounding_only));
        out.push_str(&format!(
            "      \"lightEndChromaDeltaPct\": {},\n",
            r.light_end_chroma_delta_pct
                .map_or("null".into(), |v| format!("{v:.2}"))
        ));
        out.push_str(&format!(
            "      \"minLightEndDeltaL\": {},\n",
            r.min_light_end_delta_l
                .map_or("null".into(), |v| format!("{v:.2}"))
        ));
        out.push_str(&format!(
            "      \"chromaPeakStep\": {},\n",
            r.chroma_peak_label
                .as_ref()
                .map_or("null".into(), |v| format!("\"{}\"", json_escape(v)))
        ));
        out.push_str(&format!(
            "      \"reproduces\": {},\n",
            r.reproduces.map_or("null".into(), |v| v.to_string())
        ));
        out.push_str("      \"mismatches\": [");
        out.push_str(
            &r.mismatches
                .iter()
                .map(|m| format!("\"{}\"", json_escape(m)))
                .collect::<Vec<_>>()
                .join(", "),
        );
        out.push_str("],\n      \"steps\": [\n");
        for (j, s) in r.steps.iter().enumerate() {
            out.push_str(&format!(
                "        {{ \"step\": \"{}\", \"hex\": \"{}\", \"intended\": {{ \"l\": {:.4}, \"c\": {:.4}, \"h\": {:.2} }}, \"rendered\": {{ \"l\": {:.4}, \"c\": {:.4}, \"h\": {:.2} }}, \"deltaL\": {}, \"foreground\": {{ \"hex\": \"{}\", \"source\": \"{}\", \"ratio\": {:.2}, \"rating\": \"{}\" }} }}{}\n",
                json_escape(&s.label),
                json_escape(&s.hex),
                s.l,
                s.c,
                s.h,
                s.rendered_l,
                s.rendered_c,
                s.rendered_h,
                s.delta_l.map_or("null".into(), |v| format!("{v:.2}")),
                json_escape(&s.fg_hex),
                json_escape(&s.fg_source),
                s.fg_ratio,
                json_escape(&s.fg_rating),
                if j + 1 < r.steps.len() { "," } else { "" }
            ));
        }
        out.push_str("      ]\n    }");
        out.push_str(if i + 1 < reports.len() { ",\n" } else { "\n" });
    }
    out.push_str("  ]\n}\n");
    out
}

fn render_markdown(reports: &[RampReport]) -> String {
    let mut out = String::from("# Harmoni ramp audit\n\n");

    let repro_failures: Vec<&RampReport> =
        reports.iter().filter(|r| r.reproduces == Some(false)).collect();

    if repro_failures.is_empty() {
        out.push_str(
            "**Reproduction: all ramps match the committed palette.** The seeds in \
             `packages/tokens/harmoni-seeds.json` regenerate `palette.json` exactly, so the \
             committed tokens are engine output and the manifest is correct.\n\n",
        );
    } else {
        out.push_str(&format!(
            "**Reproduction: {} ramp(s) did NOT match the committed palette.** Either the seed \
             is wrong, the palette was hand-edited, or the engine changed. Details below.\n\n",
            repro_failures.len()
        ));
    }

    out.push_str("## Summary\n\n");
    out.push_str(
        "| ramp | theme | reproduces | hue span (rendered) | hue span (intended) | light-end min ΔL | light-end chroma vs committed | chroma peak |\n",
    );
    out.push_str("| --- | --- | --- | ---: | ---: | ---: | ---: | --- |\n");
    for r in reports {
        let repro = match (r.reproduces, r.rounding_only) {
            (Some(true), 0) => "yes".to_string(),
            (Some(true), n) => format!("yes ({n} rounding)"),
            (Some(false), _) => "**NO**".to_string(),
            (None, _) => "n/a".to_string(),
        };
        let span = r.hue_span.map_or("—".to_string(), |v| {
            let flag = if v > HUE_SPAN_LIMIT { " ⚠" } else { "" };
            format!("{v:.1}°{flag}")
        });
        let span_i = r
            .hue_span_intended
            .map_or("—".to_string(), |v| format!("{v:.1}°"));
        let dl = r.min_light_end_delta_l.map_or("—".to_string(), |v| {
            let flag = if v < MIN_LIGHT_END_DELTA_L { " ⚠" } else { "" };
            format!("{v:.1}{flag}")
        });
        let chroma = r
            .light_end_chroma_delta_pct
            .map_or("—".to_string(), |v| {
                let flag = if v < CHROMA_COLLAPSE_PCT { " ⚠" } else { "" };
                format!("{v:+.0}%{flag}")
            });
        out.push_str(&format!(
            "| {} | {} | {} | {} | {} | {} | {} | {} |\n",
            r.ramp,
            r.theme,
            repro,
            span,
            span_i,
            dl,
            chroma,
            r.chroma_peak_label.as_deref().unwrap_or("—")
        ));
    }

    out.push_str(
        "\nTwo hue spans, because they answer different questions. **Intended** is the OKLCH the \
         engine computed; it is near zero by construction, since holding hue is what the ramp \
         definition does. **Rendered** is that colour quantised to sRGB and read back — what a \
         browser paints. When the two diverge, the ramp definition is fine and the **gamut \
         mapping** is bending it, which is where any fix belongs.\n\n\
         **Read the chroma column before acting on the hue column.** They can point in opposite \
         directions, and the hue number is the more flattering of the two. A ramp that has lost \
         chroma will *always* show a better hue span — there is less colour left to drift, and \
         near-grey steps drop out of the measurement entirely. So an apparent hue improvement \
         accompanied by a large negative chroma delta is a ramp being greyed, not corrected. \
         Regenerating on the strength of the hue column alone is how a desaturation regression \
         gets shipped as a fix.\n",
    );

    out.push_str(&format!(
        "\n⚠ marks a ramp past a `better-colors` threshold: hue span over {HUE_SPAN_LIMIT:.0}° \
         (beyond that it is no longer one colour end to end), or a light-end step under \
         {MIN_LIGHT_END_DELTA_L:.0}% lightness separation (below that the steps stop being \
         usable as distinct surfaces).\n\n\
         These are **reported, not gated** — gating would block the commits trying to fix them.\n",
    ));

    if !repro_failures.is_empty() {
        out.push_str("\n## Reproduction mismatches\n\n");
        for r in repro_failures {
            out.push_str(&format!("### {} ({})\n\n", r.ramp, r.theme));
            for m in &r.mismatches {
                out.push_str(&format!("- {m}\n"));
            }
            out.push('\n');
        }
    }

    out.push_str("\n## Per-step detail\n\n");
    for r in reports {
        out.push_str(&format!(
            "### {} — {} (seed `{}`)\n\n",
            r.ramp, r.theme, r.seed
        ));
        out.push_str(
            "| step | hex | L | C | H (rendered) | H (intended) | ΔL | best foreground | source | contrast |\n",
        );
        out.push_str(
            "| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |\n",
        );
        for s in &r.steps {
            out.push_str(&format!(
                "| {} | `{}` | {:.3} | {:.3} | {:.1} | {:.1} | {} | `{}` | {} | {:.2}:1 {} |\n",
                s.label,
                s.hex,
                s.rendered_l,
                s.rendered_c,
                s.rendered_h,
                s.h,
                s.delta_l.map_or("—".to_string(), |v| format!("{v:.1}")),
                s.fg_hex,
                s.fg_source,
                s.fg_ratio,
                s.fg_rating,
            ));
        }
        out.push('\n');
    }

    out.push_str(
        "\n## On the foreground columns\n\n\
         Every swatch carries the engine's own accessible-foreground recommendation \
         (`Swatch::best_foreground`), the tier it came from (`ForegroundSource`), and the contrast \
         it achieves. This is worth reading before treating any contrast finding as a token \
         problem: the engine is **not** silent on contrast — it already guarantees a readable \
         foreground for every fill it generates.\n\n\
         Note what the sources are, though: `Step900`, `Step50`, `SoftWhite`, `SoftBlack`, \
         `PureWhite`, `PureBlack`. The recommendation is drawn from the ramp's **ends or the \
         white/black anchors**, because the question it answers is \"what text goes on this solid \
         fill\". It does not answer \"which mid-ramp step is readable on some other surface\" — \
         which is the shape of a link colour, a muted-text colour, or a border. That gap is why \
         those roles are currently hand-picked in the semantic tier, and why they can drift below \
         threshold without anything noticing.\n",
    );

    out
}

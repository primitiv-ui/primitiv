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

use harmoni_core::api::generate_brand_pair;
use harmoni_core::{ColorInput, Palette};

/// Steps below this chroma carry no meaningful hue, so including them in a
/// hue-span measurement produces noise rather than signal — a near-grey step
/// can report any hue at all.
const CHROMATIC_FLOOR: f32 = 0.02;

/// The `better-colors` guidance treats anything within 15 degrees as the same
/// colour, so a ramp spanning more than that is no longer one hue end to end.
const HUE_SPAN_LIMIT: f32 = 15.0;

/// Steps at the light end exist to be distinguishable surfaces. Below roughly
/// this much perceived-lightness separation they stop being usable as two.
const MIN_LIGHT_END_DELTA_L: f32 = 4.0;

/// How many steps from the light end to hold to the tighter spacing rule.
const LIGHT_END_STEPS: usize = 3;

struct Seed {
    ramp: String,
    seed: String,
}

struct StepMetric {
    label: String,
    hex: String,
    l: f32,
    c: f32,
    h: f32,
    delta_l: Option<f32>,
    committed_hex: Option<String>,
}

struct RampReport {
    ramp: String,
    seed: String,
    theme: String,
    steps: Vec<StepMetric>,
    hue_span: Option<f32>,
    min_light_end_delta_l: Option<f32>,
    chroma_peak_label: Option<String>,
    reproduces: Option<bool>,
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
    let mut steps: Vec<StepMetric> = Vec::new();
    let mut prev_l: Option<f32> = None;

    for swatch in &palette.swatches {
        let label = swatch.label.to_string();
        let delta_l = prev_l.map(|p| (p - swatch.l) * 100.0);
        prev_l = Some(swatch.l);

        let committed_hex = committed
            .and_then(|m| m.get(&format!("{theme}/{}/{label}", seed.ramp)))
            .cloned();

        steps.push(StepMetric {
            label,
            hex: swatch.hex.to_lowercase(),
            l: swatch.l,
            c: swatch.c,
            h: swatch.h,
            delta_l,
            committed_hex,
        });
    }

    // Hue span across the steps that actually carry hue.
    let hues: Vec<f32> = steps
        .iter()
        .filter(|s| s.c > CHROMATIC_FLOOR)
        .map(|s| s.h)
        .collect();
    let hue_span = if hues.len() >= 2 {
        let min = hues.iter().cloned().fold(f32::INFINITY, f32::min);
        let max = hues.iter().cloned().fold(f32::NEG_INFINITY, f32::max);
        Some(max - min)
    } else {
        None
    };

    // Tightest lightness step among the first few, where surfaces live.
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
    let mut mismatches = Vec::new();
    let mut compared = 0usize;
    for s in &steps {
        if let Some(expected) = &s.committed_hex {
            compared += 1;
            if expected != &s.hex {
                mismatches.push(format!("{}: engine {} vs committed {}", s.label, s.hex, expected));
            }
        }
    }
    let reproduces = if compared == 0 {
        None
    } else {
        Some(mismatches.is_empty())
    };

    RampReport {
        ramp: seed.ramp.clone(),
        seed: seed.seed.clone(),
        theme: theme.to_string(),
        steps,
        hue_span,
        min_light_end_delta_l,
        chroma_peak_label,
        reproduces,
        mismatches,
    }
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
                "        {{ \"step\": \"{}\", \"hex\": \"{}\", \"l\": {:.4}, \"c\": {:.4}, \"h\": {:.2}, \"deltaL\": {} }}{}\n",
                json_escape(&s.label),
                json_escape(&s.hex),
                s.l,
                s.c,
                s.h,
                s.delta_l.map_or("null".into(), |v| format!("{v:.2}")),
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
    out.push_str("| ramp | theme | reproduces | hue span | light-end min ΔL | chroma peak |\n");
    out.push_str("| --- | --- | --- | ---: | ---: | --- |\n");
    for r in reports {
        let repro = match r.reproduces {
            Some(true) => "yes",
            Some(false) => "**NO**",
            None => "n/a",
        };
        let span = r.hue_span.map_or("—".to_string(), |v| {
            let flag = if v > HUE_SPAN_LIMIT { " ⚠" } else { "" };
            format!("{v:.1}°{flag}")
        });
        let dl = r.min_light_end_delta_l.map_or("—".to_string(), |v| {
            let flag = if v < MIN_LIGHT_END_DELTA_L { " ⚠" } else { "" };
            format!("{v:.1}{flag}")
        });
        out.push_str(&format!(
            "| {} | {} | {} | {} | {} | {} |\n",
            r.ramp,
            r.theme,
            repro,
            span,
            dl,
            r.chroma_peak_label.as_deref().unwrap_or("—")
        ));
    }

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
        out.push_str("| step | hex | L | C | H | ΔL |\n| --- | --- | ---: | ---: | ---: | ---: |\n");
        for s in &r.steps {
            out.push_str(&format!(
                "| {} | `{}` | {:.3} | {:.3} | {:.1} | {} |\n",
                s.label,
                s.hex,
                s.l,
                s.c,
                s.h,
                s.delta_l.map_or("—".to_string(), |v| format!("{v:+.1}"))
            ));
        }
        out.push('\n');
    }

    out
}

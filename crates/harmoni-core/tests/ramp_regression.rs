//! Ramp-quality regression guards over the shipped seeds (RFC 0027 §5).
//!
//! These are guards, not driven behaviour: they pass the day they are written,
//! and that is the point. RFC 0010's gamut change cost `warning` 21% and `info`
//! 41% of their light-end chroma and sat in `main` for months, because nothing
//! measured chroma. With `assess_ramp` in the engine, that class of change fails
//! here, at the commit that makes it, naming the ramp.
//!
//! What is gated and what is not is deliberate (RFC 0027 D4). A ramp greying out
//! is an objective regression and fails. "Is this ramp attractive", and how much
//! hue drift is acceptable, are design judgements — the `ramp-audit` workflow
//! reports those without failing, because a gate would block the very commits
//! trying to improve them.
//!
//! Everything here goes through `harmoni_core::api`, so the guards also prove
//! the curated surface is enough to assess a ramp without reaching inside.

use std::path::PathBuf;

use harmoni_core::api::{assess_ramp, generate_brand_pair, Gamut, RampQuality};
use harmoni_core::ColorInput;

/// Below this mean utilisation a ramp is being greyed rather than refined. The
/// shipped ramps currently sit between 0.75 and 1.00, so the floor leaves real
/// headroom for design work while still catching the ~40% collapse this RFC
/// exists because of.
const MIN_MEAN_CHROMA_UTILISATION: f32 = 0.6;

/// A yellow close enough to the sRGB edge that the gamut mapping genuinely has
/// to make a decision at the light end. Deliberately *not* from the manifest:
/// the shipped seeds are the set we care about, and this is the hard case that
/// keeps the guards honest when they all pass (RFC 0027 §5).
const HARD_HUE_SEED: &str = "#f5c400";

/// Every ramp the shipped palette is generated from, as `(name, seed)`, read
/// from the manifest rather than copied so the guards cannot fall behind it.
fn shipped_seeds() -> Vec<(String, String)> {
    let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../packages/tokens/harmoni-seeds.json");
    let raw = std::fs::read_to_string(&manifest)
        .unwrap_or_else(|e| panic!("{}: {e}", manifest.display()));
    let doc: serde_json::Value = serde_json::from_str(&raw).expect("the manifest should be JSON");

    doc["seeds"]
        .as_array()
        .expect("the manifest should carry a `seeds` array")
        .iter()
        .map(|entry| {
            (
                entry["ramp"].as_str().expect("a ramp name").to_string(),
                entry["seed"].as_str().expect("a seed colour").to_string(),
            )
        })
        .collect()
}

/// Assesses one seed's light and dark ramps, labelled for a legible failure.
fn assess_pair(name: &str, seed: &str) -> Vec<(String, RampQuality)> {
    let pair = generate_brand_pair(ColorInput::Css(seed.to_string()))
        .unwrap_or_else(|e| panic!("{name} ({seed}) should generate: {e:?}"));

    vec![
        (format!("{name} light"), assess_ramp(&pair.light, Gamut::Srgb)),
        (format!("{name} dark"), assess_ramp(&pair.dark, Gamut::Srgb)),
    ]
}

/// Every shipped ramp, plus the hard hue, as `(label, quality)`.
fn every_ramp() -> Vec<(String, RampQuality)> {
    shipped_seeds()
        .iter()
        .map(|(name, seed)| (name.as_str(), seed.as_str()))
        .chain([("hard-hue", HARD_HUE_SEED)])
        .flat_map(|(name, seed)| assess_pair(name, seed))
        .collect()
}

#[test]
fn every_ramp_keeps_an_accessible_foreground_on_every_step() {
    // True today across all 100 shipped swatches, and never stated anywhere
    // until now — so nothing could have noticed it breaking (RFC 0027 §3).
    for (label, quality) in every_ramp() {
        assert!(
            quality.foreground_coverage.is_complete(),
            "{label}: {} step(s) have no accessible foreground ({:?})",
            quality.foreground_coverage.fail,
            quality.foreground_coverage,
        );
    }
}

#[test]
fn no_ramp_greys_out() {
    // The guard RFC 0027 exists for. Utilisation is measured against the gamut
    // rather than against the committed palette, so it needs no reference
    // colours and the bar cannot drift with whatever was committed last.
    for (label, quality) in every_ramp() {
        let mean = quality
            .mean_chroma_utilisation
            .unwrap_or_else(|| panic!("{label}: no step had a measurable utilisation"));

        assert!(
            mean >= MIN_MEAN_CHROMA_UTILISATION,
            "{label}: mean chroma utilisation {mean:.3} has fallen below \
             {MIN_MEAN_CHROMA_UTILISATION} — the ramp is being greyed, not refined",
        );
    }
}

#[test]
fn every_ramp_holds_its_hue_by_construction() {
    // The control that makes the rendered hue span readable: the ramp definition
    // holds hue exactly, so every degree a browser paints arrives during gamut
    // mapping. Without this pinned, a rendered-span change cannot be attributed
    // to one or the other (RFC 0027 D3).
    for (label, quality) in every_ramp() {
        let intended = quality
            .hue_span_intended
            .unwrap_or_else(|| panic!("{label}: no chromatic steps to measure a hue span across"));

        assert!(
            intended < 0.01,
            "{label}: the ramp definition itself now spans {intended:.3}° of hue",
        );
    }
}

#[test]
fn the_guards_above_actually_cover_every_shipped_ramp() {
    // Without this, an empty manifest — or a parse that quietly yields nothing —
    // makes every guard above pass by iterating over nothing at all.
    let shipped = shipped_seeds();
    let covered = every_ramp();

    assert!(!shipped.is_empty(), "the seed manifest resolved to no ramps");
    assert_eq!(
        covered.len(),
        (shipped.len() + 1) * 2,
        "expected a light and a dark ramp for every seed plus the hard hue, got: {:?}",
        covered.iter().map(|(label, _)| label).collect::<Vec<_>>(),
    );
    for (name, _) in &shipped {
        assert!(
            covered.iter().any(|(label, _)| label.starts_with(name)),
            "{name} is in the manifest but no guard assessed it",
        );
    }
}

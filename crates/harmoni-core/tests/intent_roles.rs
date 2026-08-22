//! The semantic roles that are supposed to be *derived*, checked against the
//! engine that derives them (RFC 0027 §6).
//!
//! `content/muted`, `action/link/foreground/default` and `border/default` are
//! not free choices — each is "the quietest step of its ramp that still clears
//! its threshold on `surface/default`", which is exactly `readable_step`. They
//! were hand-picked anyway, and all three drifted below threshold silently: the
//! 2026-08-15 audit found the dark link at 3.78:1 and dark muted text at 4.20:1.
//!
//! This is also where the accessibility *floors* live. They used to be asserted
//! in `packages/tokens/src/dark-mode-content.test.ts` against a hand-rolled
//! `luminance()` / `contrastRatio()` pair — a second implementation of the
//! engine's own maths, free to disagree with it. The floors are the engine's
//! answer now; that file keeps the properties only it can see (a state ramp
//! running the wrong way, a background that fails to track the theme).

use std::path::PathBuf;

use harmoni_core::api::{grade, readable_step, ContrastUse, Grade, Level};
use harmoni_core::audit::contrast::get_contrast_rating_for_step;
use harmoni_core::{ColorInput, SwatchLabel, SwatchStep};

const STEPS: [u16; 10] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

/// The bar each role has to clear, read from the engine rather than restated
/// here — the thresholds are WCAG's, and one copy of them is the point.
fn floor(r#use: ContrastUse) -> f32 {
    r#use
        .floor(Level::Aa)
        .expect("every use defines an AA bar")
}

fn token_file(name: &str) -> serde_json::Value {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../packages/tokens/src")
        .join(name);
    let raw =
        std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{}: {e}", path.display()));
    serde_json::from_str(&raw).unwrap_or_else(|e| panic!("{}: {e}", path.display()))
}

/// Follows a DTCG alias chain (`{color.neutral.900}`) down to a literal hex.
fn resolve(palette: &serde_json::Value, mode: &str, reference: &str) -> String {
    let Some(path) = reference.strip_prefix('{').and_then(|r| r.strip_suffix('}')) else {
        return reference.to_string();
    };

    let mut node = &palette[mode];
    for key in path.split('.') {
        node = &node[key];
    }
    let value = node["$value"]
        .as_str()
        .unwrap_or_else(|| panic!("{mode} {path} should carry a $value"));

    resolve(palette, mode, value)
}

/// One Intent role's colour, as the token layer ships it.
fn role(
    intent: &serde_json::Value,
    palette: &serde_json::Value,
    mode: &str,
    token: &str,
) -> SwatchStep {
    let mut node = &intent[mode];
    for key in token.split('/') {
        node = &node[key];
    }
    let value = node["$value"]
        .as_str()
        .unwrap_or_else(|| panic!("{mode} {token} should carry a $value"));

    step(&resolve(palette, mode, value), SwatchLabel::Name(token.into()))
}

/// The step an Intent role aliases, as a number, so it can be compared with
/// whatever `readable_step` picks.
fn aliased_step(intent: &serde_json::Value, mode: &str, token: &str) -> u16 {
    let mut node = &intent[mode];
    for key in token.split('/') {
        node = &node[key];
    }
    let value = node["$value"].as_str().expect("a $value");

    value
        .trim_end_matches('}')
        .rsplit('.')
        .next()
        .and_then(|step| step.parse().ok())
        .unwrap_or_else(|| panic!("{mode} {token} should alias a numbered palette step, got {value}"))
}

/// WCAG contrast between two resolved roles, through the engine's own maths.
fn ratio(a: &SwatchStep, b: &SwatchStep) -> f32 {
    get_contrast_rating_for_step(b, a).ratio
}

fn step(hex: &str, label: SwatchLabel) -> SwatchStep {
    let oklch = ColorInput::Css(hex.to_string())
        .to_oklch()
        .unwrap_or_else(|e| panic!("{hex} should parse: {e:?}"));

    SwatchStep::from_label(oklch.l, oklch.chroma, oklch.hue.into_degrees(), label)
}

/// A committed palette ramp as bare colours — the shipped values, not a
/// regeneration, because the neutral ramp is not reproducible from the seed
/// manifest and it is the shipped colours these roles have to be right about.
fn ramp(palette: &serde_json::Value, mode: &str, name: &str) -> Vec<SwatchStep> {
    STEPS
        .iter()
        .map(|&number| {
            step(
                &resolve(palette, mode, &format!("{{color.{name}.{number}}}")),
                SwatchLabel::Number(number),
            )
        })
        .collect()
}

/// Every derived role as `(token, ramp, what it is used as)`.
const DERIVED: [(&str, &str, ContrastUse); 3] = [
    ("content/muted", "neutral", ContrastUse::BodyText),
    ("action/link/foreground/default", "brand", ContrastUse::BodyText),
    ("border/default", "neutral", ContrastUse::NonText),
];

#[test]
fn every_derived_role_is_the_step_the_engine_picks() {
    let intent = token_file("intent.json");
    let palette = token_file("palette.json");

    for mode in ["light", "dark"] {
        let surface = role(&intent, &palette, mode, "surface/default");

        for (token, ramp_name, r#use) in DERIVED {
            let threshold = floor(r#use);
            let picked = readable_step(&ramp(&palette, mode, ramp_name), &surface, threshold)
                .unwrap_or_else(|| panic!("{mode} {token}: no step of {ramp_name} clears {threshold}"));

            assert_eq!(
                picked.label.to_string(),
                aliased_step(&intent, mode, token).to_string(),
                "{mode} {token}: ships {} but the engine picks {} at {:.2}:1",
                aliased_step(&intent, mode, token),
                picked.label,
                picked.contrast_ratio,
            );
        }
    }
}

#[test]
fn every_text_role_clears_aa_on_the_default_surface() {
    let intent = token_file("intent.json");
    let palette = token_file("palette.json");

    for mode in ["light", "dark"] {
        let surface = role(&intent, &palette, mode, "surface/default");

        for token in [
            "content/primary",
            "content/secondary",
            "content/muted",
            "action/link/foreground/default",
            "action/link/foreground/hover",
            "action/link/foreground/active",
            "action/link/foreground/visited",
        ] {
            let measured = ratio(&role(&intent, &palette, mode, token), &surface);
            let reached = grade(measured, ContrastUse::BodyText);

            assert!(
                matches!(reached, Grade::Aa | Grade::Aaa),
                "{mode} {token}: {measured:.2}:1 against surface/default grades {reached:?}",
            );
        }
    }
}

#[test]
fn a_label_clears_aa_on_the_surface_it_actually_sits_on() {
    // `content/on-selected` is measured against `surface/selected`, not the
    // default surface — the ToggleGroup thumb keeps a light surface with a dark
    // label in both themes (RFC 0017), so the default-surface floor would be
    // measuring the wrong pair entirely.
    let intent = token_file("intent.json");
    let palette = token_file("palette.json");

    for mode in ["light", "dark"] {
        let measured = ratio(
            &role(&intent, &palette, mode, "content/on-selected"),
            &role(&intent, &palette, mode, "surface/selected"),
        );

        assert!(
            measured >= floor(ContrastUse::BodyText),
            "{mode} content/on-selected: {measured:.2}:1 on surface/selected, under AA",
        );
    }
}

#[test]
fn a_control_boundary_clears_non_text_contrast_without_reaching_text_weight() {
    // Both halves matter. A border under 3:1 fails WCAG 1.4.11; a border at
    // body-text weight passes every floor and looks like a mistake. Picking the
    // quietest clearing step is what satisfies both at once.
    let intent = token_file("intent.json");
    let palette = token_file("palette.json");

    for mode in ["light", "dark"] {
        let surface = role(&intent, &palette, mode, "surface/default");
        let border = ratio(&role(&intent, &palette, mode, "border/default"), &surface);
        let muted = ratio(&role(&intent, &palette, mode, "content/muted"), &surface);

        assert!(
            matches!(grade(border, ContrastUse::NonText), Grade::Aa),
            "{mode} border/default: {border:.2}:1, under the non-text bar",
        );
        assert!(
            border < muted,
            "{mode} border/default: {border:.2}:1 is at or past content/muted's {muted:.2}:1",
        );
    }
}

#[test]
fn the_guard_above_covers_every_role_it_claims_to() {
    // Without this, a typo'd token path that resolves to JSON null would make
    // the loops above iterate over something meaningless rather than fail.
    let intent = token_file("intent.json");
    let palette = token_file("palette.json");

    assert_eq!(DERIVED.len(), 3);
    for (token, _, _) in DERIVED {
        for mode in ["light", "dark"] {
            assert!(
                role(&intent, &palette, mode, token).hex.starts_with('#'),
                "{mode} {token} did not resolve to a colour",
            );
        }
    }
}

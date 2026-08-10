//! Audits the **shipped** token layer against a **fresh generation** from the
//! engine, to answer one question: when a shipped colour pair fails WCAG AA, is
//! that Harmoni's output or something the token layer chose for itself?
//!
//! Run with:
//!
//! ```sh
//! cargo run -p harmoni-core --example audit_shipped_palette
//! ```
//!
//! The seeds below are the ones behind the current `packages/tokens/src/
//! palette.json` — the brand colour at step 500, and the soft white / soft
//! black anchors used for that generation. Change them here to audit a
//! different palette.
//!
//! Background: RFC 0027 §3.4. The engine's contract is per-background — for
//! any given background it returns a foreground that clears 4.5:1
//! (`audit::foreground::get_best_foreground`). It makes **no** promise about
//! arbitrary semantic pairings the intent layer invents on top, which is why
//! this example reports the two classes separately.

use harmoni_core::api::audit::audit_contrast;
use harmoni_core::api::generate::{generate_pair, GenerateOptions};
use harmoni_core::api::neutral::generate_neutral_ramp;
use harmoni_core::neutral::ramp::{RampOptions, TintMode};
use harmoni_core::palette::generator::{Palette, TARGET_LIGHTNESS, TARGET_LIGHTNESS_DARK};
use harmoni_core::ColorInput;
use palette::{IntoColor, Oklch, Srgb};

/// The brand seed and soft anchors behind the shipped palette.
const BRAND: &str = "#236ce1";
const SOFT_WHITE: &str = "#ebebeb";
const SOFT_BLACK: &str = "#141414";
/// The neutral ramp's anchors (`color.neutral.50` / `.900` in the light theme).
const NEUTRAL_WHITE: &str = "#e5ecf6";
const NEUTRAL_BLACK: &str = "#121418";

fn css(hex: &str) -> ColorInput {
    ColorInput::Css(hex.to_string())
}

fn hex_to_oklch(hex: &str) -> Oklch {
    let h = hex.trim_start_matches('#');
    let channel = |i: usize| u8::from_str_radix(&h[i..i + 2], 16).unwrap() as f32 / 255.0;
    Srgb::new(channel(0), channel(2), channel(4)).into_color()
}

fn print_ramp(title: &str, palette: &Palette) {
    println!("\n===== {title} =====");
    println!(
        "{:<6} {:<9} {:<11} {:<11} {:>8}",
        "step", "generated", "engine fg", "source", "ratio"
    );
    for swatch in &palette.swatches {
        println!(
            "{:<6} {:<9} {:<11} {:<11?} {:>8}",
            swatch.label.to_string(),
            swatch.hex,
            swatch.best_foreground.hex,
            swatch.foreground_source,
            swatch.contrast_result.display_ratio,
        );
    }
}

/// Score a background/foreground pair and print it with its AA rating.
fn score(label: &str, bg: &str, fg: &str) {
    let result = audit_contrast(css(bg), css(fg)).expect("both colours parse");
    println!(
        "  {:<38} {:>8}  {}",
        label, result.display_ratio, result.rating
    );
}

fn main() {
    let options = GenerateOptions {
        light_padding: 0.0,
        dark_padding: 0.0,
        soft_white: Some(hex_to_oklch(SOFT_WHITE)),
        soft_black: Some(hex_to_oklch(SOFT_BLACK)),
    };

    let set = generate_pair(
        css(BRAND),
        &TARGET_LIGHTNESS,
        &TARGET_LIGHTNESS_DARK,
        options,
    )
    .expect("brand seed parses");

    let neutral = generate_neutral_ramp(
        css(NEUTRAL_WHITE),
        css(NEUTRAL_BLACK),
        TintMode::Inherit,
        RampOptions { bow: 0.0 },
    )
    .expect("neutral anchors parse");

    print_ramp("BRAND — light", &set.light);
    print_ramp("BRAND — dark", &set.dark);
    print_ramp("NEUTRAL — light", &neutral);

    // Class A — pairs the engine has an opinion about, where the shipped token
    // layer chose a different foreground than the engine recommended.
    println!("\n=== Class A: engine-governed foregrounds (shipped vs engine) ===");
    for (label, bg) in [
        ("action.primary.default  (brand.500)", "#236ce1"),
        ("action.primary.hover    (brand.600)", "#1150b2"),
        ("action.primary.active   (brand.700)", "#002c7d"),
    ] {
        for (fg_label, fg) in [
            ("color.white — SHIPPED", SOFT_WHITE),
            ("absolute-white", "#ffffff"),
            ("brand.50 — engine's pick", "#eff8ff"),
        ] {
            score(&format!("{label}  ×  {fg_label}"), bg, fg);
        }
    }

    // Class B — semantic pairings invented by the intent layer. The engine is
    // never asked about these, so its AA guarantee does not reach them.
    println!("\n=== Class B: hand-authored semantic pairs (engine not consulted) ===");
    for (label, bg, fg) in [
        ("content.muted on surface.default", "#ffffff", "#6f747b"),
        ("content.muted on surface.subtle", "#d3dae3", "#6f747b"),
        ("content.muted on surface.raised", "#e5ecf6", "#6f747b"),
    ] {
        score(label, bg, fg);
    }
}

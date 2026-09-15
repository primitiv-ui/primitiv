//! Colour properties of the shipped token source that no per-token check sees:
//! an alpha ramp drifting off its anchor, a background that fails to track the
//! theme, a state ramp running the wrong way.
//!
//! These lived in `packages/tokens/src/dark-mode-content.test.ts`, asserted
//! against a hand-rolled `luminance()` pair that read colours by slicing a hex
//! string (`parseInt(hex.slice(1, 3), 16)`). That worked only while the source was
//! hex. It is authored in OkLCH now, and giving TypeScript an OkLCH parser would
//! recreate the second implementation of the engine's own maths that the
//! accessibility floors were moved out of it to avoid (see `intent_roles.rs`).
//!
//! So they moved here, where the engine parses the colour — and the move made
//! them better on two counts. Lightness is OkLCH `L`, the perceptual measure the
//! engine reasons in, rather than WCAG relative luminance standing in for it. And
//! the reads are format-agnostic: `ColorInput::Css` accepts hex, `oklch()` or
//! anything else CSS does, so the source's form can change again without these
//! guards noticing.
//!
//! The structural half of that file stays in TypeScript, where it belongs — those
//! checks compare token *strings* for inequality and need no colour maths at all.

use std::path::PathBuf;

use harmoni_core::audit::contrast::get_contrast_rating_for_step;
use harmoni_core::color::input::parse_css_with_alpha;
use harmoni_core::{ColorInput, SwatchLabel, SwatchStep};

const MODES: [&str; 2] = ["light", "dark"];
const STEPS: [&str; 10] = [
    "50", "100", "200", "300", "400", "500", "600", "700", "800", "900",
];

/// Above this OkLCH lightness a colour reads as a light surface, below it as a
/// dark one. The midpoint of the scale, which is what "tracks the theme" means.
const MID_LIGHTNESS: f32 = 0.5;

fn token_file(name: &str) -> serde_json::Value {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../packages/tokens/src")
        .join(name);
    let raw = std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{}: {e}", path.display()));
    serde_json::from_str(&raw).unwrap_or_else(|e| panic!("{}: {e}", path.display()))
}

/// Follows a DTCG alias chain (`{color.neutral.900}`) down to a literal colour.
///
/// Duplicated from `intent_roles.rs` rather than shared: two integration tests
/// reading the same documents is not the same thing as two implementations of
/// colour, and a `tests/common` module to save twenty lines would put a
/// compilation dependency between two guards that are otherwise independent.
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
fn intent_color(
    intent: &serde_json::Value,
    palette: &serde_json::Value,
    mode: &str,
    token: &str,
) -> String {
    let mut node = &intent[mode];
    for key in token.split('/') {
        node = &node[key];
    }
    let value = node["$value"]
        .as_str()
        .unwrap_or_else(|| panic!("{mode} {token} should carry a $value"));

    resolve(palette, mode, value)
}

/// A colour's OkLCH lightness, chroma and hue — the engine's own reading of it.
fn oklch_of(color: &str) -> (f32, f32, f32) {
    let parsed = ColorInput::Css(color.to_string())
        .to_oklch()
        .unwrap_or_else(|e| panic!("{color} should be a CSS colour: {e:?}"));

    (parsed.l, parsed.chroma, parsed.hue.into_degrees())
}

/// A colour's alpha channel, which is the whole point of an alpha ramp.
fn alpha_of(color: &str) -> f32 {
    parse_css_with_alpha(color)
        .unwrap_or_else(|e| panic!("{color} should be a CSS colour: {e:?}"))
        .1
}

fn step(color: &str, label: &str) -> SwatchStep {
    let (l, c, h) = oklch_of(color);
    SwatchStep::from_label(l, c, h, SwatchLabel::Name(label.to_string()))
}

/// Contrast between two colours, measured by the engine rather than restated.
fn ratio(a: &str, b: &str) -> f32 {
    get_contrast_rating_for_step(&step(b, "b"), &step(a, "a")).ratio
}

/// An alpha ramp is one anchor colour at rising opacities, so every step must
/// carry that anchor's own hue and lightness. A step that drifts off it is a
/// different colour wearing the ramp's name, and no per-token check would see it.
fn assert_anchored_on(ramp: &str, anchor_ref: &str) {
    let palette = token_file("palette.json");

    for mode in MODES {
        let anchor = oklch_of(&resolve(&palette, mode, anchor_ref));
        for label in STEPS {
            let value = resolve(&palette, mode, &format!("{{color.{ramp}.{label}}}"));
            let (l, c, h) = oklch_of(&value);

            assert!(
                (l - anchor.0).abs() < 1e-4 && (c - anchor.1).abs() < 1e-4,
                "{mode} color/{ramp}/{label} is not its anchor's colour: \
                 L {l} C {c} H {h} against L {} C {} H {}",
                anchor.0,
                anchor.1,
                anchor.2
            );
        }
    }
}

/// The opacity has to rise monotonically, or the ramp is not a ramp. Ten steps
/// that all read the same opacity is a real failure mode: a bound Figma paint
/// silently drops its opacity, and ten translucent steps render as ten solid ones.
fn assert_alpha_climbs(ramp: &str) {
    let palette = token_file("palette.json");

    for mode in MODES {
        let alphas: Vec<f32> = STEPS
            .iter()
            .map(|label| alpha_of(&resolve(&palette, mode, &format!("{{color.{ramp}.{label}}}"))))
            .collect();

        for pair in alphas.windows(2) {
            assert!(
                pair[1] > pair[0],
                "{mode} color/{ramp} does not climb: {alphas:?}"
            );
        }
    }
}

#[test]
fn the_neutral_alpha_ramp_is_its_mode_s_veil_at_rising_opacities() {
    assert_anchored_on("neutral-alpha", "{color.neutral.900}");
    assert_alpha_climbs("neutral-alpha");
}

#[test]
fn the_brand_alpha_ramp_is_the_brand_colour_at_rising_opacities() {
    assert_anchored_on("brand-alpha", "{color.brand.500}");
    assert_alpha_climbs("brand-alpha");
}

/// An opaque background that tracks the theme has to be *light* in light mode and
/// *dark* in dark mode, not merely different.
///
/// `light != dark` is too weak to pin it: `table/row/selected` once shipped as
/// `#cbe5ff` light and `#c8edff` dark — two different pale blues, so it passed
/// that check while rendering a glaring pale row on a dark surface.
///
/// Opaque roles only. The alpha state layers (`*/row/hover`, `action/ghost/*`)
/// invert their ink by design, and `surface/overlay` is an inverse surface on
/// purpose, so neither belongs here.
#[test]
fn every_opaque_theme_tracking_background_follows_its_mode() {
    let (intent, palette) = (token_file("intent.json"), token_file("palette.json"));

    for token in [
        "surface/subtle",
        "surface/raised",
        "surface/floating",
        "surface/sunken",
        "action/secondary/default",
        "table/row/stripe",
        "table/row/selected",
        "choice-card/selected/background",
    ] {
        let light = oklch_of(&intent_color(&intent, &palette, "light", token)).0;
        let dark = oklch_of(&intent_color(&intent, &palette, "dark", token)).0;

        assert!(
            light > MID_LIGHTNESS,
            "{token} is not light in light mode: L {light}"
        );
        assert!(
            dark < MID_LIGHTNESS,
            "{token} is not dark in dark mode: L {dark}"
        );
    }
}

/// `surface/selected` (the ToggleGroup thumb) and `content/on-selected` (its
/// label) are the deliberate exception to the rule above: RFC 0017 requires them
/// to read as a light surface with a dark label in *both* themes, so the thumb
/// keeps lifting off a track that itself goes dark. A near-1 contrast ratio
/// between the two modes is what confirms neither one flipped.
#[test]
fn the_selected_thumb_reads_the_same_way_in_both_modes() {
    let (intent, palette) = (token_file("intent.json"), token_file("palette.json"));

    for token in ["surface/selected", "content/on-selected"] {
        let light = intent_color(&intent, &palette, "light", token);
        let dark = intent_color(&intent, &palette, "dark", token);
        let across = ratio(&light, &dark);

        assert!(
            across < 1.25,
            "{token} flipped between modes: {light} vs {dark} at {across}:1"
        );
    }
}

/// Interactive foreground states must gain contrast, not lose it.
///
/// A per-token contrast check is not enough, which is how this shipped broken:
/// the dark link ramp *descended*, default to hover to active resolving
/// 5.95:1 then 1.74:1 then 1.33:1, while the floor guard passed throughout
/// because it only ever measured `default`. The cause was reading the step
/// numbers as if both ramps ran the same way — in the light ramp a higher step is
/// darker, in the dark ramp lighter — so one alias pattern is right in one mode
/// and exactly wrong in the other. Asserting the *direction* is what makes it
/// robust: it holds whichever steps a future palette picks.
#[test]
fn a_link_gains_contrast_as_it_is_interacted_with() {
    let (intent, palette) = (token_file("intent.json"), token_file("palette.json"));

    for mode in MODES {
        let surface = intent_color(&intent, &palette, mode, "surface/default");
        let at = |state: &str| {
            ratio(
                &intent_color(
                    &intent,
                    &palette,
                    mode,
                    &format!("action/link/foreground/{state}"),
                ),
                &surface,
            )
        };

        assert!(
            at("hover") > at("default"),
            "{mode}: hover ({}) is quieter than default ({})",
            at("hover"),
            at("default")
        );
        assert!(
            at("active") > at("hover"),
            "{mode}: active ({}) is quieter than hover ({})",
            at("active"),
            at("hover")
        );
    }
}

/// The sibling property the block above cannot see: a disabled link must be
/// *quieter* than a resting one.
///
/// Both modes once shipped `disabled` aliasing the very step `default` does, so a
/// disabled link rendered identically to a live one — to a keyboard user, the only
/// cue that it is unavailable. The states guard missed it because it only ever
/// compared hover against active.
#[test]
fn a_disabled_link_is_quieter_than_a_resting_one() {
    let (intent, palette) = (token_file("intent.json"), token_file("palette.json"));

    for mode in MODES {
        let surface = intent_color(&intent, &palette, mode, "surface/default");
        let at = |state: &str| {
            ratio(
                &intent_color(
                    &intent,
                    &palette,
                    mode,
                    &format!("action/link/foreground/{state}"),
                ),
                &surface,
            )
        };

        assert!(
            at("disabled") < at("default"),
            "{mode}: disabled ({}) is as loud as default ({})",
            at("disabled"),
            at("default")
        );
    }
}

use crate::api::neutral::{
    derive_soft_neutrals, generate_neutral_ramp, generate_neutral_ramp_with_steps, tint_neutrals,
    tint_neutrals_duotone,
};
use crate::color::input::{ColorInput, ColorInputError};
use crate::neutral::ramp::{RampOptions, TintMode};

fn soft_white() -> ColorInput {
    ColorInput::Oklch {
        l: 0.95,
        c: 0.02,
        h: 240.0,
    }
}

fn soft_black() -> ColorInput {
    ColorInput::Oklch {
        l: 0.10,
        c: 0.005,
        h: 240.0,
    }
}

#[test]
fn a_stepped_neutral_ramp_carries_the_same_labels_as_a_solid_ramp_of_that_length() {
    use crate::api::generate::{generate_with_options, GenerateOptions};

    // A neutral ramp sits beside brand/danger/... in one collection, so the two
    // families have to line up step for step at every supported length.
    for count in [3usize, 7, 10, 32] {
        let neutral = generate_neutral_ramp_with_steps(
            soft_white(),
            soft_black(),
            TintMode::Inherit,
            RampOptions::default(),
            count,
        )
        .expect("a supported length should produce a neutral ramp");

        let solid = generate_with_options(
            ColorInput::Css("#3b82f6".to_string()),
            GenerateOptions {
                steps: count,
                ..GenerateOptions::default()
            },
        )
        .expect("a supported length should produce a solid ramp");

        let neutral_labels: Vec<_> = neutral.swatches.iter().map(|s| s.label.clone()).collect();
        let solid_labels: Vec<_> = solid.swatches.iter().map(|s| s.label.clone()).collect();

        assert_eq!(neutral.swatches.len(), count);
        assert_eq!(
            neutral_labels, solid_labels,
            "a {}-step neutral ramp does not line up with its solid companions",
            count
        );
    }
}

fn invalid() -> ColorInput {
    ColorInput::Css("not-a-color".to_string())
}

fn valid() -> ColorInput {
    ColorInput::Oklch {
        l: 0.5,
        c: 0.1,
        h: 0.0,
    }
}

fn invalid_error() -> ColorInputError {
    ColorInputError::InvalidCss("not-a-color".to_string())
}

#[test]
fn tint_neutrals_layers_source_hue_onto_color_input_endpoints() {
    let result = tint_neutrals(
        ColorInput::Oklch {
            l: 0.96,
            c: 0.0,
            h: 0.0,
        },
        ColorInput::Oklch {
            l: 0.22,
            c: 0.0,
            h: 0.0,
        },
        ColorInput::Oklch {
            l: 0.55,
            c: 0.18,
            h: 240.0,
        },
        0.5,
    )
    .expect("valid inputs should produce tinted neutrals");

    assert_eq!(result.white.l, 0.96);
    assert_eq!(result.black.l, 0.22);
    assert!(result.white.chroma > 0.0);
    assert_eq!(
        result.white.hue.into_degrees(),
        result.black.hue.into_degrees()
    );
}

#[test]
fn derive_soft_neutrals_returns_softened_values_from_brand_color_input() {
    let result = derive_soft_neutrals(
        ColorInput::Oklch {
            l: 0.55,
            c: 0.20,
            h: 240.0,
        },
        0.5,
    )
    .expect("valid input should produce soft neutrals");

    assert!((result.white.l - 0.975).abs() < 1e-5);
    assert!((result.white.chroma - 0.008).abs() < 1e-5);
    assert!((result.black.l - 0.10).abs() < 1e-5);
    assert!((result.black.chroma - 0.005).abs() < 1e-5);
}

#[test]
fn generate_neutral_ramp_returns_palette_with_endpoints_matching_color_inputs() {
    let palette = generate_neutral_ramp(
        ColorInput::Oklch {
            l: 0.95,
            c: 0.02,
            h: 240.0,
        },
        ColorInput::Oklch {
            l: 0.10,
            c: 0.005,
            h: 240.0,
        },
        TintMode::Inherit,
        RampOptions::default(),
    )
    .expect("valid inputs should produce a palette");

    assert_eq!(palette.swatches.len(), 10);

    let step_50 = &palette.swatches[0];
    assert!((step_50.l - 0.95).abs() < 1e-5);
    assert!((step_50.c - 0.02).abs() < 1e-5);

    let step_900 = &palette.swatches[9];
    assert!((step_900.l - 0.10).abs() < 1e-5);
    assert!((step_900.c - 0.005).abs() < 1e-5);
}

#[test]
fn generate_neutral_ramp_threads_the_chroma_bow_through_to_the_palette() {
    let linear = generate_neutral_ramp(
        ColorInput::Oklch {
            l: 0.95,
            c: 0.02,
            h: 240.0,
        },
        ColorInput::Oklch {
            l: 0.10,
            c: 0.008,
            h: 240.0,
        },
        TintMode::Inherit,
        RampOptions::default(),
    )
    .expect("valid inputs should produce a palette");
    let bowed = generate_neutral_ramp(
        ColorInput::Oklch {
            l: 0.95,
            c: 0.02,
            h: 240.0,
        },
        ColorInput::Oklch {
            l: 0.10,
            c: 0.008,
            h: 240.0,
        },
        TintMode::Inherit,
        RampOptions { bow: 1.0 },
    )
    .expect("valid inputs should produce a palette");

    assert!(bowed.swatches[5].c > linear.swatches[5].c);
}

#[test]
fn tint_neutrals_duotone_layers_two_hues_onto_color_input_endpoints() {
    let result = tint_neutrals_duotone(
        ColorInput::Oklch {
            l: 0.96,
            c: 0.0,
            h: 0.0,
        },
        ColorInput::Oklch {
            l: 0.22,
            c: 0.0,
            h: 0.0,
        },
        ColorInput::Oklch {
            l: 0.55,
            c: 0.18,
            h: 60.0,
        },
        ColorInput::Oklch {
            l: 0.45,
            c: 0.16,
            h: 260.0,
        },
        0.5,
    )
    .expect("valid inputs should produce tinted neutrals");

    assert_eq!(result.white.l, 0.96);
    assert_eq!(result.black.l, 0.22);
    assert!(result.white.chroma > 0.0);
    assert!(result.black.chroma > 0.0);
    assert_eq!(result.white.hue.into_degrees(), 60.0);
    assert_eq!(result.black.hue.into_degrees(), -100.0);
}

#[test]
fn generate_neutral_ramp_propagates_an_invalid_white_input() {
    let result = generate_neutral_ramp(invalid(), valid(), TintMode::Inherit, RampOptions::default());

    assert_eq!(result.unwrap_err(), invalid_error());
}

#[test]
fn generate_neutral_ramp_propagates_an_invalid_black_input_when_white_is_valid() {
    let result = generate_neutral_ramp(valid(), invalid(), TintMode::Inherit, RampOptions::default());

    assert_eq!(result.unwrap_err(), invalid_error());
}

#[test]
fn derive_soft_neutrals_propagates_an_invalid_brand_input() {
    let result = derive_soft_neutrals(invalid(), 0.5);

    assert_eq!(result.unwrap_err(), invalid_error());
}

#[test]
fn tint_neutrals_propagates_an_invalid_white_input() {
    let result = tint_neutrals(invalid(), valid(), valid(), 0.5);

    assert_eq!(result.unwrap_err(), invalid_error());
}

#[test]
fn tint_neutrals_propagates_an_invalid_black_input_when_white_is_valid() {
    let result = tint_neutrals(valid(), invalid(), valid(), 0.5);

    assert_eq!(result.unwrap_err(), invalid_error());
}

#[test]
fn tint_neutrals_propagates_an_invalid_source_input_when_white_and_black_are_valid() {
    let result = tint_neutrals(valid(), valid(), invalid(), 0.5);

    assert_eq!(result.unwrap_err(), invalid_error());
}

#[test]
fn tint_neutrals_duotone_propagates_an_invalid_white_input() {
    let result = tint_neutrals_duotone(invalid(), valid(), valid(), valid(), 0.5);

    assert_eq!(result.unwrap_err(), invalid_error());
}

#[test]
fn tint_neutrals_duotone_propagates_an_invalid_black_input_when_white_is_valid() {
    let result = tint_neutrals_duotone(valid(), invalid(), valid(), valid(), 0.5);

    assert_eq!(result.unwrap_err(), invalid_error());
}

#[test]
fn tint_neutrals_duotone_propagates_an_invalid_highlight_input_when_white_and_black_are_valid() {
    let result = tint_neutrals_duotone(valid(), valid(), invalid(), valid(), 0.5);

    assert_eq!(result.unwrap_err(), invalid_error());
}

#[test]
fn tint_neutrals_duotone_propagates_an_invalid_shadow_input_when_the_rest_are_valid() {
    let result = tint_neutrals_duotone(valid(), valid(), valid(), invalid(), 0.5);

    assert_eq!(result.unwrap_err(), invalid_error());
}

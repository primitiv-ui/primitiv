use super::ramp::{generate_alpha_ramp, generate_alpha_ramp_with_steps, ALPHA_CURVE};
use crate::color::output::format_oklch_alpha;
use crate::palette::generator::step_labels;
use palette::Oklch;

fn anchor() -> Oklch {
    Oklch::new(0.2, 0.03, 260.0)
}

#[test]
fn generate_alpha_ramp_carries_the_anchor_srgb_channels_on_every_step() {
    let anchor = anchor();
    let expected = crate::color::output::oklch_to_rgb(anchor);
    let ramp = generate_alpha_ramp(anchor);
    for swatch in &ramp {
        assert_eq!(swatch.rgb, expected);
    }
}

#[test]
fn generate_alpha_ramp_renders_an_eight_digit_hex_carrying_the_step_opacity() {
    let ramp = generate_alpha_ramp(anchor());
    // #rrggbb from the anchor, plus the step's opacity quantised to a byte.
    assert_eq!(ramp[0].hex.len(), 9);
    assert!(ramp[0].hex.starts_with(&crate::color::output::oklch_to_hex(anchor())));
    assert_eq!(&ramp[0].hex[7..], "08"); // 0.03 * 255 = 7.65 -> 8
    assert_eq!(&ramp[9].hex[7..], "eb"); // 0.92 * 255 = 234.6 -> 235
}

#[test]
fn generate_alpha_ramp_with_steps_labels_its_steps_like_a_solid_ramp_of_the_same_length() {
    let ramp = generate_alpha_ramp_with_steps(anchor(), 7);
    let steps: Vec<u16> = ramp.iter().map(|s| s.step).collect();
    assert_eq!(steps, step_labels(7));
}

#[test]
fn generate_alpha_ramp_produces_ten_steps_labelled_50_to_900() {
    let ramp = generate_alpha_ramp(anchor());
    let steps: Vec<u16> = ramp.iter().map(|s| s.step).collect();
    assert_eq!(steps, vec![50, 100, 200, 300, 400, 500, 600, 700, 800, 900]);
}

#[test]
fn generate_alpha_ramp_climbs_the_alpha_curve() {
    let ramp = generate_alpha_ramp(anchor());
    let alphas: Vec<f32> = ramp.iter().map(|s| s.alpha).collect();
    assert_eq!(alphas, ALPHA_CURVE.to_vec());
}

#[test]
fn generate_alpha_ramp_holds_the_anchor_colour_constant_across_steps() {
    let anchor = anchor();
    let ramp = generate_alpha_ramp(anchor);
    for swatch in &ramp {
        assert_eq!(swatch.l, anchor.l);
        assert_eq!(swatch.c, anchor.chroma);
        assert_eq!(swatch.h, anchor.hue.into_degrees());
    }
}

#[test]
fn generate_alpha_ramp_carries_the_alpha_into_the_oklch_string() {
    let anchor = anchor();
    let ramp = generate_alpha_ramp(anchor);
    assert_eq!(ramp[0].oklch, format_oklch_alpha(anchor, ALPHA_CURVE[0]));
    assert_eq!(ramp[9].oklch, format_oklch_alpha(anchor, ALPHA_CURVE[9]));
}

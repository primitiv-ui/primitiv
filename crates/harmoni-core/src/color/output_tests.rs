use super::input::ColorInput;
use super::output::{format_oklch, oklch_to_hex, oklch_to_rgb, Rgb};
use palette::Oklch;

// Ground-truth OkLCH values for well-known sRGB colors come from the
// Oklab reference (https://bottosson.github.io/posts/oklab/), so the
// assertions exercise the conversion rather than tautologically
// matching our own input path.

const CHANNEL_EPSILON: f32 = 0.01;

fn assert_rgb_approx_eq(actual: Rgb, r: f32, g: f32, b: f32) {
    assert!(
        (actual.r - r).abs() < CHANNEL_EPSILON,
        "r: expected ~{r}, got {}",
        actual.r
    );
    assert!(
        (actual.g - g).abs() < CHANNEL_EPSILON,
        "g: expected ~{g}, got {}",
        actual.g
    );
    assert!(
        (actual.b - b).abs() < CHANNEL_EPSILON,
        "b: expected ~{b}, got {}",
        actual.b
    );
}

#[test]
fn oklch_to_rgb_converts_pure_white() {
    assert_rgb_approx_eq(oklch_to_rgb(Oklch::new(1.0, 0.0, 0.0)), 1.0, 1.0, 1.0);
}

#[test]
fn oklch_to_rgb_converts_pure_black() {
    assert_rgb_approx_eq(oklch_to_rgb(Oklch::new(0.0, 0.0, 0.0)), 0.0, 0.0, 0.0);
}

#[test]
fn oklch_to_rgb_converts_pure_red() {
    // #ff0000 in OkLCH per the Oklab reference.
    assert_rgb_approx_eq(oklch_to_rgb(Oklch::new(0.6279, 0.2577, 29.23)), 1.0, 0.0, 0.0);
}

#[test]
fn oklch_to_rgb_clamps_out_of_gamut_channels_into_range() {
    // A highly chromatic OkLCH point that lands outside the sRGB gamut;
    // channels must still be reported within 0..=1.
    let rgb = oklch_to_rgb(Oklch::new(0.6, 0.37, 29.23));
    assert!((0.0..=1.0).contains(&rgb.r), "r out of range: {}", rgb.r);
    assert!((0.0..=1.0).contains(&rgb.g), "g out of range: {}", rgb.g);
    assert!((0.0..=1.0).contains(&rgb.b), "b out of range: {}", rgb.b);
}

#[test]
fn oklch_to_hex_formats_pure_white() {
    assert_eq!(oklch_to_hex(Oklch::new(1.0, 0.0, 0.0)), "#ffffff");
}

#[test]
fn oklch_to_hex_formats_pure_black() {
    assert_eq!(oklch_to_hex(Oklch::new(0.0, 0.0, 0.0)), "#000000");
}

#[test]
fn oklch_to_hex_round_trips_a_known_brand_colour() {
    let oklch = ColorInput::Css("#3b82f6".to_string())
        .to_oklch()
        .expect("a valid hex string should parse");
    assert_eq!(oklch_to_hex(oklch), "#3b82f6");
}

#[test]
fn format_oklch_renders_a_css_oklch_string() {
    assert_eq!(
        format_oklch(Oklch::new(0.55, 0.12, 30.0)),
        "oklch(0.55 0.12 30)"
    );
}

#[test]
fn format_oklch_rounds_components_to_four_decimal_places() {
    assert_eq!(
        format_oklch(Oklch::new(0.6279012, 0.2577891, 29.234567)),
        "oklch(0.6279 0.2578 29.2346)"
    );
}

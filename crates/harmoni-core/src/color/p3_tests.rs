use super::output::Rgb;
use super::p3::oklch_to_p3_rgb;
use palette::Oklch;

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
fn oklch_to_p3_rgb_converts_pure_white() {
    // White is white in every RGB space sharing the D65 white point.
    assert_rgb_approx_eq(oklch_to_p3_rgb(Oklch::new(1.0, 0.0, 0.0)), 1.0, 1.0, 1.0);
}

#[test]
fn oklch_to_p3_rgb_converts_pure_black() {
    assert_rgb_approx_eq(oklch_to_p3_rgb(Oklch::new(0.0, 0.0, 0.0)), 0.0, 0.0, 0.0);
}

#[test]
fn oklch_to_p3_rgb_maps_srgb_red_into_p3_coordinates() {
    // sRGB #ff0000 (the OkLCH triple from the Oklab reference) is not a P3
    // primary: in Display-P3 it sits at color(display-p3 0.9175 0.2003 0.1386),
    // the canonical CSS Color 4 value. This exercises the P3 matrices + the
    // sRGB transfer, not a tautology.
    assert_rgb_approx_eq(
        oklch_to_p3_rgb(Oklch::new(0.6279, 0.2577, 29.23)),
        0.9175,
        0.2003,
        0.1386,
    );
}

#[test]
fn oklch_to_p3_rgb_clamps_out_of_p3_channels_into_range() {
    // A chroma far beyond even the P3 gamut; channels must still report in 0..=1.
    let rgb = oklch_to_p3_rgb(Oklch::new(0.6, 0.45, 29.23));
    assert!((0.0..=1.0).contains(&rgb.r), "r out of range: {}", rgb.r);
    assert!((0.0..=1.0).contains(&rgb.g), "g out of range: {}", rgb.g);
    assert!((0.0..=1.0).contains(&rgb.b), "b out of range: {}", rgb.b);
}

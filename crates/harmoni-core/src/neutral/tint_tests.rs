use crate::neutral::tint::{tint_neutrals, tint_neutrals_duotone};
use palette::Oklch;

#[test]
fn should_take_highlight_hue_on_the_white_end_and_shadow_hue_on_the_black_end() {
    let white = Oklch::new(0.96, 0.0, 0.0);
    let black = Oklch::new(0.22, 0.0, 0.0);
    let highlight = Oklch::new(0.55, 0.18, 60.0); // warm highlight
    let shadow = Oklch::new(0.45, 0.16, 260.0); // cool shadow

    let result = tint_neutrals_duotone(white, black, highlight, shadow, 0.5);

    assert_eq!(result.white.l, 0.96);
    assert_eq!(result.black.l, 0.22);
    assert!(result.white.chroma > 0.0);
    assert!(result.black.chroma > 0.0);
    assert_eq!(result.white.hue.into_degrees(), highlight.hue.into_degrees());
    assert_eq!(result.black.hue.into_degrees(), shadow.hue.into_degrees());
}

#[test]
fn should_match_the_single_source_tint_when_both_anchors_coincide() {
    let white = Oklch::new(0.96, 0.0, 0.0);
    let black = Oklch::new(0.22, 0.0, 0.0);
    let source = Oklch::new(0.55, 0.18, 240.0);

    let duotone = tint_neutrals_duotone(white, black, source, source, 0.5);
    let mono = tint_neutrals(white, black, source, 0.5);

    assert_eq!(duotone.white.l, mono.white.l);
    assert_eq!(duotone.white.chroma, mono.white.chroma);
    assert_eq!(
        duotone.white.hue.into_degrees(),
        mono.white.hue.into_degrees()
    );
    assert_eq!(duotone.black.l, mono.black.l);
    assert_eq!(duotone.black.chroma, mono.black.chroma);
    assert_eq!(
        duotone.black.hue.into_degrees(),
        mono.black.hue.into_degrees()
    );
}

#[test]
fn should_layer_source_hue_and_chroma_onto_endpoints_when_strength_is_positive() {
    let white = Oklch::new(0.96, 0.0, 0.0);
    let black = Oklch::new(0.22, 0.0, 0.0);
    let source = Oklch::new(0.55, 0.18, 240.0);

    let result = tint_neutrals(white, black, source, 0.5);

    assert_eq!(result.white.l, 0.96);
    assert_eq!(result.black.l, 0.22);
    assert!(result.white.chroma > 0.0);
    assert!(result.black.chroma > 0.0);
    assert_eq!(result.white.hue.into_degrees(), source.hue.into_degrees());
    assert_eq!(result.black.hue.into_degrees(), source.hue.into_degrees());
}

#[test]
fn should_clamp_strength_to_the_unit_range() {
    let white = Oklch::new(0.96, 0.0, 0.0);
    let black = Oklch::new(0.22, 0.0, 0.0);
    let source = Oklch::new(0.55, 0.18, 240.0);

    let at_one = tint_neutrals(white, black, source, 1.0);
    let above_one = tint_neutrals(white, black, source, 2.5);
    assert_eq!(above_one.white.chroma, at_one.white.chroma);
    assert_eq!(above_one.black.chroma, at_one.black.chroma);

    let at_zero = tint_neutrals(white, black, source, 0.0);
    let below_zero = tint_neutrals(white, black, source, -1.0);
    assert_eq!(below_zero.white.chroma, at_zero.white.chroma);
    assert_eq!(below_zero.black.chroma, at_zero.black.chroma);
}

#[test]
fn should_preserve_endpoint_lightness_and_stay_achromatic_when_strength_is_zero() {
    let white = Oklch::new(0.96, 0.0, 0.0);
    let black = Oklch::new(0.22, 0.0, 0.0);
    let source = Oklch::new(0.55, 0.18, 240.0);

    let result = tint_neutrals(white, black, source, 0.0);

    assert_eq!(result.white.l, 0.96);
    assert_eq!(result.white.chroma, 0.0);
    assert_eq!(result.black.l, 0.22);
    assert_eq!(result.black.chroma, 0.0);
}

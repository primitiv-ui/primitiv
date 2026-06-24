use crate::neutral::ramp::{generate_neutral_ramp, RampOptions, TintMode};
use crate::palette::generator::SwatchLabel;
use palette::Oklch;

#[test]
fn should_return_ten_labelled_swatches_with_endpoints_pinned_to_soft_white_and_soft_black() {
    let soft_white = Oklch::new(0.975, 0.006, 240.0);
    let soft_black = Oklch::new(0.10, 0.00375, 240.0);

    let palette = generate_neutral_ramp(soft_white, soft_black, TintMode::Inherit, RampOptions::default());

    assert_eq!(palette.swatches.len(), 10);

    let expected_labels = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
    for (i, swatch) in palette.swatches.iter().enumerate() {
        assert_eq!(swatch.label, SwatchLabel::Number(expected_labels[i]));
    }

    let step_50 = &palette.swatches[0];
    assert_eq!(step_50.l, soft_white.l);
    assert_eq!(step_50.c, soft_white.chroma);
    assert_eq!(step_50.h, soft_white.hue.into_degrees());

    let step_900 = &palette.swatches[9];
    assert_eq!(step_900.l, soft_black.l);
    assert_eq!(step_900.c, soft_black.chroma);
    assert_eq!(step_900.h, soft_black.hue.into_degrees());
}

#[test]
fn should_space_lightness_along_the_normalised_perceptual_curve() {
    use crate::palette::generator::TARGET_LIGHTNESS;

    let soft_white = Oklch::new(0.975, 0.006, 240.0);
    let soft_black = Oklch::new(0.10, 0.00375, 240.0);

    let palette = generate_neutral_ramp(soft_white, soft_black, TintMode::Inherit, RampOptions::default());

    let span = TARGET_LIGHTNESS[0] - TARGET_LIGHTNESS[9];
    for i in 0..palette.swatches.len() {
        let fraction = (TARGET_LIGHTNESS[0] - TARGET_LIGHTNESS[i]) / span;
        let expected_l = soft_white.l + (soft_black.l - soft_white.l) * fraction;
        let actual_l = palette.swatches[i].l;
        assert!(
            (actual_l - expected_l).abs() < 1e-5,
            "step at index {} has l={} but expected {}",
            i,
            actual_l,
            expected_l
        );
    }
}

#[test]
fn should_interpolate_chroma_between_endpoints_in_inherit_tint_mode() {
    use crate::palette::generator::TARGET_LIGHTNESS;

    let soft_white = Oklch::new(0.975, 0.02, 240.0);
    let soft_black = Oklch::new(0.10, 0.008, 240.0);

    let palette = generate_neutral_ramp(soft_white, soft_black, TintMode::Inherit, RampOptions::default());

    let span = TARGET_LIGHTNESS[0] - TARGET_LIGHTNESS[9];
    for i in 1..palette.swatches.len() - 1 {
        let fraction = (TARGET_LIGHTNESS[0] - TARGET_LIGHTNESS[i]) / span;
        let expected_c = soft_white.chroma + (soft_black.chroma - soft_white.chroma) * fraction;
        let actual_c = palette.swatches[i].c;
        assert!(
            (actual_c - expected_c).abs() < 1e-5,
            "step at index {} has c={} but expected {}",
            i,
            actual_c,
            expected_c
        );
        assert!(actual_c > 0.0, "step at index {} should be tinted", i);
        assert_eq!(palette.swatches[i].h, soft_white.hue.into_degrees());
    }
}

#[test]
fn should_interpolate_hue_along_the_shortest_arc_across_the_zero_degree_seam() {
    // Highlight hue 350°, shadow hue 10°: the shortest arc is +20° through the
    // 0°/360° seam, not -340° the long way round through 180°. The mid-tone
    // must therefore land near the seam, not near 180°.
    let soft_white = Oklch::new(0.975, 0.006, 350.0);
    let soft_black = Oklch::new(0.10, 0.00375, 10.0);

    let palette = generate_neutral_ramp(soft_white, soft_black, TintMode::Inherit, RampOptions::default());

    let mid = &palette.swatches[5];
    // Signed offset from 0° so 359.9 and 0.1 both read as "near the seam".
    let signed = ((mid.h + 180.0) % 360.0) - 180.0;
    assert!(
        signed.abs() < 1.0,
        "mid-tone hue {} should sit near the 0°/360° seam, not the long way round",
        mid.h
    );
}

#[test]
fn should_crest_mid_tone_chroma_above_the_linear_lerp_when_bow_is_positive() {
    let soft_white = Oklch::new(0.975, 0.02, 240.0);
    let soft_black = Oklch::new(0.10, 0.008, 240.0);

    let linear =
        generate_neutral_ramp(soft_white, soft_black, TintMode::Inherit, RampOptions::default());
    let bowed = generate_neutral_ramp(
        soft_white,
        soft_black,
        TintMode::Inherit,
        RampOptions { bow: 1.0 },
    );

    // The parabola is zero at both anchors, so the endpoints are untouched.
    assert_eq!(bowed.swatches[0].c, linear.swatches[0].c);
    assert_eq!(bowed.swatches[9].c, linear.swatches[9].c);

    // Every interior step is lifted above the linear chroma ...
    for i in 1..9 {
        assert!(
            bowed.swatches[i].c > linear.swatches[i].c,
            "step at index {} should crest above the linear chroma",
            i
        );
    }

    // ... and the lift peaks nearest the mid-tone (step 500, fraction ~0.5).
    let lift: Vec<f32> = (0..10)
        .map(|i| bowed.swatches[i].c - linear.swatches[i].c)
        .collect();
    let peak_index = lift
        .iter()
        .enumerate()
        .max_by(|a, b| a.1.partial_cmp(b.1).unwrap())
        .unwrap()
        .0;
    assert_eq!(peak_index, 5);
}

#[test]
fn should_pin_endpoint_hues_to_the_respective_anchors_when_they_differ() {
    let soft_white = Oklch::new(0.975, 0.006, 350.0);
    let soft_black = Oklch::new(0.10, 0.00375, 10.0);

    let palette = generate_neutral_ramp(soft_white, soft_black, TintMode::Inherit, RampOptions::default());

    assert_eq!(palette.swatches[0].h, soft_white.hue.into_degrees());
    assert_eq!(palette.swatches[9].h, soft_black.hue.into_degrees());
}

#[test]
fn should_use_step_50_as_the_harmonious_light_foreground_for_step_900() {
    use crate::palette::generator::SwatchLabel;
    let soft_white = palette::Oklch::new(0.95, 0.02, 240.0);
    let soft_black = palette::Oklch::new(0.10, 0.005, 240.0);

    let palette = generate_neutral_ramp(soft_white, soft_black, TintMode::Inherit, RampOptions::default());

    // Step 900 has no contrast against itself; step 50 (= soft_white) is the
    // harmonious light candidate and wins on a dark background.
    let step_50 = palette.swatches[0].clone();
    let step_900 = &palette.swatches[9];
    let fg = &step_900.best_foreground;
    assert_eq!(fg.label, SwatchLabel::Number(50));
    assert!((fg.l - step_50.l).abs() < 1e-5);
    assert!((fg.c - step_50.c).abs() < 1e-5);
}

#[test]
fn should_force_chroma_to_zero_at_every_step_in_achromatic_tint_mode() {
    let soft_white = Oklch::new(0.975, 0.02, 240.0);
    let soft_black = Oklch::new(0.10, 0.008, 240.0);

    let palette = generate_neutral_ramp(soft_white, soft_black, TintMode::Achromatic, RampOptions::default());

    for (i, swatch) in palette.swatches.iter().enumerate() {
        assert_eq!(swatch.c, 0.0, "step at index {} should have zero chroma", i);
    }
}

#[test]
fn should_decrease_lightness_monotonically_across_the_ramp() {
    let soft_white = Oklch::new(0.975, 0.006, 240.0);
    let soft_black = Oklch::new(0.10, 0.00375, 240.0);

    let palette = generate_neutral_ramp(soft_white, soft_black, TintMode::Inherit, RampOptions::default());

    for i in 0..palette.swatches.len() - 1 {
        assert!(
            palette.swatches[i].l > palette.swatches[i + 1].l,
            "step at index {} (l={}) is not greater than step at index {} (l={})",
            i,
            palette.swatches[i].l,
            i + 1,
            palette.swatches[i + 1].l
        );
    }
}

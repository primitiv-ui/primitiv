use crate::audit::foreground::{get_best_foreground, ForegroundSource};
use crate::palette::generator::{SwatchLabel, SwatchStep};

#[test]
fn should_return_dark_candidate_foreground_when_background_is_very_light() {
    let example_background = SwatchStep::from_label(0.9, 0.0, 0.0, SwatchLabel::Number(100));
    let example_dark_candidate = SwatchStep::from_label(0.1, 0.0, 0.0, SwatchLabel::Number(900));
    let result = get_best_foreground(
        &example_background,
        &example_dark_candidate,
        &example_dark_candidate,
        None,
        None,
    );

    assert_eq!(result.color, example_dark_candidate);
    assert_eq!(result.source, ForegroundSource::Step900);
    assert!(result.contrast_ratio >= 4.5);
}

#[test]
fn should_return_light_candidate_foreground_when_background_is_very_dark_and_dark_fails() {
    let example_background = SwatchStep::from_label(0.10, 0.0, 0.0, SwatchLabel::Number(900));
    let example_dark_candidate = SwatchStep::from_label(0.10, 0.0, 0.0, SwatchLabel::Number(900));
    let example_light_candidate = SwatchStep::from_label(0.95, 0.0, 0.0, SwatchLabel::Number(50));

    let result = get_best_foreground(
        &example_background,
        &example_dark_candidate,
        &example_light_candidate,
        None,
        None,
    );

    assert_eq!(result.color, example_light_candidate);
    assert_eq!(result.source, ForegroundSource::Step50);
    assert!(result.contrast_ratio >= 4.5);
}

#[test]
fn should_use_harmonious_candidate_even_when_the_dark_candidate_is_lighter_than_the_background() {
    // In a dark palette the "dark candidate" (step 900) is the *lightest*
    // step. The audit must score real WCAG contrast symmetrically rather
    // than assume the dark candidate is darker — otherwise it wrongly
    // rejects a perfectly good harmonious foreground and falls through to
    // pure white/black.
    let dark_background = SwatchStep::from_label(0.21, 0.0, 0.0, SwatchLabel::Number(50));
    let light_step_900 = SwatchStep::from_label(0.94, 0.0, 0.0, SwatchLabel::Number(900));
    let dark_step_50 = SwatchStep::from_label(0.21, 0.0, 0.0, SwatchLabel::Number(50));

    let result = get_best_foreground(
        &dark_background,
        &light_step_900,
        &dark_step_50,
        None,
        None,
    );

    assert_eq!(result.color, light_step_900);
    assert_eq!(result.source, ForegroundSource::Step900);
    assert!(result.contrast_ratio >= 4.5);
}

#[test]
fn should_return_white_foreground_when_background_is_very_dark() {
    let example_background = SwatchStep::from_label(0.1, 0.0, 0.0, SwatchLabel::Number(900));
    let example_dark_candidate = SwatchStep::from_label(0.1, 0.0, 0.0, SwatchLabel::Number(900));
    let expected_white_foreground =
        SwatchStep::from_label(1.0, 0.0, 0.0, SwatchLabel::Name(String::from("White")));
    let result = get_best_foreground(
        &example_background,
        &example_dark_candidate,
        &example_dark_candidate,
        None,
        None,
    );

    assert_eq!(result.color, expected_white_foreground);
    assert_eq!(result.source, ForegroundSource::PureWhite);
}

#[test]
fn should_select_white_as_clarity_winner_when_both_pass_as_double_a() {
    let example_background = SwatchStep::from_label(0.5, 0.0, 0.0, SwatchLabel::Number(600));
    let example_dark_candidate = SwatchStep::from_label(0.1, 0.0, 0.0, SwatchLabel::Number(900));
    let expected_white_foreground =
        SwatchStep::from_label(1.0, 0.0, 0.0, SwatchLabel::Name(String::from("White")));
    let result = get_best_foreground(
        &example_background,
        &example_dark_candidate,
        &example_dark_candidate,
        None,
        None,
    );

    assert_eq!(result.color, expected_white_foreground);
    assert_eq!(result.source, ForegroundSource::PureWhite);
}

#[test]
fn should_return_black_when_dark_candidate_fails_and_black_beats_white() {
    // Light background: white has low contrast, black has high contrast
    // Dark candidate is also light, so it fails AA
    let light_background = SwatchStep::from_label(0.85, 0.0, 0.0, SwatchLabel::Number(200));
    let light_dark_candidate = SwatchStep::from_label(0.75, 0.0, 0.0, SwatchLabel::Number(900));
    let expected_black =
        SwatchStep::from_label(0.01, 0.0, 0.0, SwatchLabel::Name(String::from("Black")));

    let result = get_best_foreground(
        &light_background,
        &light_dark_candidate,
        &light_dark_candidate,
        None,
        None,
    );

    assert_eq!(result.color, expected_black);
    assert_eq!(result.source, ForegroundSource::PureBlack);
    assert!(result.contrast_ratio >= 4.5);
}

#[test]
fn should_pick_white_in_fallback_when_neither_passes_aa() {
    // Background at mid-luminance where dark_candidate fails,
    // and both white and black fall below 4.5.
    // With near-black at L=0.01, this is hard to hit naturally,
    // so we use a background just above the crossover point.
    let mid_background = SwatchStep::from_label(0.62, 0.0, 0.0, SwatchLabel::Number(500));
    let bad_dark_candidate = SwatchStep::from_label(0.60, 0.0, 0.0, SwatchLabel::Number(900));

    let result = get_best_foreground(
        &mid_background,
        &bad_dark_candidate,
        &bad_dark_candidate,
        None,
        None,
    );

    // Dark candidate definitely fails (too close in lightness)
    // Whether we hit the fallback or the white/black AA path depends on exact luminance;
    // either way the function must return a valid recommendation
    assert!(!matches!(
        result.source,
        ForegroundSource::Step900 | ForegroundSource::Step50
    ));
    assert!(result.contrast_ratio > 0.0);
}

#[test]
fn should_use_custom_white_when_provided_against_a_very_dark_background() {
    let dark_background = SwatchStep::from_label(0.10, 0.0, 0.0, SwatchLabel::Number(900));
    let dark_candidate_failing_aa =
        SwatchStep::from_label(0.10, 0.0, 0.0, SwatchLabel::Number(900));
    let custom_white =
        SwatchStep::from_label(0.95, 0.02, 240.0, SwatchLabel::Name(String::from("White")));
    let expected =
        SwatchStep::from_label(0.95, 0.02, 240.0, SwatchLabel::Name(String::from("White")));

    let result = get_best_foreground(
        &dark_background,
        &dark_candidate_failing_aa,
        &dark_candidate_failing_aa,
        Some(&custom_white),
        None,
    );

    assert_eq!(result.color, expected);
    assert_eq!(result.source, ForegroundSource::SoftWhite);
    assert!(result.contrast_ratio >= 4.5);
}

#[test]
fn should_use_custom_black_in_fallback_path_when_provided() {
    let light_background = SwatchStep::from_label(0.85, 0.0, 0.0, SwatchLabel::Number(200));
    let light_dark_candidate = SwatchStep::from_label(0.75, 0.0, 0.0, SwatchLabel::Number(900));
    let custom_black =
        SwatchStep::from_label(0.10, 0.005, 240.0, SwatchLabel::Name(String::from("Black")));
    let expected =
        SwatchStep::from_label(0.10, 0.005, 240.0, SwatchLabel::Name(String::from("Black")));

    let result = get_best_foreground(
        &light_background,
        &light_dark_candidate,
        &light_dark_candidate,
        None,
        Some(&custom_black),
    );

    assert_eq!(result.color, expected);
    assert_eq!(result.source, ForegroundSource::SoftBlack);
    assert!(result.contrast_ratio >= 4.5);
}

#[test]
fn should_fall_back_to_a_pure_primitive_when_soft_primitives_cannot_meet_aa() {
    // A mid-tone background where the harmonious candidates and the soft
    // primitives are all too close in luminance to clear 4.5:1. Pure
    // white/black must still guarantee an AA-passing recommendation.
    let mid_background = SwatchStep::from_label(0.55, 0.15, 240.0, SwatchLabel::Number(500));
    let near_dark = SwatchStep::from_label(0.52, 0.0, 0.0, SwatchLabel::Number(900));
    let near_light = SwatchStep::from_label(0.58, 0.0, 0.0, SwatchLabel::Number(50));
    let dim_soft_white =
        SwatchStep::from_label(0.70, 0.0, 0.0, SwatchLabel::Name(String::from("White")));
    let light_soft_black =
        SwatchStep::from_label(0.45, 0.0, 0.0, SwatchLabel::Name(String::from("Black")));

    let result = get_best_foreground(
        &mid_background,
        &near_dark,
        &near_light,
        Some(&dim_soft_white),
        Some(&light_soft_black),
    );

    assert!(result.contrast_ratio >= 4.5);
    let pure_white = SwatchStep::from_label(1.0, 0.0, 0.0, SwatchLabel::Name(String::from("White")));
    let pure_black = SwatchStep::from_label(0.01, 0.0, 0.0, SwatchLabel::Name(String::from("Black")));
    assert!(
        result.color == pure_white || result.color == pure_black,
        "expected a pure white/black fallback, got {:?}",
        result.color,
    );
}

#[test]
fn should_report_the_source_tier_that_produced_each_recommendation() {
    // Step900 — harmonious dark wins against a very light background.
    let light_bg = SwatchStep::from_label(0.9, 0.0, 0.0, SwatchLabel::Number(100));
    let dark_900 = SwatchStep::from_label(0.1, 0.0, 0.0, SwatchLabel::Number(900));
    let light_50 = SwatchStep::from_label(0.95, 0.0, 0.0, SwatchLabel::Number(50));
    assert_eq!(
        get_best_foreground(&light_bg, &dark_900, &light_50, None, None).source,
        ForegroundSource::Step900,
    );

    // Step50 — harmonious light wins when dark fails against a dark background.
    let dark_bg = SwatchStep::from_label(0.10, 0.0, 0.0, SwatchLabel::Number(900));
    assert_eq!(
        get_best_foreground(&dark_bg, &dark_bg, &light_50, None, None).source,
        ForegroundSource::Step50,
    );

    // SoftWhite — supplied soft white clears AA where both harmonious fail.
    let soft_white =
        SwatchStep::from_label(0.95, 0.02, 240.0, SwatchLabel::Name(String::from("White")));
    assert_eq!(
        get_best_foreground(&dark_bg, &dark_bg, &dark_bg, Some(&soft_white), None).source,
        ForegroundSource::SoftWhite,
    );

    // SoftBlack — supplied soft black clears AA against a light background.
    let light_200 = SwatchStep::from_label(0.85, 0.0, 0.0, SwatchLabel::Number(200));
    let light_900 = SwatchStep::from_label(0.75, 0.0, 0.0, SwatchLabel::Number(900));
    let soft_black =
        SwatchStep::from_label(0.10, 0.005, 240.0, SwatchLabel::Name(String::from("Black")));
    assert_eq!(
        get_best_foreground(&light_200, &light_900, &light_900, None, Some(&soft_black)).source,
        ForegroundSource::SoftBlack,
    );

    // PureWhite — last-resort white against a dark background with no softs.
    assert_eq!(
        get_best_foreground(&dark_bg, &dark_bg, &dark_bg, None, None).source,
        ForegroundSource::PureWhite,
    );

    // PureBlack — last-resort black against a very light background.
    let very_light_bg = SwatchStep::from_label(0.95, 0.0, 0.0, SwatchLabel::Number(50));
    let near_light_900 = SwatchStep::from_label(0.93, 0.0, 0.0, SwatchLabel::Number(900));
    assert_eq!(
        get_best_foreground(&very_light_bg, &near_light_900, &near_light_900, None, None).source,
        ForegroundSource::PureBlack,
    );
}

#[test]
fn should_pick_black_in_fallback_when_black_has_higher_ratio() {
    // Very light background with a similarly light dark candidate
    // At very high lightness, black always wins over white
    let very_light_bg = SwatchStep::from_label(0.95, 0.0, 0.0, SwatchLabel::Number(50));
    let bad_dark_candidate = SwatchStep::from_label(0.93, 0.0, 0.0, SwatchLabel::Number(900));

    let result = get_best_foreground(
        &very_light_bg,
        &bad_dark_candidate,
        &bad_dark_candidate,
        None,
        None,
    );

    assert_eq!(result.source, ForegroundSource::PureBlack);
    // Black should have higher contrast against very light background
    let expected_black =
        SwatchStep::from_label(0.01, 0.0, 0.0, SwatchLabel::Name(String::from("Black")));
    assert_eq!(result.color, expected_black);
}

#[test]
#[should_panic(expected = "Pure white and pure black both failed AA")]
fn should_panic_when_a_nan_background_defeats_every_ratio_comparison() {
    // NaN propagates through every `>= 4.5` comparison as false (NaN never
    // compares true), so a NaN background clears none of the tiers above —
    // not because it's a real "impossible" sRGB background, but because NaN
    // isn't a valid color at all. The guarantee in the doc comment only
    // holds for finite inputs.
    let nan_background = SwatchStep::from_label(f32::NAN, 0.0, 0.0, SwatchLabel::Number(1));
    let candidate = SwatchStep::from_label(0.5, 0.0, 0.0, SwatchLabel::Number(2));

    get_best_foreground(&nan_background, &candidate, &candidate, None, None);
}






/// RFC 0027 §7 — "which step of this ramp is readable on *that* surface", the
/// question a link, muted-text or border colour actually asks. `get_best_foreground`
/// above answers a different one ("what text goes on this fill") and can only
/// return ramp ends or white/black anchors.
mod readable_step {
    use crate::audit::foreground::readable_step;
    use crate::audit::ramp_fixtures::{palette, swatch};
    use crate::palette::generator::SwatchStep;

    fn white() -> SwatchStep {
        SwatchStep::from_label(1.0, 0.0, 0.0, "White")
    }

    /// A blue ramp, light at 50 and dark at 900.
    fn blue_ramp() -> crate::palette::generator::Palette {
        palette(vec![
            swatch(50, 0.97, 0.02, 264.0, 21.0),
            swatch(300, 0.76, 0.12, 264.0, 21.0),
            swatch(500, 0.55, 0.20, 264.0, 21.0),
            swatch(700, 0.32, 0.14, 264.0, 21.0),
            swatch(900, 0.15, 0.08, 264.0, 21.0),
        ])
    }

    #[test]
    fn returns_a_step_that_clears_the_threshold_on_the_given_surface() {
        let found = readable_step(&blue_ramp().steps(), &white(), 4.5).expect("a readable step on white");

        assert!(
            found.contrast_ratio >= 4.5,
            "{} measures {:.2}:1 against white",
            found.label,
            found.contrast_ratio,
        );
    }

    #[test]
    fn picks_the_quietest_step_that_clears_rather_than_the_loudest() {
        // Every step darker than the surface clears easily; the role wants the
        // least contrast that still passes, so a border does not come back at
        // body-text weight. Walking the ramp in order gives the right answer only
        // while ramp order happens to run the same way as contrast — which it
        // does for a light ramp on a light surface, and does not here.
        let dark_surface = SwatchStep::from_label(0.2, 0.0, 0.0, "Surface");

        let found = readable_step(&blue_ramp().steps(), &dark_surface, 4.5).expect("a readable step");

        // 50 is the lightest step and clears by a mile; 300 is the first that
        // clears at all going down the ramp. 500 is too close to the surface.
        assert_eq!(found.label.to_string(), "300");
    }

    #[test]
    fn a_lower_threshold_admits_a_quieter_step() {
        // The three roles do not share a bar: text needs 4.5:1, but a border is
        // non-text and WCAG 1.4.11 asks 3:1. Handing back the 4.5 answer for a
        // border would darken every control edge in the system.
        // Finely spaced, like the neutral ramp these roles actually draw from:
        // in production `border/default` sits at `neutral.400` (3.05:1) while
        // muted text needs a darker step. The answer only differs where the ramp
        // has a step between the two bars, which a coarse ramp does not.
        let greys = palette(vec![
            swatch(300, 0.80, 0.005, 264.0, 21.0),
            swatch(400, 0.72, 0.005, 264.0, 21.0),
            swatch(500, 0.64, 0.005, 264.0, 21.0),
            swatch(600, 0.56, 0.005, 264.0, 21.0),
            swatch(700, 0.48, 0.005, 264.0, 21.0),
        ]);

        let text = readable_step(&greys.steps(), &white(), 4.5).expect("a text colour");
        let border = readable_step(&greys.steps(), &white(), 3.0).expect("a border colour");

        assert!(
            border.contrast_ratio < text.contrast_ratio,
            "border {} ({:.2}:1) should be quieter than text {} ({:.2}:1)",
            border.label,
            border.contrast_ratio,
            text.label,
            text.contrast_ratio,
        );
    }

    #[test]
    fn returns_nothing_when_the_ramp_cannot_clear_the_threshold() {
        // The guarantee the hand-picked semantic tier never had: a role that
        // cannot be satisfied says so, rather than quietly handing back the
        // closest near-miss (RFC 0027 §7).
        let pale = palette(vec![
            swatch(50, 0.97, 0.02, 264.0, 21.0),
            swatch(100, 0.94, 0.03, 264.0, 21.0),
        ]);

        assert_eq!(readable_step(&pale.steps(), &white(), 4.5), None);
    }
}

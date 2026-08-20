use super::ramp::assess;
use super::ramp_fixtures::{palette, swatch};
use crate::color::gamut::Gamut;

mod steps {
    use super::*;

    #[test]
    fn reports_one_step_per_swatch_in_ramp_order() {
        let p = palette(vec![
            swatch(50, 0.97, 0.02, 200.0, 12.0),
            swatch(500, 0.55, 0.12, 200.0, 7.0),
            swatch(900, 0.15, 0.06, 200.0, 15.0),
        ]);

        let quality = assess(&p, Gamut::Srgb);

        let labels: Vec<String> = quality.steps.iter().map(|s| s.label.to_string()).collect();
        assert_eq!(labels, vec!["50", "500", "900"]);
    }

    #[test]
    fn echoes_back_the_gamut_it_was_judged_against() {
        // A quality report is meaningless without saying which gamut produced
        // it — the same hue that mutes badly in sRGB may be comfortable in
        // Display-P3 (RFC 0027 §3).
        let p = palette(vec![swatch(500, 0.55, 0.12, 200.0, 7.0)]);

        let quality = assess(&p, Gamut::DisplayP3);

        assert_eq!(quality.gamut, Gamut::DisplayP3);
    }
}

mod chroma_utilisation {
    use super::*;
    use crate::color::gamut::max_in_gamut_chroma;

    #[test]
    fn a_step_riding_the_boundary_uses_all_the_available_chroma() {
        let boundary = max_in_gamut_chroma(0.55, 200.0, Gamut::Srgb);
        let p = palette(vec![swatch(500, 0.55, boundary, 200.0, 7.0)]);

        let quality = assess(&p, Gamut::Srgb);

        assert_eq!(quality.steps[0].chroma_utilisation, Some(1.0));
    }

    #[test]
    fn a_step_at_half_the_boundary_uses_half_of_it() {
        let boundary = max_in_gamut_chroma(0.55, 200.0, Gamut::Srgb);
        let p = palette(vec![swatch(500, 0.55, boundary / 2.0, 200.0, 7.0)]);

        let quality = assess(&p, Gamut::Srgb);

        assert_eq!(quality.steps[0].chroma_utilisation, Some(0.5));
    }

    #[test]
    fn a_grey_step_leaves_all_the_available_chroma_on_the_table() {
        // The defence against reading the hue metrics backwards: a grey ramp
        // holds hue perfectly, and utilisation is the only metric that says it
        // is grey (RFC 0027 §2).
        let p = palette(vec![swatch(500, 0.55, 0.0, 200.0, 7.0)]);

        let quality = assess(&p, Gamut::Srgb);

        assert_eq!(quality.steps[0].chroma_utilisation, Some(0.0));
    }

    #[test]
    fn the_wider_p3_boundary_lowers_the_same_step_s_utilisation() {
        // Absolute, not relative: the step is unchanged, the gamut is wider, so
        // it is using less of what is on offer (RFC 0027 D2).
        let p = palette(vec![swatch(500, 0.65, 0.15, 142.0, 7.0)]);

        let srgb = assess(&p, Gamut::Srgb).steps[0].chroma_utilisation;
        let p3 = assess(&p, Gamut::DisplayP3).steps[0].chroma_utilisation;

        assert!(p3 < srgb, "expected P3 {p3:?} < sRGB {srgb:?}");
    }
}

mod undefined_utilisation {
    use super::*;

    #[test]
    fn a_step_where_the_gamut_permits_no_chroma_has_no_utilisation() {
        // Pure white admits no chroma at all in Display-P3, so "what fraction of
        // the available chroma is this using?" has no answer — reporting 0.0
        // would read as "this step is grey when it could be colourful", and 1.0
        // as "it is riding the boundary". Both are lies.
        let p = palette(vec![swatch(900, 1.0, 0.0, 200.0, 21.0)]);

        let quality = assess(&p, Gamut::DisplayP3);

        assert_eq!(quality.steps[0].chroma_utilisation, None);
    }
}

mod delta_l {
    use super::*;

    /// Asserts a metric is within float-comparison distance of `expected`.
    fn assert_close(actual: Option<f32>, expected: f32) {
        let actual = actual.expect("expected a measured value");
        assert!(
            (actual - expected).abs() < 1e-6,
            "expected {expected}, got {actual}",
        );
    }

    #[test]
    fn the_first_step_has_no_previous_step_to_measure_against() {
        let p = palette(vec![
            swatch(50, 0.97, 0.02, 200.0, 12.0),
            swatch(100, 0.91, 0.05, 200.0, 11.0),
        ]);

        let quality = assess(&p, Gamut::Srgb);

        assert_eq!(quality.steps[0].delta_l, None);
    }

    #[test]
    fn each_later_step_measures_its_distance_from_the_one_before() {
        let p = palette(vec![
            swatch(50, 0.97, 0.02, 200.0, 12.0),
            swatch(100, 0.91, 0.05, 200.0, 11.0),
        ]);

        let quality = assess(&p, Gamut::Srgb);

        assert_close(quality.steps[1].delta_l, 0.06);
    }

    #[test]
    fn a_dark_ramp_climbing_in_lightness_reports_a_positive_distance() {
        // Absolute, not signed: a dark palette runs the other way, and a signed
        // delta reported every healthy dark step as a defect (RFC 0027 §2).
        let p = palette(vec![
            swatch(50, 0.21, 0.02, 200.0, 12.0),
            swatch(100, 0.25, 0.05, 200.0, 11.0),
        ]);

        let quality = assess(&p, Gamut::Srgb);

        assert_close(quality.steps[1].delta_l, 0.04);
    }
}

mod hue_error {
    use super::*;

    #[test]
    fn a_step_the_gamut_cannot_render_reports_the_hue_it_was_pushed_to() {
        // A saturated light yellow sits well outside sRGB. Gamut mapping moves
        // it, and the gap between intended and rendered is what localises the
        // fault to the mapping rather than to the ramp definition (RFC 0027 D3).
        let p = palette(vec![swatch(100, 0.95, 0.25, 100.0, 12.0)]);

        let quality = assess(&p, Gamut::Srgb);

        let error = quality.steps[0].hue_error;
        assert!(error > 1.0, "expected a measurable hue error, got {error}");
    }

    #[test]
    fn measures_the_short_way_round_when_the_rendered_hue_crosses_above_zero() {
        // Intended 359.5°, rendered ~6.5°. Subtracting gives 353°, which would
        // report a ramp that barely moved as one that swung nearly full circle.
        let p = palette(vec![swatch(500, 0.5, 0.30, 359.5, 7.0)]);

        let quality = assess(&p, Gamut::Srgb);

        let error = quality.steps[0].hue_error;
        assert!(error < 10.0, "expected the short way round, got {error}");
    }

    #[test]
    fn measures_the_short_way_round_when_the_rendered_hue_crosses_below_zero() {
        // The mirror case: intended 1.0°, rendered ~345°. The naive difference
        // is 344°; the real distance is ~16°.
        let p = palette(vec![swatch(500, 0.9, 0.20, 1.0, 7.0)]);

        let quality = assess(&p, Gamut::Srgb);

        let error = quality.steps[0].hue_error;
        assert!(error < 20.0, "expected the short way round, got {error}");
    }
}

mod hue_span {
    use super::*;

    #[test]
    fn the_intended_span_is_zero_for_a_ramp_that_holds_one_hue() {
        // What the engine does by construction — stated so the rendered span
        // below has a control to be read against.
        let p = palette(vec![
            swatch(300, 0.75, 0.15, 200.0, 9.0),
            swatch(500, 0.55, 0.12, 200.0, 7.0),
            swatch(700, 0.35, 0.10, 200.0, 11.0),
        ]);

        let quality = assess(&p, Gamut::Srgb);

        assert_eq!(quality.hue_span_intended, Some(0.0));
    }

    #[test]
    fn the_intended_span_is_the_spread_when_the_steps_disagree() {
        let p = palette(vec![
            swatch(300, 0.75, 0.15, 200.0, 9.0),
            swatch(500, 0.55, 0.12, 205.0, 7.0),
            swatch(700, 0.35, 0.10, 210.0, 11.0),
        ]);

        let quality = assess(&p, Gamut::Srgb);

        let span = quality.hue_span_intended.expect("three chromatic steps");
        assert!((span - 10.0).abs() < 1e-4, "expected 10 degrees, got {span}");
    }

    #[test]
    fn the_rendered_span_opens_up_where_the_intended_one_stayed_shut() {
        // The whole point of measuring twice: this ramp's definition is
        // flawless and what a browser paints is not (RFC 0027 §2).
        let p = palette(vec![
            swatch(300, 0.75, 0.15, 200.0, 9.0),
            swatch(500, 0.55, 0.12, 200.0, 7.0),
            swatch(700, 0.35, 0.10, 200.0, 11.0),
        ]);

        let quality = assess(&p, Gamut::Srgb);

        let rendered = quality.hue_span_rendered.expect("three chromatic steps");
        assert_eq!(quality.hue_span_intended, Some(0.0));
        assert!(rendered > 0.0, "expected drift after quantisation, got {rendered}");
    }

    #[test]
    fn near_grey_steps_are_excluded_because_they_can_report_any_hue_at_all() {
        // A step with almost no chroma carries no meaningful hue, so including
        // it measures quantisation noise rather than the ramp.
        let p = palette(vec![
            swatch(50, 0.97, 0.005, 30.0, 12.0),
            swatch(500, 0.55, 0.12, 200.0, 7.0),
            swatch(700, 0.35, 0.10, 200.0, 11.0),
        ]);

        let quality = assess(&p, Gamut::Srgb);

        assert_eq!(quality.hue_span_intended, Some(0.0));
    }

    #[test]
    fn a_grey_ramp_has_no_measurable_hue_span_at_all() {
        // The trap this whole RFC exists to avoid: a grey ramp holds hue
        // perfectly, so reporting 0.0 here would score it as the best ramp in
        // the system (RFC 0027 §2, D3).
        let p = palette(vec![
            swatch(300, 0.75, 0.0, 200.0, 9.0),
            swatch(500, 0.55, 0.0, 200.0, 7.0),
        ]);

        let quality = assess(&p, Gamut::Srgb);

        assert_eq!(quality.hue_span_intended, None);
        assert_eq!(quality.hue_span_rendered, None);
    }
}

mod hue_span_across_the_seam {
    use super::*;

    #[test]
    fn the_intended_span_measures_the_short_arc_around_zero() {
        // 358° and 3° are five degrees apart. Subtracting the extremes reports
        // 355 — a tight red ramp scored as one that swung nearly full circle.
        let p = palette(vec![
            swatch(400, 0.55, 0.10, 358.0, 8.0),
            swatch(600, 0.45, 0.10, 3.0, 9.0),
        ]);

        let quality = assess(&p, Gamut::Srgb);

        let span = quality.hue_span_intended.expect("two chromatic steps");
        assert!((span - 5.0).abs() < 1e-4, "expected 5 degrees, got {span}");
    }

    #[test]
    fn the_rendered_span_measures_the_short_arc_around_the_half_turn() {
        // The rendered hue arrives normalised to -180..180, which moves the seam
        // from 0 to 180 rather than removing it — a cyan ramp either side of the
        // half turn reads as a 355 degree swing. Handling the wrap once, on
        // hues normalised to 0..360, covers both seams for good.
        let p = palette(vec![
            swatch(300, 0.75, 0.08, 177.0, 10.0),
            swatch(400, 0.65, 0.10, 178.0, 8.0),
            swatch(600, 0.55, 0.10, 183.0, 9.0),
            swatch(700, 0.45, 0.09, 184.0, 11.0),
        ]);

        let quality = assess(&p, Gamut::Srgb);

        let span = quality.hue_span_rendered.expect("four chromatic steps");
        assert!(span < 15.0, "expected the short arc, got {span}");
    }
}

mod min_delta_l {
    use super::*;

    #[test]
    fn reports_the_tightest_gap_anywhere_in_the_ramp() {
        // The headline number for "are these steps distinguishable as
        // surfaces?" — one collapsed pair is a defect however healthy the rest
        // of the ramp is, so it is a minimum rather than a mean.
        let p = palette(vec![
            swatch(50, 0.97, 0.02, 200.0, 12.0),
            swatch(100, 0.91, 0.05, 200.0, 11.0),
            swatch(200, 0.89, 0.08, 200.0, 10.0),
        ]);

        let quality = assess(&p, Gamut::Srgb);

        let min = quality.min_delta_l.expect("two gaps to choose between");
        assert!((min - 0.02).abs() < 1e-6, "expected 0.02, got {min}");
    }

    #[test]
    fn a_single_step_ramp_has_no_gap_to_measure() {
        let p = palette(vec![swatch(500, 0.55, 0.12, 200.0, 7.0)]);

        let quality = assess(&p, Gamut::Srgb);

        assert_eq!(quality.min_delta_l, None);
    }
}

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

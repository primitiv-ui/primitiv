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

use super::gamut::*;

mod max_chroma {
    use super::*;

    #[test]
    fn srgb_returns_a_sensible_in_range_boundary() {
        // A mid-lightness green: in gamut at low chroma, out beyond the boundary,
        // which must land strictly inside the search window (0, 0.4).
        let boundary = max_in_gamut_chroma(0.65, 142.0, Gamut::Srgb);
        assert!(boundary > 0.0 && boundary < 0.4, "boundary: {boundary}");
    }

    #[test]
    fn near_black_chroma_collapses_toward_the_black_point() {
        // The gamut tapers to a point at black, so max in-gamut chroma at a
        // near-black lightness is a sliver — far below the hue's mid-lightness
        // peak. An over-generous gamut epsilon used to admit out-of-gamut darks
        // here (their tiny linear channels sit within an absolute tolerance),
        // spiking the picker's Hue-chart boundary near the bottom edge for the
        // cyan/teal hues (RFC 0010 §10).
        let near_black = max_in_gamut_chroma(0.05, 180.0, Gamut::Srgb);
        let peak = max_in_gamut_chroma(0.85, 180.0, Gamut::Srgb);
        assert!(near_black < 0.05, "near-black chroma {near_black} should be a sliver");
        assert!(
            near_black < peak / 3.0,
            "near-black {near_black} should sit far below the peak {peak}",
        );
    }

    #[test]
    fn returns_zero_when_hue_is_nan() {
        // Every channel comparison is false against a NaN-poisoned conversion,
        // so the search's "out of gamut" branch runs on every iteration and `lo`
        // never advances past its 0.0 starting point. The palette generator
        // depends on this: a NaN hue caps every step's chroma to nothing rather
        // than propagating a NaN width.
        let result = max_in_gamut_chroma(0.5, f32::NAN, Gamut::Srgb);

        assert_eq!(result, 0.0);
    }

    #[test]
    fn display_p3_extends_the_srgb_boundary_for_a_saturated_green() {
        // Display-P3's wider primaries admit more chroma than sRGB at the same
        // lightness and hue — the whole point of the wide-gamut mode.
        let srgb = max_in_gamut_chroma(0.65, 142.0, Gamut::Srgb);
        let p3 = max_in_gamut_chroma(0.65, 142.0, Gamut::DisplayP3);
        assert!(p3 > srgb, "expected P3 {p3} > sRGB {srgb}");
    }
}

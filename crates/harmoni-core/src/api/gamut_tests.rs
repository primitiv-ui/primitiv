use super::gamut::*;
use crate::color::output::oklch_to_rgb;
use crate::color::p3::oklch_to_p3_rgb;
use palette::Oklch;

/// Mirrors the private `to_byte` quantisation so expectations stay independent.
fn to_byte(channel: f32) -> u8 {
    (channel * 255.0).round() as u8
}

/// Counts the opaque (alpha 255) pixels in a flat RGBA buffer.
fn opaque_pixels(buffer: &[u8]) -> usize {
    buffer.chunks_exact(4).filter(|px| px[3] == 255).count()
}

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
    fn display_p3_extends_the_srgb_boundary_for_a_saturated_green() {
        // Display-P3's wider primaries admit more chroma than sRGB at the same
        // lightness and hue — the whole point of the wide-gamut mode.
        let srgb = max_in_gamut_chroma(0.65, 142.0, Gamut::Srgb);
        let p3 = max_in_gamut_chroma(0.65, 142.0, Gamut::DisplayP3);
        assert!(p3 > srgb, "expected P3 {p3} > sRGB {srgb}");
    }
}

mod hue_strip {
    use super::*;

    #[test]
    fn buffer_is_four_bytes_per_pixel() {
        let strip = paint_hue_strip(0.6, 0.05, 4, Gamut::Srgb);
        assert_eq!(strip.len(), 4 * 4);
    }

    #[test]
    fn in_gamut_pixels_carry_their_srgb_colour_at_full_alpha() {
        let width = 4;
        let (l, c) = (0.7, 0.03); // low chroma → in gamut at every hue
        let strip = paint_hue_strip(l, c, width, Gamut::Srgb);

        let px = 1;
        let hue = (px as f32 + 0.5) / width as f32 * 360.0;
        let rgb = oklch_to_rgb(Oklch::new(l, c, hue));
        let i = px * 4;
        assert_eq!(strip[i], to_byte(rgb.r));
        assert_eq!(strip[i + 1], to_byte(rgb.g));
        assert_eq!(strip[i + 2], to_byte(rgb.b));
        assert_eq!(strip[i + 3], 255);
    }

    #[test]
    fn out_of_gamut_pixels_are_transparent() {
        // Chroma 0.5 exceeds the sRGB gamut at every hue (the boundary search
        // is capped at 0.4), so the whole strip is transparent.
        let strip = paint_hue_strip(0.7, 0.5, 4, Gamut::Srgb);
        assert!(strip.iter().all(|&b| b == 0));
    }

    #[test]
    fn display_p3_keeps_more_hues_in_gamut_than_srgb() {
        // A chroma that overflows sRGB across part of the spectrum but stays
        // within P3 there: the P3 strip is opaque at strictly more hues.
        let (l, c, width) = (0.65, 0.2, 64);
        let srgb = paint_hue_strip(l, c, width, Gamut::Srgb);
        let p3 = paint_hue_strip(l, c, width, Gamut::DisplayP3);
        assert!(
            opaque_pixels(&p3) > opaque_pixels(&srgb),
            "P3 opaque {} should exceed sRGB opaque {}",
            opaque_pixels(&p3),
            opaque_pixels(&srgb),
        );
    }

    #[test]
    fn display_p3_pixels_carry_their_p3_colour() {
        // An in-both-gamuts chromatic colour: the P3 strip blits Display-P3
        // coordinates, not sRGB ones, for the picker's display-p3 canvas.
        let (l, c, width) = (0.65, 0.05, 4);
        let strip = paint_hue_strip(l, c, width, Gamut::DisplayP3);
        let px = 1;
        let hue = (px as f32 + 0.5) / width as f32 * 360.0;
        let rgb = oklch_to_p3_rgb(Oklch::new(l, c, hue));
        let i = px * 4;
        assert_eq!(strip[i], to_byte(rgb.r));
        assert_eq!(strip[i + 1], to_byte(rgb.g));
        assert_eq!(strip[i + 2], to_byte(rgb.b));
        assert_eq!(strip[i + 3], 255);
    }
}

mod lightness_strip {
    use super::*;

    #[test]
    fn buffer_is_four_bytes_per_pixel() {
        let strip = paint_lightness_strip(0.05, 240.0, 4, Gamut::Srgb);
        assert_eq!(strip.len(), 4 * 4);
    }

    #[test]
    fn in_gamut_pixels_carry_their_colour_at_full_alpha() {
        // Low chroma → in gamut across the lightness sweep; a mid column should
        // carry the colour for its lightness at the fixed (c, h).
        let (c, h, width) = (0.03, 240.0, 8);
        let strip = paint_lightness_strip(c, h, width, Gamut::Srgb);
        let px = 4;
        let l = (px as f32 + 0.5) / width as f32;
        let rgb = oklch_to_rgb(Oklch::new(l, c, h));
        let i = px * 4;
        assert_eq!(strip[i], to_byte(rgb.r));
        assert_eq!(strip[i + 1], to_byte(rgb.g));
        assert_eq!(strip[i + 2], to_byte(rgb.b));
        assert_eq!(strip[i + 3], 255);
    }

    #[test]
    fn out_of_gamut_pixels_are_transparent() {
        // Chroma 0.5 exceeds the boundary (capped at 0.4) at every lightness.
        let strip = paint_lightness_strip(0.5, 240.0, 4, Gamut::Srgb);
        assert!(strip.iter().all(|&b| b == 0));
    }

    #[test]
    fn display_p3_keeps_more_lightnesses_in_gamut_than_srgb() {
        let (c, h, width) = (0.2, 142.0, 64);
        let srgb = paint_lightness_strip(c, h, width, Gamut::Srgb);
        let p3 = paint_lightness_strip(c, h, width, Gamut::DisplayP3);
        assert!(
            opaque_pixels(&p3) > opaque_pixels(&srgb),
            "P3 opaque {} should exceed sRGB opaque {}",
            opaque_pixels(&p3),
            opaque_pixels(&srgb),
        );
    }
}

mod lc_plane {
    use super::*;

    #[test]
    fn buffer_is_four_bytes_per_pixel() {
        let plane = paint_lc_plane(240.0, 4, 4, 0.4, Gamut::Srgb);
        assert_eq!(plane.len(), 4 * 4 * 4);
    }

    #[test]
    fn in_gamut_pixels_carry_their_srgb_colour_at_full_alpha() {
        // c_max = 0 → every pixel is a grey (chroma 0), always in gamut.
        let (width, height, hue) = (4usize, 4usize, 240.0);
        let plane = paint_lc_plane(hue, width, height, 0.0, Gamut::Srgb);

        for (idx, alpha) in plane.iter().skip(3).step_by(4).enumerate() {
            assert_eq!(*alpha, 255, "pixel {idx} should be opaque");
        }

        let (px, py) = (2usize, 1usize);
        let l = (px as f32 + 0.5) / width as f32;
        let rgb = oklch_to_rgb(Oklch::new(l, 0.0, hue));
        let i = (py * width + px) * 4;
        assert_eq!(plane[i], to_byte(rgb.r));
        assert_eq!(plane[i + 1], to_byte(rgb.g));
        assert_eq!(plane[i + 2], to_byte(rgb.b));
    }

    #[test]
    fn out_of_gamut_pixels_are_transparent() {
        // Top row of the lightest column: high chroma against a near-white
        // lightness is far outside sRGB, so that pixel must be transparent.
        let (width, height) = (4usize, 4usize);
        let plane = paint_lc_plane(240.0, width, height, 0.4, Gamut::Srgb);
        let (px, py) = (width - 1, 0usize);
        let i = (py * width + px) * 4;
        assert_eq!(plane[i], 0);
        assert_eq!(plane[i + 1], 0);
        assert_eq!(plane[i + 2], 0);
        assert_eq!(plane[i + 3], 0);
    }

    #[test]
    fn display_p3_paints_more_of_the_plane_than_srgb() {
        // The wider P3 boundary admits chroma rows sRGB leaves transparent, so
        // the P3 plane has strictly more opaque pixels at a saturated hue.
        let (width, height) = (32usize, 32usize);
        let srgb = paint_lc_plane(142.0, width, height, 0.4, Gamut::Srgb);
        let p3 = paint_lc_plane(142.0, width, height, 0.4, Gamut::DisplayP3);
        assert!(
            opaque_pixels(&p3) > opaque_pixels(&srgb),
            "P3 opaque {} should exceed sRGB opaque {}",
            opaque_pixels(&p3),
            opaque_pixels(&srgb),
        );
    }

    #[test]
    fn display_p3_pixels_carry_their_p3_colour() {
        // c_max = 0 → grey pixels in gamut everywhere; the P3 plane blits
        // Display-P3 coordinates for them.
        let (width, height, hue) = (4usize, 4usize, 240.0);
        let plane = paint_lc_plane(hue, width, height, 0.0, Gamut::DisplayP3);
        let (px, py) = (2usize, 1usize);
        let l = (px as f32 + 0.5) / width as f32;
        let rgb = oklch_to_p3_rgb(Oklch::new(l, 0.0, hue));
        let i = (py * width + px) * 4;
        assert_eq!(plane[i], to_byte(rgb.r));
        assert_eq!(plane[i + 1], to_byte(rgb.g));
        assert_eq!(plane[i + 2], to_byte(rgb.b));
    }
}

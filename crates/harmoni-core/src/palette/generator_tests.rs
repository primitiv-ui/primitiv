use crate::palette::generator::SwatchLabel;
use crate::palette::generator::*;
use palette::Oklch;

#[cfg(test)]
mod generator_tests {
    use super::*;

    mod palette_generation {
        use super::*;

        #[test]
        fn should_preserve_the_base_500_color_that_was_passed_in() {
            // Arrange
            let base_500 = Oklch::new(0.55, 0.15, 240.0);
            let result = generate_palette(base_500, 0.0, 0.0);

            // Assert
            let base_500_step = &result.swatches[5];
            assert_eq!(base_500.l, base_500_step.l);
            assert_eq!(base_500.chroma, base_500_step.c);
            assert_eq!(base_500.hue.into_degrees(), base_500_step.h);
        }
    }

    mod dark_palette_generation {
        use super::*;

        #[test]
        fn dark_palette_for_a_pale_brand_has_reliably_dark_backgrounds_and_light_text() {
            // A pale brand (L≈0.9) under the light offset model would yield
            // "dark" backgrounds that aren't actually dark. The anchored dark
            // model pins step 50 to an absolute dark target and step 900 to an
            // absolute light target, independent of how pale the brand is.
            let pale_brand = Oklch::new(0.9, 0.1, 240.0);
            let palette =
                generate_dark_palette(pale_brand, &TARGET_LIGHTNESS_DARK, 0.0, 0.0, None, None);

            assert_eq!(palette.swatches.len(), 10);

            let step_50 = palette
                .swatches
                .iter()
                .find(|s| s.label == SwatchLabel::Number(50))
                .unwrap();
            let step_900 = palette
                .swatches
                .iter()
                .find(|s| s.label == SwatchLabel::Number(900))
                .unwrap();

            assert!(
                step_50.l <= 0.30,
                "step 50 should be reliably dark, got {}",
                step_50.l
            );
            assert!(
                step_900.l >= 0.88,
                "step 900 should be reliably light, got {}",
                step_900.l
            );
            assert!(step_50.l < step_900.l);
        }

        #[test]
        fn dark_palette_preserves_the_brand_color_exactly_at_step_500() {
            // The two-segment model lands step 500 at the brand's lightness,
            // but only an explicit passthrough keeps its chroma and hue byte-
            // identical instead of routing chroma through the gamut formula.
            let brand = Oklch::new(0.55, 0.15, 240.0);
            let palette =
                generate_dark_palette(brand, &TARGET_LIGHTNESS_DARK, 0.0, 0.0, None, None);

            let step_500 = &palette.swatches[5];
            assert_eq!(step_500.label, SwatchLabel::Number(500));
            assert_eq!(step_500.l, brand.l);
            assert_eq!(step_500.c, brand.chroma);
            assert_eq!(step_500.h, brand.hue.into_degrees());
        }

        #[test]
        fn dark_palette_light_padding_reshapes_the_steps_between_the_anchors() {
            // Light padding feeds into dark generation: it pads the curve
            // before the anchored model runs, reshaping the steps between the
            // fixed 50/500/900 anchors.
            let brand = Oklch::new(0.55, 0.15, 240.0);
            let unpadded =
                generate_dark_palette(brand, &TARGET_LIGHTNESS_DARK, 0.0, 0.0, None, None);
            let padded =
                generate_dark_palette(brand, &TARGET_LIGHTNESS_DARK, 0.2, 0.0, None, None);

            let step_100 = |p: &Palette| {
                p.swatches
                    .iter()
                    .find(|s| s.label == SwatchLabel::Number(100))
                    .unwrap()
                    .l
            };

            assert_ne!(step_100(&unpadded), step_100(&padded));
        }
    }

    mod swatch_label {
        use super::*;

        #[test]
        fn should_create_label_from_str() {
            let label: SwatchLabel = "White".into();
            assert_eq!(label, SwatchLabel::Name(String::from("White")));
        }
    }

    mod max_chroma_hue_coverage {
        use super::*;

        #[test]
        fn should_generate_palette_for_purple_hue() {
            // Hue 280 covers the 256..=295 range
            let base = Oklch::new(0.55, 0.15, 280.0);
            let result = generate_palette(base, 0.0, 0.0);
            assert_eq!(result.swatches.len(), 10);
        }

        #[test]
        fn should_generate_palette_for_magenta_hue() {
            // Hue 310 covers the 296..=329 range
            let base = Oklch::new(0.55, 0.15, 310.0);
            let result = generate_palette(base, 0.0, 0.0);
            assert_eq!(result.swatches.len(), 10);
        }

        #[test]
        fn should_generate_palette_for_edge_case_hue() {
            // Hue 361+ wraps via rem_euclid — after % 360 it becomes 1,
            // which lands in 0..=30. Use a negative hue to exercise the
            // _ fallback (unreachable in practice due to rem_euclid 0..=360,
            // but we can test with hue 360 exactly which matches 0..=30|330..=360).
            // Actually the _ arm is unreachable since hue ranges 0..=360 are
            // fully covered. Let's just verify wrapping works.
            let base = Oklch::new(0.55, 0.15, 720.0);
            let result = generate_palette(base, 0.0, 0.0);
            assert_eq!(result.swatches.len(), 10);
        }
    }

    mod light_padding {
        use super::*;

        #[test]
        fn should_make_light_end_of_scale_lighter_with_positive_light_padding() {
            // Arrange
            let base_500 = Oklch::new(0.55, 0.0, 0.0);
            let positive_light_padding = 0.06;
            let palette_with_no_padding = generate_palette_with_scale(
                base_500,
                &TARGET_LIGHTNESS,
                &TARGET_CHROMA_SCALE,
                0.0,
                0.0,
                None,
                None,
            );
            let step_50_no_padding_lightness = palette_with_no_padding
                .swatches.iter()
                .find(|step| step.label == SwatchLabel::Number(50))
                .unwrap()
                .l;
            let step_100_no_padding_lightness = palette_with_no_padding
                .swatches.iter()
                .find(|step| step.label == SwatchLabel::Number(100))
                .unwrap()
                .l;
            let step_200_no_padding_lightness = palette_with_no_padding
                .swatches.iter()
                .find(|step| step.label == SwatchLabel::Number(200))
                .unwrap()
                .l;
            let step_300_no_padding_lightness = palette_with_no_padding
                .swatches.iter()
                .find(|step| step.label == SwatchLabel::Number(300))
                .unwrap()
                .l;
            let palette_with_padding = generate_palette_with_scale(
                base_500,
                &TARGET_LIGHTNESS,
                &TARGET_CHROMA_SCALE,
                positive_light_padding,
                0.0,
                None,
                None,
            );
            let step_50_with_padding_lightness = palette_with_padding
                .swatches.iter()
                .find(|step| step.label == SwatchLabel::Number(50))
                .unwrap()
                .l;
            let step_100_with_padding_lightness = palette_with_padding
                .swatches.iter()
                .find(|step| step.label == SwatchLabel::Number(100))
                .unwrap()
                .l;
            let step_200_with_padding_lightness = palette_with_padding
                .swatches.iter()
                .find(|step| step.label == SwatchLabel::Number(200))
                .unwrap()
                .l;
            let step_300_with_padding_lightness = palette_with_padding
                .swatches.iter()
                .find(|step| step.label == SwatchLabel::Number(300))
                .unwrap()
                .l;

            // Assert
            assert!(step_50_with_padding_lightness > step_50_no_padding_lightness);
            assert!(step_100_with_padding_lightness > step_100_no_padding_lightness);
            assert!(step_200_with_padding_lightness > step_200_no_padding_lightness);
            assert!(step_300_with_padding_lightness > step_300_no_padding_lightness);
        }

        #[test]
        fn should_make_light_end_of_scale_darker_with_negative_light_padding() {
            // Arrange
            let base_500 = Oklch::new(0.55, 0.0, 0.0);
            let negative_light_padding = -0.06;
            let palette_with_no_padding = generate_palette_with_scale(
                base_500,
                &TARGET_LIGHTNESS,
                &TARGET_CHROMA_SCALE,
                0.0,
                0.0,
                None,
                None,
            );
            let step_50_no_padding_lightness = palette_with_no_padding
                .swatches.iter()
                .find(|step| step.label == SwatchLabel::Number(50))
                .unwrap()
                .l;
            let step_100_no_padding_lightness = palette_with_no_padding
                .swatches.iter()
                .find(|step| step.label == SwatchLabel::Number(100))
                .unwrap()
                .l;
            let step_200_no_padding_lightness = palette_with_no_padding
                .swatches.iter()
                .find(|step| step.label == SwatchLabel::Number(200))
                .unwrap()
                .l;
            let step_300_no_padding_lightness = palette_with_no_padding
                .swatches.iter()
                .find(|step| step.label == SwatchLabel::Number(300))
                .unwrap()
                .l;
            let palette_with_padding = generate_palette_with_scale(
                base_500,
                &TARGET_LIGHTNESS,
                &TARGET_CHROMA_SCALE,
                negative_light_padding,
                0.0,
                None,
                None,
            );
            let step_50_with_padding_lightness = palette_with_padding
                .swatches.iter()
                .find(|step| step.label == SwatchLabel::Number(50))
                .unwrap()
                .l;
            let step_100_with_padding_lightness = palette_with_padding
                .swatches.iter()
                .find(|step| step.label == SwatchLabel::Number(100))
                .unwrap()
                .l;
            let step_200_with_padding_lightness = palette_with_padding
                .swatches.iter()
                .find(|step| step.label == SwatchLabel::Number(200))
                .unwrap()
                .l;
            let step_300_with_padding_lightness = palette_with_padding
                .swatches.iter()
                .find(|step| step.label == SwatchLabel::Number(300))
                .unwrap()
                .l;

            // Assert
            assert!(step_50_with_padding_lightness < step_50_no_padding_lightness);
            assert!(step_100_with_padding_lightness < step_100_no_padding_lightness);
            assert!(step_200_with_padding_lightness < step_200_no_padding_lightness);
            assert!(step_300_with_padding_lightness < step_300_no_padding_lightness);
        }
    }

    mod dark_padding {
        use super::*;

        #[test]
        fn should_make_dark_end_of_scale_darker_with_positive_dark_padding() {
            let base_500 = Oklch::new(0.55, 0.0, 0.0);
            let positive_dark_padding = 0.06;

            let no_padding = generate_palette_with_scale(
                base_500,
                &TARGET_LIGHTNESS,
                &TARGET_CHROMA_SCALE,
                0.0,
                0.0,
                None,
                None,
            );
            let step_800_no = no_padding
                .swatches.iter()
                .find(|s| s.label == SwatchLabel::Number(800))
                .unwrap()
                .l;
            let step_900_no = no_padding
                .swatches.iter()
                .find(|s| s.label == SwatchLabel::Number(900))
                .unwrap()
                .l;

            let with_padding = generate_palette_with_scale(
                base_500,
                &TARGET_LIGHTNESS,
                &TARGET_CHROMA_SCALE,
                0.0,
                positive_dark_padding,
                None,
                None,
            );
            let step_800_with = with_padding
                .swatches.iter()
                .find(|s| s.label == SwatchLabel::Number(800))
                .unwrap()
                .l;
            let step_900_with = with_padding
                .swatches.iter()
                .find(|s| s.label == SwatchLabel::Number(900))
                .unwrap()
                .l;

            assert!(step_800_with < step_800_no);
            assert!(step_900_with < step_900_no);
        }

        #[test]
        fn should_make_dark_end_of_scale_lighter_with_negative_dark_padding() {
            let base_500 = Oklch::new(0.55, 0.0, 0.0);
            let negative_dark_padding = -0.06;

            let no_padding = generate_palette_with_scale(
                base_500,
                &TARGET_LIGHTNESS,
                &TARGET_CHROMA_SCALE,
                0.0,
                0.0,
                None,
                None,
            );
            let step_800_no = no_padding
                .swatches.iter()
                .find(|s| s.label == SwatchLabel::Number(800))
                .unwrap()
                .l;
            let step_900_no = no_padding
                .swatches.iter()
                .find(|s| s.label == SwatchLabel::Number(900))
                .unwrap()
                .l;

            let with_padding = generate_palette_with_scale(
                base_500,
                &TARGET_LIGHTNESS,
                &TARGET_CHROMA_SCALE,
                0.0,
                negative_dark_padding,
                None,
                None,
            );
            let step_800_with = with_padding
                .swatches.iter()
                .find(|s| s.label == SwatchLabel::Number(800))
                .unwrap()
                .l;
            let step_900_with = with_padding
                .swatches.iter()
                .find(|s| s.label == SwatchLabel::Number(900))
                .unwrap()
                .l;

            assert!(step_800_with > step_800_no);
            assert!(step_900_with > step_900_no);
        }
    }

    mod metadata_tests {
    use super::*;

    #[test]
    fn every_palette_swatch_contains_metadata() {
        let base = Oklch::new(0.55, 0.18, 260.0); // blue-ish

        let palette = generate_palette_with_scale(
            base,
            &TARGET_LIGHTNESS,
            &TARGET_CHROMA_SCALE,
            0.0,
            0.0,
            None,
            None,
        );

        assert!(!palette.swatches.is_empty());

        assert!(palette.max_recommended_light_padding > 0.0);
        assert!(palette.max_recommended_dark_padding > 0.0);
    }

    #[test]
    fn metadata_limits_vary_by_hue() {
        let yellow = Oklch::new(0.55, 0.18, 80.0);   // yellow – more constrained
        let blue   = Oklch::new(0.55, 0.18, 260.0);  // blue   – more headroom

        let yellow_palette = generate_palette_with_scale(yellow, &TARGET_LIGHTNESS, &TARGET_CHROMA_SCALE, 0.0, 0.0, None, None);
        let blue_palette   = generate_palette_with_scale(blue, &TARGET_LIGHTNESS, &TARGET_CHROMA_SCALE, 0.0, 0.0, None, None);

        assert!(
            yellow_palette.max_recommended_light_padding < blue_palette.max_recommended_light_padding,
            "Yellow should have tighter light padding limit than blue"
        );
    }

    mod palette_struct_tests {
        use super::*;

        #[test]
        fn palette_struct_exposes_metadata_fields() {
            // Arrange
            let base_500 = Oklch::new(0.55, 0.15, 240.0);
            let palette = generate_palette(base_500, 0.0, 0.0);

            // Assert: Palette should have metadata fields accessible directly
            assert!(palette.max_recommended_light_padding > 0.0);
            assert!(palette.max_recommended_dark_padding > 0.0);
            assert_eq!(palette.note, "");
        }

        #[test]
        fn palette_struct_contains_swatches() {
            // Arrange
            let base_500 = Oklch::new(0.55, 0.15, 240.0);
            let palette = generate_palette(base_500, 0.0, 0.0);

            // Assert: Palette should have a swatches field with 10 items
            assert_eq!(palette.swatches.len(), 10);
            assert_eq!(palette.swatches[5].label, SwatchLabel::Number(500));
        }
    }

    mod lightness_curve_tests {
        use super::*;

        #[test]
        fn palette_stores_lightness_curve_used_to_generate_it() {
            // Arrange
            let base_500 = Oklch::new(0.55, 0.15, 240.0);
            let custom_lightness = [0.99, 0.95, 0.85, 0.75, 0.65, 0.55, 0.40, 0.30, 0.20, 0.10];
            let palette = generate_palette_with_scale(
                base_500,
                &custom_lightness,
                &TARGET_CHROMA_SCALE,
                0.0,
                0.0,
                None,
                None,
            );

            // Assert: Palette should store the exact lightness curve that was passed in
            assert_eq!(palette.lightness_curve, custom_lightness);
        }

        #[test]
        fn default_lightness_curve_is_target_lightness() {
            // Arrange
            let base_500 = Oklch::new(0.55, 0.15, 240.0);
            let palette = generate_palette(base_500, 0.0, 0.0);

            // Assert: Default palette should use TARGET_LIGHTNESS
            assert_eq!(palette.lightness_curve, TARGET_LIGHTNESS);
        }

        #[test]
        fn validate_accepts_arbitrary_valid_lightness_array() {
            // Test with non-monotonic array - this should be valid
            let arbitrary = [0.50, 0.95, 0.40, 0.80, 0.30, 0.70, 0.20, 0.60, 0.10, 0.99];
            assert!(validate_lightness_curve(arbitrary).is_ok());
        }

        #[test]
        fn validate_accepts_all_same_values() {
            // All values the same should be valid (0.5, 0.5, 0.5, ...)
            let all_same = [0.50; 10];
            assert!(validate_lightness_curve(all_same).is_ok());
        }

        #[test]
        fn validate_rejects_value_below_zero() {
            // Array with a negative value should fail
            let invalid = [0.97, 0.91, 0.83, 0.76, 0.67, 0.55, 0.45, 0.32, 0.22, -0.05];
            let result = validate_lightness_curve(invalid);
            assert!(result.is_err());
            assert!(result.unwrap_err().contains("out of range"));
        }

        #[test]
        fn validate_rejects_value_above_one() {
            // Array with a value > 1.0 should fail
            let invalid = [1.05, 0.91, 0.83, 0.76, 0.67, 0.55, 0.45, 0.32, 0.22, 0.15];
            let result = validate_lightness_curve(invalid);
            assert!(result.is_err());
            assert!(result.unwrap_err().contains("out of range"));
        }

        #[test]
        fn validate_rejects_multiple_out_of_range_values() {
            // First error should be reported
            let invalid = [1.1, 0.91, 0.83, 0.76, 0.67, 0.55, 0.45, 0.32, 0.22, -0.1];
            let result = validate_lightness_curve(invalid);
            assert!(result.is_err());
            assert!(result.unwrap_err().contains("index 0"));
        }

        #[test]
        fn validate_reports_error_at_correct_index() {
            // Value at index 5 is out of range
            let invalid = [0.97, 0.91, 0.83, 0.76, 0.67, 1.5, 0.45, 0.32, 0.22, 0.15];
            let result = validate_lightness_curve(invalid);
            assert!(result.is_err());
            let err = result.unwrap_err();
            assert!(err.contains("index 5"));
            assert!(err.contains("1.5"));
        }
    }

    mod swatch_colour_format_tests {
        use super::*;
        use crate::color::output::{format_oklch, oklch_to_hex, oklch_to_rgb};

        #[test]
        fn swatch_step_from_label_carries_hex_rgb_and_oklch_colour_forms() {
            let step =
                SwatchStep::from_label(1.0, 0.0, 0.0, SwatchLabel::Name(String::from("White")));

            assert_eq!(step.hex, "#ffffff");
            assert_eq!(step.oklch, "oklch(1 0 0)");
            assert_eq!(step.rgb, oklch_to_rgb(Oklch::new(1.0, 0.0, 0.0)));
        }

        #[test]
        fn generated_palette_swatches_carry_colour_format_fields() {
            let palette = generate_palette(Oklch::new(0.55, 0.15, 240.0), 0.0, 0.0);

            for swatch in &palette.swatches {
                let oklch = Oklch::new(swatch.l, swatch.c, swatch.h);
                assert_eq!(swatch.hex, oklch_to_hex(oklch));
                assert_eq!(swatch.rgb, oklch_to_rgb(oklch));
                assert_eq!(swatch.oklch, format_oklch(oklch));
            }
        }

        #[test]
        fn swatch_best_foreground_carries_colour_format_fields() {
            let palette = generate_palette(Oklch::new(0.55, 0.15, 240.0), 0.0, 0.0);

            let foreground = &palette.swatches[0].best_foreground;
            let oklch = Oklch::new(foreground.l, foreground.c, foreground.h);
            assert_eq!(foreground.hex, oklch_to_hex(oklch));
        }

        #[test]
        fn swatch_carries_the_foreground_source_that_was_chosen() {
            use crate::ForegroundSource;

            let palette = generate_palette(Oklch::new(0.55, 0.15, 240.0), 0.0, 0.0);

            // Step 50 is the lightest background; its harmonious dark
            // candidate (step 900) clears AA, so the source is Step900.
            assert_eq!(palette.swatches[0].foreground_source, ForegroundSource::Step900);
        }
    }
}
}

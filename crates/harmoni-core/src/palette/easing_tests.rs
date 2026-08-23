use crate::palette::easing::*;

#[cfg(test)]
mod easing_tests {
    use super::*;

    /// Curves are compared to six decimal places: the families are transcendental,
    /// so an exact match would be asserting on f32 rounding rather than on shape.
    fn assert_curve(actual: Vec<f32>, expected: &[f32]) {
        assert_eq!(actual.len(), expected.len(), "wrong sample count");
        for (i, (a, e)) in actual.iter().zip(expected).enumerate() {
            assert!(
                (a - e).abs() < 1e-6,
                "sample {i}: expected {e}, got {a} (curve {actual:?})"
            );
        }
    }

    mod exponent_families {
        use super::*;

        #[test]
        fn should_mirror_the_shape_through_both_axes_for_ease_out() {
            // Act
            let result = curve(&CurvePreset::new(Easing::Quadratic, Direction::EaseOut), 3);

            // Assert — 1 - f(1 - t): the same curve entered from the other end.
            assert_curve(result, &[0.0, 0.75, 1.0]);
        }

        #[test]
        fn should_raise_the_position_to_each_familys_own_exponent() {
            // Assert — the four exponent families differ only by their power,
            // which is what makes the list read as near-synonyms in the UI.
            assert_curve(curve(&CurvePreset::new(Easing::Cubic, Direction::EaseIn), 3), &[0.0, 0.125, 1.0]);
            assert_curve(curve(&CurvePreset::new(Easing::Quartic, Direction::EaseIn), 3), &[0.0, 0.0625, 1.0]);
            assert_curve(curve(&CurvePreset::new(Easing::Quintic, Direction::EaseIn), 3), &[0.0, 0.03125, 1.0]);
        }

        #[test]
        fn should_run_the_shape_and_its_mirror_at_half_scale_for_ease_in_out() {
            // Act
            let result = curve(&CurvePreset::new(Easing::Quadratic, Direction::EaseInOut), 5);

            // Assert — ease-in over the first half, ease-out over the second,
            // meeting at the midpoint.
            assert_curve(result, &[0.0, 0.125, 0.5, 0.875, 1.0]);
        }

        #[test]
        fn should_square_the_position_for_quadratic_ease_in() {
            // Act
            let result = curve(&CurvePreset::new(Easing::Quadratic, Direction::EaseIn), 3);

            // Assert
            assert_curve(result, &[0.0, 0.25, 1.0]);
        }
    }

    mod closed_form_families {
        use super::*;

        #[test]
        fn should_pin_exponentials_first_sample_to_zero_rather_than_its_formula() {
            // Act
            let result = curve(&CurvePreset::new(Easing::Exponential, Direction::EaseIn), 3);

            // Assert — 2^(10t - 10) is 2^-10 at t = 0, not 0. Anchoring reads
            // the curve's own endpoints, so a ramp whose curve starts just off
            // zero starts just off its anchor; the family is pinned instead.
            assert_curve(result, &[0.0, 0.031_25, 1.0]);
        }

        #[test]
        fn should_trace_a_quarter_cosine_for_sine() {
            // Act
            let result = curve(&CurvePreset::new(Easing::Sine, Direction::EaseIn), 3);

            // Assert — 1 - cos(t·pi/2).
            assert_curve(result, &[0.0, 0.292_893_2, 1.0]);
        }

        #[test]
        fn should_trace_a_quarter_circle_for_circular() {
            // Act
            let result = curve(&CurvePreset::new(Easing::Circular, Direction::EaseIn), 3);

            // Assert — 1 - sqrt(1 - t^2).
            assert_curve(result, &[0.0, 0.133_974_6, 1.0]);
        }
    }

    mod arc {
        use super::*;

        fn arc(accent: f32, direction: Direction, count: usize) -> Vec<f32> {
            curve(
                &CurvePreset::new(Easing::Arc, direction).with_accent(accent),
                count,
            )
        }

        #[test]
        fn should_reproduce_sine_ease_out_at_accent_zero() {
            // Assert — a quarter circle sampled evenly in angle IS the sine
            // family; this is the calibration that pins the two together.
            assert_curve(arc(0.0, Direction::EaseOut, 3), &[0.0, 0.707_106_8, 1.0]);
        }

        #[test]
        fn should_reproduce_sine_ease_in_at_accent_one() {
            // Assert — the accent sweeps the arc across to the other
            // orientation, so the far end duplicates sine the other way round.
            assert_curve(arc(1.0, Direction::EaseOut, 3), &[0.0, 0.292_893_2, 1.0]);
        }

        #[test]
        fn should_make_a_symmetric_shape_no_other_family_offers_at_the_midpoint() {
            // Assert — the reason the default accent is 0.5.
            assert_curve(
                arc(0.5, Direction::EaseOut, 5),
                &[0.0, 0.229_401_9, 0.5, 0.770_598_1, 1.0],
            );
        }

        #[test]
        fn should_span_zero_to_one_exactly_rather_than_clamping_to_a_plateau() {
            // Assert — the source clamps the arc into 0..1, which parks several
            // samples on one value at any non-zero accent. Colliding steps are
            // the defect the anchored model exists to prevent, so the arc is
            // normalised over its own sampled span instead.
            for accent in [0.0, 0.25, 0.5, 0.75, 1.0] {
                let samples = arc(accent, Direction::EaseOut, 12);
                assert_eq!(samples.first().copied(), Some(0.0), "accent {accent}");
                assert_eq!(samples.last().copied(), Some(1.0), "accent {accent}");
                for pair in samples.windows(2) {
                    assert!(pair[1] > pair[0], "accent {accent} plateaued: {samples:?}");
                }
            }
        }
    }

    mod linear {
        use super::*;

        #[test]
        fn should_sample_evenly_across_the_unit_interval() {
            // Act
            let result = curve(&CurvePreset::new(Easing::Linear, Direction::EaseIn), 3);

            // Assert
            assert_eq!(result, vec![0.0, 0.5, 1.0]);
        }
    }
}

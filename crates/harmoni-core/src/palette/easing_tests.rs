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
            let result = curve(Easing::Quadratic, Direction::EaseOut, 3);

            // Assert — 1 - f(1 - t): the same curve entered from the other end.
            assert_curve(result, &[0.0, 0.75, 1.0]);
        }

        #[test]
        fn should_raise_the_position_to_each_familys_own_exponent() {
            // Assert — the four exponent families differ only by their power,
            // which is what makes the list read as near-synonyms in the UI.
            assert_curve(curve(Easing::Cubic, Direction::EaseIn, 3), &[0.0, 0.125, 1.0]);
            assert_curve(curve(Easing::Quartic, Direction::EaseIn, 3), &[0.0, 0.0625, 1.0]);
            assert_curve(curve(Easing::Quintic, Direction::EaseIn, 3), &[0.0, 0.03125, 1.0]);
        }

        #[test]
        fn should_run_the_shape_and_its_mirror_at_half_scale_for_ease_in_out() {
            // Act
            let result = curve(Easing::Quadratic, Direction::EaseInOut, 5);

            // Assert — ease-in over the first half, ease-out over the second,
            // meeting at the midpoint.
            assert_curve(result, &[0.0, 0.125, 0.5, 0.875, 1.0]);
        }

        #[test]
        fn should_square_the_position_for_quadratic_ease_in() {
            // Act
            let result = curve(Easing::Quadratic, Direction::EaseIn, 3);

            // Assert
            assert_curve(result, &[0.0, 0.25, 1.0]);
        }
    }

    mod closed_form_families {
        use super::*;

        #[test]
        fn should_pin_exponentials_first_sample_to_zero_rather_than_its_formula() {
            // Act
            let result = curve(Easing::Exponential, Direction::EaseIn, 3);

            // Assert — 2^(10t - 10) is 2^-10 at t = 0, not 0. Anchoring reads
            // the curve's own endpoints, so a ramp whose curve starts just off
            // zero starts just off its anchor; the family is pinned instead.
            assert_curve(result, &[0.0, 0.031_25, 1.0]);
        }

        #[test]
        fn should_trace_a_quarter_cosine_for_sine() {
            // Act
            let result = curve(Easing::Sine, Direction::EaseIn, 3);

            // Assert — 1 - cos(t·pi/2).
            assert_curve(result, &[0.0, 0.292_893_2, 1.0]);
        }

        #[test]
        fn should_trace_a_quarter_circle_for_circular() {
            // Act
            let result = curve(Easing::Circular, Direction::EaseIn, 3);

            // Assert — 1 - sqrt(1 - t^2).
            assert_curve(result, &[0.0, 0.133_974_6, 1.0]);
        }
    }

    mod linear {
        use super::*;

        #[test]
        fn should_sample_evenly_across_the_unit_interval() {
            // Act
            let result = curve(Easing::Linear, Direction::EaseIn, 3);

            // Assert
            assert_eq!(result, vec![0.0, 0.5, 1.0]);
        }
    }
}

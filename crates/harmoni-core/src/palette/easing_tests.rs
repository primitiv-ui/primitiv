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
        fn should_square_the_position_for_quadratic_ease_in() {
            // Act
            let result = curve(Easing::Quadratic, Direction::EaseIn, 3);

            // Assert
            assert_curve(result, &[0.0, 0.25, 1.0]);
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

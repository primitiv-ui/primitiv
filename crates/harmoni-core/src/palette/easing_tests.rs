use crate::palette::easing::*;

#[cfg(test)]
mod easing_tests {
    use super::*;

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

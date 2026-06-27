use crate::value::{format_cubic_bezier, format_number};

#[test]
fn emits_length_categories_as_rem_against_a_16px_base() {
    assert_eq!(format_number("space", 8.0), "0.5rem");
    assert_eq!(format_number("size", 14.0), "0.875rem");
    assert_eq!(format_number("border-width", 16.0), "1rem");
    assert_eq!(format_number("radii", 0.0), "0rem");
}

#[test]
fn rounds_letter_spacing_float_noise_to_clean_rem() {
    // Figma exports carry float noise; -2.4 / 16 must land on -0.15rem.
    assert_eq!(format_number("letter-spacing", -2.4000000953674316), "-0.15rem");
}

#[test]
fn emits_opacity_as_a_unitless_ratio() {
    assert_eq!(format_number("opacity", 80.0), "0.8");
    assert_eq!(format_number("opacity", 100.0), "1");
}

#[test]
fn emits_other_categories_as_the_unitless_number() {
    assert_eq!(format_number("font-weight", 400.0), "400");
}

#[test]
fn emits_duration_as_milliseconds() {
    assert_eq!(format_number("duration", 150.0), "150ms");
    assert_eq!(format_number("duration", 0.0), "0ms");
}

#[test]
fn formats_four_control_points_as_a_css_cubic_bezier() {
    assert_eq!(
        format_cubic_bezier(&[0.4, 0.0, 0.2, 1.0]),
        "cubic-bezier(0.4, 0, 0.2, 1)"
    );
}
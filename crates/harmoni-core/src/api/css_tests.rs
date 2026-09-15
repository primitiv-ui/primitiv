use super::css::to_css_oklch;

#[test]
fn renders_a_hex_colour_as_a_css_oklch_string() {
    assert_eq!(
        to_css_oklch("#236ce1").unwrap(),
        "oklch(0.5557 0.1923 259.8783)"
    );
}

#[test]
fn carries_a_hex_colours_alpha_into_the_slash_alpha_form() {
    assert_eq!(
        to_css_oklch("#236ce108").unwrap(),
        "oklch(0.5557 0.1923 259.8783 / 0.0314)"
    );
}

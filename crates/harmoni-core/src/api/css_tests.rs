use super::css::to_css_oklch;

#[test]
fn renders_a_hex_colour_as_a_css_oklch_string() {
    assert_eq!(
        to_css_oklch("#236ce1").unwrap(),
        "oklch(0.5557 0.1923 259.8783)"
    );
}

use crate::api::audit::audit_contrast;
use crate::color::input::{ColorInput, ColorInputError};

#[test]
fn audit_contrast_rates_pure_black_on_pure_white_as_aaa() {
    let bg = ColorInput::Rgb {
        r: 255,
        g: 255,
        b: 255,
    };
    let fg = ColorInput::Rgb { r: 0, g: 0, b: 0 };

    let result = audit_contrast(bg, fg).expect("valid inputs should audit");

    assert_eq!(result.rating, "AAA");
    assert_eq!(result.ratio, 21.0);
}

#[test]
fn audit_contrast_propagates_an_invalid_background_color() {
    let bg = ColorInput::Css("not-a-color".to_string());
    let fg = ColorInput::Rgb { r: 0, g: 0, b: 0 };

    let result = audit_contrast(bg, fg);

    assert_eq!(
        result,
        Err(ColorInputError::InvalidCss("not-a-color".to_string()))
    );
}

#[test]
fn audit_contrast_propagates_an_invalid_foreground_color_when_the_background_is_valid() {
    let bg = ColorInput::Rgb {
        r: 255,
        g: 255,
        b: 255,
    };
    let fg = ColorInput::Css("not-a-color".to_string());

    let result = audit_contrast(bg, fg);

    assert_eq!(
        result,
        Err(ColorInputError::InvalidCss("not-a-color".to_string()))
    );
}

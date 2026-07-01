use crate::alpha::ramp::ALPHA_CURVE;
use crate::api::alpha::generate_alpha_ramp;
use crate::color::input::ColorInput;

#[test]
fn generate_alpha_ramp_parses_a_css_anchor_and_produces_the_ramp() {
    let ramp = generate_alpha_ramp(ColorInput::Css("oklch(0.2 0.03 260)".to_string()))
        .expect("a valid colour should produce a ramp");
    assert_eq!(ramp.len(), 10);
    assert_eq!(ramp[0].alpha, ALPHA_CURVE[0]);
    assert_eq!(ramp[9].alpha, ALPHA_CURVE[9]);
}

#[test]
fn generate_alpha_ramp_errors_on_an_unparseable_anchor() {
    let result = generate_alpha_ramp(ColorInput::Css("not-a-colour".to_string()));
    assert!(result.is_err());
}

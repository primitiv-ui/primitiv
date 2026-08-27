use crate::alpha::ramp::ALPHA_CURVE;
use crate::api::alpha::{generate_alpha_ramp, generate_alpha_ramp_with_steps};
use crate::api::generate::GenerateError;
use crate::color::input::ColorInput;
use crate::palette::generator::step_labels;

fn css_anchor() -> ColorInput {
    ColorInput::Css("oklch(0.2 0.03 260)".to_string())
}

#[test]
fn generate_alpha_ramp_with_steps_produces_a_ramp_of_the_requested_length() {
    let ramp = generate_alpha_ramp_with_steps(css_anchor(), 7)
        .expect("a valid colour and length should produce a ramp");
    let steps: Vec<u16> = ramp.iter().map(|s| s.step).collect();
    assert_eq!(steps, step_labels(7));
}

#[test]
fn generate_alpha_ramp_with_steps_rejects_a_length_the_model_cannot_express() {
    let result = generate_alpha_ramp_with_steps(css_anchor(), 2);
    assert_eq!(result, Err(GenerateError::UnsupportedStepCount(2)));
}

#[test]
fn generate_alpha_ramp_with_steps_errors_on_an_unparseable_anchor() {
    let result =
        generate_alpha_ramp_with_steps(ColorInput::Css("not-a-colour".to_string()), 10);
    assert!(matches!(result, Err(GenerateError::InvalidColor(_))));
}

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

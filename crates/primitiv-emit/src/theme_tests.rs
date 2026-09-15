use harmoni_core::api::generate;
use harmoni_core::ColorInput;
use pretty_assertions::assert_eq;

use crate::theme::{ramp_tokens, ColorForm};

#[test]
fn maps_each_swatch_to_a_namespaced_brand_token() {
    let palette = generate(ColorInput::Css("#0a7755".to_string())).expect("valid brand");

    let tokens = ramp_tokens("brand", &palette, ColorForm::Oklch);

    assert_eq!(tokens.len(), 10);
    assert_eq!(tokens[0].path, vec!["color", "brand", "50"]);
    assert_eq!(tokens[9].path, vec!["color", "brand", "900"]);
    // Each token carries the swatch's own OkLCH, as the engine rendered it —
    // not a conversion of its hex, which would be an 8-bit round trip of a
    // value the engine already holds exactly.
    assert_eq!(tokens[5].value, palette.swatches[5].oklch);
    assert!(tokens[0].value.starts_with("oklch("));
}

#[test]
fn namespaces_the_tokens_under_whichever_ramp_family_is_asked_for() {
    let palette = generate(ColorInput::Css("#db2424".to_string())).expect("valid seed");

    let tokens = ramp_tokens("danger", &palette, ColorForm::Oklch);

    assert_eq!(tokens[0].path, vec!["color", "danger", "50"]);
    assert_eq!(tokens[5].path, vec!["color", "danger", "500"]);
}

#[test]
fn carries_each_swatch_as_hex_when_that_is_the_form_asked_for() {
    let palette = generate(ColorInput::Css("#0a7755".to_string())).expect("valid brand");

    let tokens = ramp_tokens("brand", &palette, ColorForm::Hex);

    // A DTCG document for an importer wants the form the ecosystem reads, which
    // is also what Figma's own variables panel shows.
    assert_eq!(tokens[5].value, palette.swatches[5].hex);
    assert!(tokens[0].value.starts_with('#'));
}

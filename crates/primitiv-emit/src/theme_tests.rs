use harmoni_core::api::generate;
use harmoni_core::ColorInput;
use pretty_assertions::assert_eq;

use crate::theme::brand_tokens;

#[test]
fn maps_each_swatch_to_a_namespaced_brand_token() {
    let palette = generate(ColorInput::Css("#0a7755".to_string())).expect("valid brand");

    let tokens = brand_tokens(&palette);

    assert_eq!(tokens.len(), 10);
    assert_eq!(tokens[0].path, vec!["color", "brand", "50"]);
    assert_eq!(tokens[9].path, vec!["color", "brand", "900"]);
    // Each token carries the swatch's sRGB hex as its value.
    assert_eq!(tokens[5].value, palette.swatches[5].hex);
    assert!(tokens[0].value.starts_with('#'));
}

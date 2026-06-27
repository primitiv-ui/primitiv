use pretty_assertions::assert_eq;
use serde_json::json;

use crate::dtcg::{flatten_modes, tokens_from_dtcg};
use crate::token::Token;

#[test]
fn splits_a_multi_mode_document_into_per_mode_token_groups() {
    let dtcg = json!({
        "light": { "color": { "bg": { "$type": "color", "$value": "#fff" } } },
        "dark":  { "color": { "bg": { "$type": "color", "$value": "#111" } } }
    });

    let modes = flatten_modes(&dtcg);

    assert_eq!(
        modes,
        vec![
            ("dark".to_string(), vec![Token::new(&["color", "bg"], "#111")]),
            ("light".to_string(), vec![Token::new(&["color", "bg"], "#fff")]),
        ]
    );
}

#[test]
fn yields_no_modes_when_the_document_is_not_a_group() {
    assert_eq!(flatten_modes(&json!(42)), Vec::<(String, Vec<Token>)>::new());
}

#[test]
fn flattens_nested_dtcg_groups_into_tokens() {
    let dtcg = json!({
        "color": {
            "$description": "brand palette",
            "primary": { "$type": "color", "$value": "oklch(0.55 0.13 162)" }
        },
        "radius": {
            "md": { "$type": "dimension", "$value": "0.5rem" }
        }
    });

    let tokens = tokens_from_dtcg(&dtcg);

    assert_eq!(
        tokens,
        vec![
            Token::new(&["color", "primary"], "oklch(0.55 0.13 162)"),
            Token::new(&["radius", "md"], "0.5rem"),
        ]
    );
}

#[test]
fn formats_numeric_leaves_by_their_category() {
    let dtcg = json!({
        "space": {
            "space-4": { "$type": "number", "$value": 4 }
        },
        "font-weight": {
            "regular": { "$type": "number", "$value": 400 }
        }
    });

    let tokens = tokens_from_dtcg(&dtcg);

    assert_eq!(
        tokens,
        vec![
            Token::new(&["font-weight", "regular"], "400"),
            Token::new(&["space", "space-4"], "0.25rem"),
        ]
    );
}

#[test]
fn flattens_a_cubic_bezier_leaf_into_a_css_easing_function() {
    let dtcg = json!({
        "easing": {
            "in-out": { "$type": "cubicBezier", "$value": [0.4, 0.0, 0.2, 1.0] }
        }
    });

    let tokens = tokens_from_dtcg(&dtcg);

    assert_eq!(
        tokens,
        vec![Token::new(&["easing", "in-out"], "cubic-bezier(0.4, 0, 0.2, 1)")]
    );
}

#[test]
fn skips_a_cubic_bezier_leaf_whose_value_is_not_an_array() {
    let dtcg = json!({
        "easing": {
            "broken": { "$type": "cubicBezier", "$value": { "x1": 0.4 } }
        }
    });

    assert_eq!(tokens_from_dtcg(&dtcg), Vec::<Token>::new());
}

#[test]
fn skips_a_cubic_bezier_leaf_without_exactly_four_control_points() {
    let dtcg = json!({
        "easing": {
            "broken": { "$type": "cubicBezier", "$value": [0.4, 0.0, 0.2] }
        }
    });

    assert_eq!(tokens_from_dtcg(&dtcg), Vec::<Token>::new());
}

#[test]
fn skips_leaves_whose_value_is_neither_text_nor_a_number() {
    let dtcg = json!({
        "shadow": {
            "sm": { "$type": "shadow", "$value": { "offsetX": 0 } }
        }
    });

    assert_eq!(tokens_from_dtcg(&dtcg), Vec::<Token>::new());
}

#[test]
fn yields_no_tokens_when_the_root_is_not_a_group() {
    let dtcg = json!("not a token tree");

    assert_eq!(tokens_from_dtcg(&dtcg), Vec::<Token>::new());
}

#[test]
fn skips_scalar_entries_that_are_neither_a_leaf_nor_a_group() {
    let dtcg = json!({
        "color": {
            "primary": { "$type": "color", "$value": "oklch(0.55 0.13 162)" },
            "stray": 5
        }
    });

    let tokens = tokens_from_dtcg(&dtcg);

    assert_eq!(tokens, vec![Token::new(&["color", "primary"], "oklch(0.55 0.13 162)")]);
}

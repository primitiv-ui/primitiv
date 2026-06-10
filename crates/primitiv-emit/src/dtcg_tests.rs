use pretty_assertions::assert_eq;
use serde_json::json;

use crate::dtcg::tokens_from_dtcg;
use crate::token::Token;

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

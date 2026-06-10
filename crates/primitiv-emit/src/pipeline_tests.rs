use pretty_assertions::assert_eq;
use serde_json::json;

use crate::pipeline::{emit_tokens_css, TokenSources};

#[test]
fn emits_base_then_theme_and_density_scopes_with_linked_aliases() {
    // Single-mode base: a primitive number (formatted) and an interaction alias.
    let primitives = json!({
        "space": { "space-4": { "$type": "number", "$value": 4 } },
        "opacity": { "60": { "$type": "number", "$value": 60 } }
    });
    let interaction = json!({
        "active": { "opacity": { "$type": "number", "$value": "{opacity.60}" } }
    });

    // Theme axis: palette holds concrete colours per mode; intent references them.
    let palette = json!({
        "light": { "color": { "brand": { "500": { "$type": "color", "$value": "#0a7755" } } } },
        "dark":  { "color": { "brand": { "500": { "$type": "color", "$value": "#5fd3a8" } } } }
    });
    let intent = json!({
        "light": { "action": { "primary": { "$type": "color", "$value": "{color.brand.500}" } } },
        "dark":  { "action": { "primary": { "$type": "color", "$value": "{color.brand.500}" } } }
    });

    // Density axis: context references primitives, varying per density.
    let context = json!({
        "comfortable": { "control": { "height": { "$type": "number", "$value": "{size.size-40}" } } },
        "dense":       { "control": { "height": { "$type": "number", "$value": "{size.size-24}" } } }
    });

    let base = vec![primitives, interaction];
    let theme = vec![palette, intent];
    let density = vec![context];

    let css = emit_tokens_css(&TokenSources {
        base: &base,
        theme: &theme,
        density: &density,
    });

    assert_eq!(
        css,
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/tests/golden/token-pipeline.css"
        ))
    );
}

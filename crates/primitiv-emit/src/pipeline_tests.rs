use pretty_assertions::assert_eq;
use serde_json::{json, Value};

use crate::pipeline::{
    emit_component_tokens_css, emit_tailwind_tokens, emit_theme_brand_css, emit_theme_overrides_css,
    emit_tokens_css, emit_tokens_scss, emit_ts_tokens, TokenSources,
};

/// Shared, pure-data fixture: routed DTCG documents exercising every axis — a
/// single-mode base (primitive number + interaction alias), the theme axis
/// (palette colours per mode + intent references), and the density axis (context
/// references that vary per density).
struct Documents {
    base: Vec<Value>,
    theme: Vec<Value>,
    density: Vec<Value>,
}

fn documents() -> Documents {
    let primitives = json!({
        "space": { "space-4": { "$type": "number", "$value": 4 } },
        "opacity": { "60": { "$type": "number", "$value": 60 } }
    });
    let interaction = json!({
        "active": { "opacity": { "$type": "number", "$value": "{opacity.60}" } }
    });
    let palette = json!({
        "light": { "color": { "brand": { "500": { "$type": "color", "$value": "#0a7755" } } } },
        "dark":  { "color": { "brand": { "500": { "$type": "color", "$value": "#5fd3a8" } } } }
    });
    let intent = json!({
        "light": { "action": { "primary": { "$type": "color", "$value": "{color.brand.500}" } } },
        "dark":  { "action": { "primary": { "$type": "color", "$value": "{color.brand.500}" } } }
    });
    let context = json!({
        "comfortable": { "control": { "height": { "$type": "number", "$value": "{size.size-40}" } } },
        "dense":       { "control": { "height": { "$type": "number", "$value": "{size.size-24}" } } }
    });

    Documents {
        base: vec![primitives, interaction],
        theme: vec![palette, intent],
        density: vec![context],
    }
}

#[test]
fn emits_base_then_theme_and_density_scopes_with_linked_aliases() {
    let docs = documents();

    let css = emit_tokens_css(&TokenSources {
        base: &docs.base,
        theme: &docs.theme,
        density: &docs.density,
    });

    assert_eq!(
        css,
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/tests/golden/token-pipeline.css"
        ))
    );
}

#[test]
fn emits_the_same_token_surface_as_scss_with_dollar_variables() {
    let docs = documents();

    let scss = emit_tokens_scss(&TokenSources {
        base: &docs.base,
        theme: &docs.theme,
        density: &docs.density,
    });

    assert_eq!(
        scss,
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/tests/golden/token-pipeline.scss"
        ))
    );
}

#[test]
fn links_component_api_token_aliases_to_var_references() {
    let document = json!({
        "bg": { "$type": "color", "$value": "{color.primary}" },
        "fg": { "$type": "color", "$value": "{color.on-primary}" }
    });

    let css = emit_component_tokens_css("button", &document);

    assert_eq!(
        css,
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/tests/golden/component-button.css"
        ))
    );
}

#[test]
fn emits_paired_light_dark_brand_overrides_in_the_theme_layer() {
    let overrides = json!({
        "light": { "color": { "primary": { "$type": "color", "$value": "oklch(0.55 0.13 162)" } } },
        "dark":  { "color": { "primary": { "$type": "color", "$value": "oklch(0.72 0.13 162)" } } }
    });

    let css = emit_theme_overrides_css(&[overrides]);

    assert_eq!(
        css,
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/tests/golden/theme-overrides.css"
        ))
    );
}

#[test]
fn emits_a_brand_palette_as_paired_theme_overrides() {
    let css = emit_theme_brand_css("#0a7755").expect("valid brand");

    assert_eq!(
        css,
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/tests/golden/theme-brand.css"
        ))
    );
}

#[test]
fn rejects_an_unparseable_brand_colour() {
    assert!(emit_theme_brand_css("not-a-colour").is_err());
}

#[test]
fn inlines_base_token_aliases_into_the_ts_object() {
    let primitives = json!({
        "opacity": { "60": { "$type": "number", "$value": 60 } }
    });
    let interaction = json!({
        "active": { "opacity": { "$type": "number", "$value": "{opacity.60}" } }
    });

    let ts = emit_ts_tokens(&[primitives, interaction]);

    assert_eq!(
        ts,
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/tests/golden/tokens-base.ts"
        ))
    );
}

#[test]
fn maps_the_shared_surface_into_a_tailwind_preset_once_per_name() {
    let docs = documents();

    let tailwind = emit_tailwind_tokens(&TokenSources {
        base: &docs.base,
        theme: &docs.theme,
        density: &docs.density,
    });

    assert_eq!(
        tailwind,
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/tests/golden/tailwind-pipeline.css"
        ))
    );
}

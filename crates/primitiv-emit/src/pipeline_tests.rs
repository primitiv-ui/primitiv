use pretty_assertions::assert_eq;
use serde_json::{Value, json};

use crate::pipeline::{
    NeutralRamp, ThemeRamps, TokenSources, emit_component_tokens_css, emit_dtcg_ramps, emit_tailwind_tokens,
    emit_theme_overrides_css, emit_theme_ramps_css, emit_theme_ramps_scss,
    emit_theme_ramps_tailwind, emit_tokens_css, emit_tokens_scss,
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

/// Seeds at the default length with no Intent document — the shape most of these
/// cases want, where no role is re-pointed.
fn at_default_length<'a>(seeds: &'a [(&'a str, &'a str)]) -> ThemeRamps<'a> {
    ThemeRamps {
        seeds,
        steps: 10,
        intent: &Value::Null,
        neutral: None,
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
    let css =
        emit_theme_ramps_css(&at_default_length(&[("brand", "#0a7755")])).expect("valid brand");

    assert_eq!(
        css,
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/tests/golden/theme-brand.css"
        ))
    );
}

#[test]
fn emits_a_brand_palette_as_paired_theme_overrides_in_scss() {
    let scss =
        emit_theme_ramps_scss(&at_default_length(&[("brand", "#0a7755")])).expect("valid brand");

    assert_eq!(
        scss,
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/tests/golden/theme-brand.scss"
        ))
    );
}

#[test]
fn emits_a_brand_palette_as_paired_theme_overrides_in_tailwind() {
    let tailwind = emit_theme_ramps_tailwind(&at_default_length(&[("brand", "#0a7755")]))
        .expect("valid brand");

    assert_eq!(
        tailwind,
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/tests/golden/theme-brand.tailwind.css"
        ))
    );
}

#[test]
fn rejects_an_unparseable_brand_colour() {
    assert!(emit_dtcg_ramps(&[("brand", "not-a-colour")], 10).is_err());
    assert!(emit_theme_ramps_css(&at_default_length(&[("brand", "not-a-colour")])).is_err());
    assert!(emit_theme_ramps_scss(&at_default_length(&[("brand", "not-a-colour")])).is_err());
    assert!(emit_theme_ramps_tailwind(&at_default_length(&[("brand", "not-a-colour")])).is_err());
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

#[test]
fn emits_every_seeded_ramp_family_into_each_theme_scope() {
    let css = emit_theme_ramps_css(&at_default_length(&[
        ("brand", "#0a7755"),
        ("danger", "#db2424"),
    ]))
    .expect("valid seeds");

    // One scope per mode, each carrying both families — a role that references
    // either one re-skins from the same file.
    assert_eq!(css.matches("--primitiv-color-brand-500:").count(), 2);
    assert_eq!(css.matches("--primitiv-color-danger-500:").count(), 2);
}

#[test]
fn emits_seeded_ramps_as_a_dtcg_document_in_hex() {
    let document = emit_dtcg_ramps(&[("brand", "#0a7755")], 10).expect("valid seed");

    // Mode-keyed like the committed source, and in hex, so an importer that reads
    // DTCG can consume it without knowing anything about Primitiv.
    assert!(document.starts_with("{\n  \"light\": {"), "{document}");
    assert!(document.contains("\"$value\": \"#0a7755\""), "{document}");
    assert!(document.contains("\"dark\": {"), "{document}");
    assert!(!document.contains("oklch("), "{document}");
}

#[test]
fn re_points_intent_roles_when_the_ramp_is_not_the_default_length() {
    let intent = json!({
        "light": { "action": { "primary": {
            "default": { "$type": "color", "$value": "{color.brand.500}" },
            "hover":   { "$type": "color", "$value": "{color.brand.600}" }
        }}},
        "dark": { "action": { "primary": {
            "hover": { "$type": "color", "$value": "{color.brand.600}" }
        }}}
    });

    let css = emit_theme_ramps_css(&ThemeRamps {
        seeds: &[("brand", "#0a7755")],
        steps: 7,
        intent: &intent,
        neutral: None,
    })
    .expect("valid seed");

    // A seven-step ramp labels 50, 100, 230, 370, 500, 700, 900 — there is no 600,
    // and 500 and 700 are equidistant, so the tie goes to the higher step. Without
    // this the declaration resolves to nothing and the role silently keeps whatever
    // the base layer had.
    assert!(
        css.contains("--primitiv-action-primary-hover: var(--primitiv-color-brand-700)"),
        "{css}"
    );
    // 500 survives every length, so `default` is not re-emitted at all.
    assert!(!css.contains("--primitiv-action-primary-default"), "{css}");
}

#[test]
fn emits_no_intent_block_at_the_default_length() {
    let intent = json!({
        "light": { "action": { "primary": {
            "hover": { "$type": "color", "$value": "{color.brand.600}" }
        }}}
    });

    let css = emit_theme_ramps_css(&ThemeRamps {
        seeds: &[("brand", "#0a7755")],
        steps: 10,
        intent: &intent,
        neutral: None,
    })
    .expect("valid seed");

    assert!(!css.contains("--primitiv-action-primary-hover"), "{css}");
}

#[test]
fn exports_a_dtcg_ramp_at_the_requested_length() {
    let document = emit_dtcg_ramps(&[("brand", "#0a7755")], 5).expect("valid seed");

    // Five steps label 50, 100, 300, 500, 900 — so the document says 300 and has no
    // 200 at all, rather than quietly exporting the default ten.
    assert!(document.contains("\"300\""), "{document}");
    assert!(!document.contains("\"200\""), "{document}");
}

#[test]
fn rejects_a_step_count_outside_the_engines_supported_range() {
    // The count is the engine's to bound, and both formats defer to it rather than
    // clamping — a consumer who asked for 99 steps gets told, not silently given 32.
    assert!(emit_dtcg_ramps(&[("brand", "#0a7755")], 99).is_err());
    assert!(
        emit_theme_ramps_css(&ThemeRamps {
            seeds: &[("brand", "#0a7755")],
            steps: 2,
            intent: &Value::Null,
            neutral: None,
        })
        .is_err()
    );
}

#[test]
fn emits_a_neutral_ramp_into_both_theme_scopes() {
    use harmoni_core::api::NeutralTint;
    use harmoni_core::ColorInput;

    let css = emit_theme_ramps_css(&ThemeRamps {
        seeds: &[("brand", "#0a7755")],
        steps: 10,
        intent: &Value::Null,
        neutral: Some(NeutralRamp {
            white: ColorInput::Oklch { l: 0.95, c: 0.02, h: 240.0 },
            black: ColorInput::Oklch { l: 0.10, c: 0.005, h: 240.0 },
            tint: Some(NeutralTint {
                source: ColorInput::Css("#0a7755".to_string()),
                strength: 0.5,
                spread: 0.0,
                bow: 0.0,
            }),
        }),
    })
    .expect("valid seeds");

    // The neutral ramp is the one a project cannot express as a seed, so before
    // this a consumer who tuned their greys in the plugin got Primitiv's stock
    // ones back and no warning. It lands in the same two scopes as the seeded
    // families, under its own family name.
    assert_eq!(css.matches("--primitiv-color-neutral-500:").count(), 2);
    // Light and dark are the same anchors run opposite ways, so the ramp's ends
    // swap between the modes rather than repeating.
    let light_50 = css.find("--primitiv-color-neutral-50:").unwrap();
    assert!(css[light_50..].contains("oklch("), "{css}");
}

#[test]
fn rejects_a_neutral_anchor_the_engine_cannot_parse() {
    use harmoni_core::ColorInput;

    // The anchors are consumer input like any seed, so a bad one is reported
    // rather than swallowed — and it has its own path, because a neutral ramp is
    // generated from a different call than the seeded families beside it.
    let result = emit_theme_ramps_css(&ThemeRamps {
        seeds: &[("brand", "#0a7755")],
        steps: 10,
        intent: &Value::Null,
        neutral: Some(NeutralRamp {
            white: ColorInput::Css("not-a-colour".to_string()),
            black: ColorInput::Oklch { l: 0.10, c: 0.005, h: 240.0 },
            tint: None,
        }),
    });

    assert!(result.is_err());
}

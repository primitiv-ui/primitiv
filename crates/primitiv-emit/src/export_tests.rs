use harmoni_core::api::NeutralTint;
use harmoni_core::ColorInput;
use serde_json::json;

use crate::export::{ExportFormat, ExportRequest, emit_export};
use crate::pipeline::NeutralRamp;

/// A whole palette in one request — the shape a consumer outside this workspace
/// hands over, owning its strings because it cannot lend them across a boundary.
fn request() -> ExportRequest {
    ExportRequest {
        seeds: vec![("brand".to_string(), "#236ce1".to_string())],
        steps: 10,
        neutral: Some(NeutralRamp {
            white: ColorInput::Css("#e5ecf6".to_string()),
            black: ColorInput::Css("#121418".to_string()),
            tint: Some(NeutralTint {
                source: ColorInput::Css("#236ce1".to_string()),
                strength: 1.0,
                spread: 0.0,
                bow: 0.0,
            }),
        }),
        roles: Some(json!({
            "light": { "action": { "primary": { "$type": "color", "$value": "{color.brand.600}" } } },
            "dark":  { "action": { "primary": { "$type": "color", "$value": "{color.brand.400}" } } }
        })),
    }
}

#[test]
fn a_stylesheet_export_carries_the_seeds_the_neutral_and_the_roles() {
    let css = emit_export(&request(), ExportFormat::Css).expect("every colour is valid");

    assert!(css.contains("--primitiv-color-brand-500:"), "no seeded ramp: {css}");
    assert!(css.contains("--primitiv-color-neutral-500:"), "no neutral ramp: {css}");
    assert!(
        css.contains("--primitiv-action-primary: var(--primitiv-color-brand-600)"),
        "no roles: {css}"
    );
}

#[test]
fn each_format_serialises_the_same_palette_its_own_way() {
    let scss = emit_export(&request(), ExportFormat::Scss).expect("valid");
    let tailwind = emit_export(&request(), ExportFormat::Tailwind).expect("valid");
    let dtcg = emit_export(&request(), ExportFormat::Dtcg).expect("valid");

    // SCSS follows its CSS with resolving `$primitiv-*` variables; Tailwind adds the
    // `@theme` preset; DTCG is a JSON document, not a stylesheet at all.
    assert!(scss.contains("$primitiv-"), "no SCSS variables: {scss}");
    assert!(tailwind.contains("@theme"), "no Tailwind preset: {tailwind}");
    assert!(dtcg.trim_start().starts_with('{'), "DTCG is not JSON: {dtcg}");
}

/// DTCG is hex for design-tool importers, where a stylesheet is OkLCH for the
/// cascade — the one request has to serve both without the caller choosing a
/// colour form.
#[test]
fn a_dtcg_export_is_hex_where_a_stylesheet_is_oklch() {
    let css = emit_export(&request(), ExportFormat::Css).expect("valid");
    let dtcg = emit_export(&request(), ExportFormat::Dtcg).expect("valid");

    assert!(css.contains("oklch("), "stylesheet is not OkLCH: {css}");
    assert!(!dtcg.contains("oklch("), "DTCG should be hex: {dtcg}");
    assert!(dtcg.contains("\"#"), "DTCG carries no hex value: {dtcg}");
}

#[test]
fn surfaces_an_unparseable_seed_rather_than_emitting_a_broken_file() {
    let mut bad = request();
    bad.seeds = vec![("brand".to_string(), "not-a-colour".to_string())];

    assert!(emit_export(&bad, ExportFormat::Css).is_err());
    assert!(emit_export(&bad, ExportFormat::Dtcg).is_err());
}

/// The JS-facing shape, deserialised from what a consumer sends over a language
/// boundary. It exists in this crate rather than in the binding so the conversion
/// is reachable by a native test: a `cdylib` cannot be tested at all.
#[test]
fn an_export_input_deserialises_into_a_request() {
    let input: crate::export::ExportInput = serde_json::from_str(
        r##"{
          "seeds": [{ "family": "brand", "seed": "#236ce1" }],
          "steps": 10,
          "neutral": {
            "white": "#e5ecf6",
            "black": "#121418",
            "tint": { "source": "#236ce1", "strength": 1.0 }
          },
          "roles": {
            "light": { "action": { "primary": { "$type": "color", "$value": "{color.brand.600}" } } },
            "dark":  { "action": { "primary": { "$type": "color", "$value": "{color.brand.400}" } } }
          }
        }"##,
    )
    .expect("the payload is well formed");

    let request: ExportRequest = input.into();

    assert_eq!(request.seeds, vec![("brand".to_string(), "#236ce1".to_string())]);
    assert_eq!(request.steps, 10);
    // `spread` and `bow` default to zero, so a single-source tint at full strength
    // needs only the two fields a consumer actually chose.
    let tint = request.neutral.as_ref().and_then(|n| n.tint.as_ref()).expect("a tint");
    assert_eq!(tint.spread, 0.0);
    assert_eq!(tint.bow, 0.0);
    // And it emits: the conversion is only worth anything if the result works.
    let css = emit_export(&request, ExportFormat::Css).expect("valid");
    assert!(css.contains("--primitiv-color-neutral-500:"), "{css}");
}

/// A consumer picks its format from a control, so the name arrives as a string and
/// an unknown one must be refused rather than silently defaulting to CSS.
#[test]
fn a_format_parses_from_its_name_and_rejects_anything_else() {
    assert_eq!(ExportFormat::parse("css"), Some(ExportFormat::Css));
    assert_eq!(ExportFormat::parse("scss"), Some(ExportFormat::Scss));
    assert_eq!(ExportFormat::parse("tailwind"), Some(ExportFormat::Tailwind));
    assert_eq!(ExportFormat::parse("dtcg"), Some(ExportFormat::Dtcg));
    assert_eq!(ExportFormat::parse("json"), None);
    assert_eq!(ExportFormat::parse("CSS"), None);
}

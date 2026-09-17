use serde_json::json;

use crate::export::{
    ExportFormat, ExportIdentity, ExportInput, ExportRamp, ExportRequest, ExportStep, emit_export,
};

/// One ramp's rendered steps in a mode, as the engine handed them over.
fn steps(values: &[(&str, &str)]) -> Vec<ExportStep> {
    values
        .iter()
        .map(|(step, value)| ExportStep {
            step: (*step).to_string(),
            value: (*value).to_string(),
        })
        .collect()
}

/// A whole palette as **values** (RFC 0032 D1): the per-step colours the plugin
/// already rendered, not a recipe to re-derive them from. `accent` is here on
/// purpose — on the values path a family is just a name, so the seed-based
/// path's five-family limit is gone with it.
fn request() -> ExportRequest {
    ExportRequest {
        ramps: vec![
            ExportRamp {
                family: "brand".to_string(),
                light: steps(&[("50", "#eef8f3"), ("500", "#0a7755")]),
                dark: steps(&[("50", "#131a17"), ("500", "#0a7755")]),
            },
            ExportRamp {
                family: "accent".to_string(),
                light: steps(&[("500", "#db2424")]),
                dark: steps(&[("500", "#db2424")]),
            },
        ],
        roles: Some(json!({
            "light": { "action": { "primary": { "$type": "color", "$value": "{color.brand.500}" } } },
            "dark":  { "action": { "primary": { "$type": "color", "$value": "{color.brand.50}" } } }
        })),
        identity: None,
    }
}

#[test]
fn a_stylesheet_export_carries_every_ramp_and_the_roles() {
    let css = emit_export(&request(), ExportFormat::Css);

    assert!(
        css.contains("--primitiv-color-brand-500:"),
        "no brand ramp: {css}"
    );
    // The family whitelist problem disappears on the values path: `accent` needs
    // no seed flag, because nothing here is re-derived from a seed.
    assert!(
        css.contains("--primitiv-color-accent-500:"),
        "no accent ramp: {css}"
    );
    assert!(
        css.contains("--primitiv-action-primary: var(--primitiv-color-brand-500)"),
        "no roles: {css}"
    );
    assert!(
        css.contains("[data-theme=\"dark\"]"),
        "no dark scope: {css}"
    );
}

#[test]
fn a_stylesheet_export_renders_the_values_as_oklch() {
    let css = emit_export(&request(), ExportFormat::Css);

    // The handed-over hex reaches a stylesheet as `oklch()`, the form the token
    // layer is written in — the colour form follows the format, not the caller.
    assert!(
        css.contains("--primitiv-color-brand-500: oklch("),
        "got: {css}"
    );
    assert!(
        !css.contains("#0a7755"),
        "hex should not reach a stylesheet: {css}"
    );
}

#[test]
fn a_dtcg_export_keeps_the_values_as_handed_over() {
    let dtcg = emit_export(&request(), ExportFormat::Dtcg);

    assert!(dtcg.contains("\"$value\": \"#0a7755\""), "got: {dtcg}");
    assert!(
        !dtcg.contains("oklch("),
        "a DTCG document stays hex: {dtcg}"
    );
}

/// The steps come out in the order they were handed over, not sorted as strings
/// — `"100"` sorts before `"50"`, which would read a ramp out of scale order.
#[test]
fn a_dtcg_export_keeps_the_ramp_in_scale_order() {
    let request = ExportRequest {
        ramps: vec![ExportRamp {
            family: "brand".to_string(),
            light: steps(&[("50", "#1"), ("100", "#2"), ("500", "#3")]),
            dark: steps(&[("50", "#4"), ("100", "#5"), ("500", "#6")]),
        }],
        roles: None,
        identity: None,
    };

    let dtcg = emit_export(&request, ExportFormat::Dtcg);
    let order: Vec<usize> = ["\"50\"", "\"100\"", "\"500\""]
        .iter()
        .map(|step| dtcg.find(step).expect("every step"))
        .collect();

    assert!(
        order[0] < order[1] && order[1] < order[2],
        "out of scale order: {dtcg}"
    );
}

/// D3: the roles ride in the same file, whichever format it is. A DTCG handoff
/// that dropped them would make the designer's solved semantics unreachable to
/// the CLI, which reads roles out of exactly this document.
#[test]
fn a_dtcg_export_carries_the_roles_too() {
    let dtcg = emit_export(&request(), ExportFormat::Dtcg);

    assert!(dtcg.contains("\"action\""), "got: {dtcg}");
    assert!(dtcg.contains("{color.brand.500}"), "got: {dtcg}");
}

/// D13: "where did these come from, and are they current" needs an answer that
/// travels with the file.
#[test]
fn a_dtcg_export_carries_the_identity_of_the_project_it_came_from() {
    let request = ExportRequest {
        identity: Some(ExportIdentity {
            project: "p-7f3".to_string(),
            name: "Kestrel".to_string(),
            engine: "0.1.0".to_string(),
            exported_at: "2026-09-17T10:00:00Z".to_string(),
        }),
        ..request()
    };

    let dtcg = emit_export(&request, ExportFormat::Dtcg);

    assert!(dtcg.contains("\"$extensions\""), "got: {dtcg}");
    assert!(dtcg.contains("\"p-7f3\""), "got: {dtcg}");
    assert!(dtcg.contains("\"Kestrel\""), "got: {dtcg}");
    assert!(dtcg.contains("\"2026-09-17T10:00:00Z\""), "got: {dtcg}");
}

/// The identity is metadata about the file, not a token in it, so it must not
/// reach a stylesheet as a custom property.
#[test]
fn a_stylesheet_export_leaves_the_identity_out() {
    let request = ExportRequest {
        identity: Some(ExportIdentity {
            project: "p-7f3".to_string(),
            name: "Kestrel".to_string(),
            engine: "0.1.0".to_string(),
            exported_at: "2026-09-17T10:00:00Z".to_string(),
        }),
        ..request()
    };

    let css = emit_export(&request, ExportFormat::Css);

    assert!(!css.contains("Kestrel"), "got: {css}");
    assert!(!css.contains("$extensions"), "got: {css}");
}

#[test]
fn each_format_serialises_the_same_palette_its_own_way() {
    let request = request();
    let css = emit_export(&request, ExportFormat::Css);
    let scss = emit_export(&request, ExportFormat::Scss);
    let tailwind = emit_export(&request, ExportFormat::Tailwind);

    assert!(scss.starts_with(&css), "SCSS is the CSS plus its variables");
    assert!(
        scss.contains("$primitiv-color-brand-500:"),
        "no SCSS variables: {scss}"
    );
    assert!(
        tailwind.starts_with(&css),
        "Tailwind is the CSS plus its preset"
    );
    assert!(
        tailwind.contains("@theme"),
        "no Tailwind preset: {tailwind}"
    );
}

#[test]
fn an_export_input_deserialises_into_a_request() {
    let input: ExportInput = serde_json::from_value(json!({
        "ramps": [{
            "family": "brand",
            "light": [{ "step": "500", "value": "#0a7755" }],
            "dark":  [{ "step": "500", "value": "#0a7755" }]
        }],
        "roles": { "light": {}, "dark": {} },
        "identity": {
            "project": "p-7f3",
            "name": "Kestrel",
            "engine": "0.1.0",
            "exportedAt": "2026-09-17T10:00:00Z"
        }
    }))
    .expect("the wire shape");

    let request: ExportRequest = input.into();

    assert_eq!(request.ramps.len(), 1);
    assert_eq!(request.ramps[0].family, "brand");
    assert_eq!(request.ramps[0].light[0].value, "#0a7755");
    assert_eq!(request.identity.unwrap().name, "Kestrel");
}

/// The two optional halves really are optional: a palette with no roles and no
/// identity is a complete request, which is what `--ramps-only`'s counterpart on
/// the plugin side and an un-named project both produce.
#[test]
fn an_export_input_needs_neither_roles_nor_identity() {
    let input: ExportInput = serde_json::from_value(json!({
        "ramps": [{ "family": "brand", "light": [], "dark": [] }]
    }))
    .expect("the wire shape");

    let request: ExportRequest = input.into();

    assert_eq!(request.roles, None);
    assert_eq!(request.identity, None);
}

#[test]
fn a_format_parses_from_its_name_and_rejects_anything_else() {
    assert_eq!(ExportFormat::parse("css"), Some(ExportFormat::Css));
    assert_eq!(ExportFormat::parse("scss"), Some(ExportFormat::Scss));
    assert_eq!(
        ExportFormat::parse("tailwind"),
        Some(ExportFormat::Tailwind)
    );
    assert_eq!(ExportFormat::parse("dtcg"), Some(ExportFormat::Dtcg));
    assert_eq!(ExportFormat::parse("json"), None);
}

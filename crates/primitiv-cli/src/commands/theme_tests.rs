use std::path::Path;

use harmoni_core::api::DEFAULT_STEPS;
use pretty_assertions::assert_eq;
use primitiv_emit::{
    ThemeRamps, emit_theme_ramps_css, emit_theme_ramps_scss, emit_theme_ramps_tailwind,
};

use crate::commands::theme::theme;
use crate::error::CliError;
use crate::format::Format;
use crate::ports::fs::{FileSystem, InMemoryFs};

/// The single brand seed most of these cases use, in the shape `theme` takes.
fn brand_seed() -> Vec<(String, String)> {
    vec![("brand".to_string(), "#0a7755".to_string())]
}

/// The emitter options for a seed at the default length — what the command emits,
/// so these cases compare against the emitter rather than a transcribed string.
fn at_default_length<'a>(seeds: &'a [(&'a str, &'a str)]) -> ThemeRamps<'a> {
    ThemeRamps {
        seeds,
        steps: 10,
        intent: &serde_json::Value::Null,
    }
}

/// A seed the engine cannot parse, for the rejection cases.
fn bad_seed() -> Vec<(String, String)> {
    vec![("brand".to_string(), "not-a-colour".to_string())]
}

#[test]
fn writes_the_brand_theme_css_to_the_out_path() {
    let fs = InMemoryFs::new();
    let out = Path::new("src/styles/primitiv.theme.css");

    theme(&fs, &brand_seed(), out, Format::Css, DEFAULT_STEPS).unwrap();

    let written = fs.read(out).unwrap();
    let expected = emit_theme_ramps_css(&at_default_length(&[("brand", "#0a7755")])).unwrap();
    assert_eq!(written, expected.into_bytes());
}

#[test]
fn writes_the_brand_theme_scss_when_the_format_is_scss() {
    let fs = InMemoryFs::new();
    let out = Path::new("src/styles/primitiv.theme.scss");

    theme(&fs, &brand_seed(), out, Format::Scss, DEFAULT_STEPS).unwrap();

    let written = fs.read(out).unwrap();
    let expected = emit_theme_ramps_scss(&at_default_length(&[("brand", "#0a7755")])).unwrap();
    assert_eq!(written, expected.into_bytes());
}

#[test]
fn writes_the_brand_theme_tailwind_when_the_format_is_tailwind() {
    let fs = InMemoryFs::new();
    let out = Path::new("src/styles/primitiv.theme.css");

    theme(&fs, &brand_seed(), out, Format::Tailwind, DEFAULT_STEPS).unwrap();

    let written = fs.read(out).unwrap();
    let expected = emit_theme_ramps_tailwind(&at_default_length(&[("brand", "#0a7755")])).unwrap();
    assert_eq!(written, expected.into_bytes());
}

#[test]
fn surfaces_an_invalid_brand_colour() {
    let fs = InMemoryFs::new();

    let err = theme(
        &fs,
        &bad_seed(),
        Path::new("out.css"),
        Format::Css,
        DEFAULT_STEPS,
    )
    .unwrap_err();

    assert!(matches!(err, CliError::InvalidColor(_)));
}

#[test]
fn surfaces_an_invalid_brand_colour_in_the_scss_path() {
    let fs = InMemoryFs::new();

    let err = theme(
        &fs,
        &bad_seed(),
        Path::new("out.scss"),
        Format::Scss,
        DEFAULT_STEPS,
    )
    .unwrap_err();

    assert!(matches!(err, CliError::InvalidColor(_)));
}

#[test]
fn surfaces_an_invalid_brand_colour_in_the_tailwind_path() {
    let fs = InMemoryFs::new();

    let err = theme(
        &fs,
        &bad_seed(),
        Path::new("out.css"),
        Format::Tailwind,
        DEFAULT_STEPS,
    )
    .unwrap_err();

    assert!(matches!(err, CliError::InvalidColor(_)));
}

#[test]
fn surfaces_a_write_failure() {
    let fs = InMemoryFs::new();
    let out = Path::new("out.css");
    fs.fail_writes_to(out);

    let err = theme(&fs, &brand_seed(), out, Format::Css, DEFAULT_STEPS).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn falls_back_to_the_configs_theme_seeds_when_no_flag_names_one() {
    let fs = InMemoryFs::new();
    fs.write(
        Path::new("primitiv.json"),
        br##"{
          "version": 1,
          "framework": "react",
          "styles": { "enabled": true, "format": "css", "path": "s" },
          "tokens": { "format": "css", "path": "t.css" },
          "theme": { "brand": "#0a7755", "danger": "#db2424" },
          "aliases": {},
          "registry": { "version": "0.1.0" }
        }"##,
    )
    .unwrap();
    let out = Path::new("primitiv.theme.css");

    theme(&fs, &[], out, Format::Css, DEFAULT_STEPS).unwrap();

    // This is what makes the brand `init` records load-bearing: it was parsed and
    // never read by any command before.
    let written = String::from_utf8(fs.read(out).unwrap()).unwrap();
    assert!(written.contains("--primitiv-color-brand-500"), "{written}");
    assert!(written.contains("--primitiv-color-danger-500"), "{written}");
}

#[test]
fn refuses_to_run_with_no_seed_from_either_a_flag_or_the_config() {
    let fs = InMemoryFs::new();

    let err = theme(
        &fs,
        &[],
        Path::new("primitiv.theme.css"),
        Format::Css,
        DEFAULT_STEPS,
    )
    .unwrap_err();

    match err {
        CliError::Usage(message) => {
            assert!(message.contains("--brand <colour>"), "{message}");
            assert!(message.contains("primitiv.json"), "{message}");
        }
        other => panic!("expected a usage error, got {other:?}"),
    }
}

#[test]
fn prefers_a_flag_over_the_configs_seed_for_that_family_only() {
    let fs = InMemoryFs::new();
    fs.write(
        Path::new("primitiv.json"),
        br##"{
          "version": 1,
          "framework": "react",
          "styles": { "enabled": true, "format": "css", "path": "s" },
          "tokens": { "format": "css", "path": "t.css" },
          "theme": { "brand": "#0a7755", "danger": "#db2424" },
          "aliases": {},
          "registry": { "version": "0.1.0" }
        }"##,
    )
    .unwrap();
    let out = Path::new("primitiv.theme.css");

    theme(
        &fs,
        &[("brand".to_string(), "#ff0066".to_string())],
        out,
        Format::Css,
        DEFAULT_STEPS,
    )
    .unwrap();

    // The flag replaces brand, and danger still comes from the config — a flag
    // re-seeds one family, it does not discard the rest.
    let expected = emit_theme_ramps_css(&at_default_length(&[
        ("brand", "#ff0066"),
        ("danger", "#db2424"),
    ]))
    .unwrap();
    assert_eq!(fs.read(out).unwrap(), expected.into_bytes());
}

#[test]
fn re_points_the_intent_roles_a_shorter_ramp_has_moved() {
    let fs = InMemoryFs::new();
    let out = Path::new("primitiv.theme.css");

    theme(&fs, &brand_seed(), out, Format::Css, 7).unwrap();

    // A seven-step ramp has no 600, so `action/primary/hover` — shipped as
    // `{color.brand.600}` — would resolve to nothing. The override file has to say
    // where that role goes instead, or a shorter ramp silently loses its hover
    // state.
    let written = String::from_utf8(fs.read(out).unwrap()).unwrap();
    assert!(
        written.contains("--primitiv-action-primary-hover: var(--primitiv-color-brand-700)"),
        "{written}"
    );
}

#[test]
fn leaves_the_semantic_layer_alone_at_the_default_length() {
    let fs = InMemoryFs::new();
    let out = Path::new("primitiv.theme.css");

    theme(&fs, &brand_seed(), out, Format::Css, DEFAULT_STEPS).unwrap();

    // Ten steps carry every decade the shipped Intent layer names, so a project on
    // the default scale gets ramps and nothing else.
    let written = String::from_utf8(fs.read(out).unwrap()).unwrap();
    assert!(!written.contains("--primitiv-action-"), "{written}");
}

#[test]
fn refuses_a_step_count_the_engine_does_not_support() {
    let fs = InMemoryFs::new();

    let err = theme(&fs, &brand_seed(), Path::new("x.css"), Format::Css, 2).unwrap_err();

    assert!(matches!(err, CliError::Usage(_)), "{err:?}");
    assert!(err.to_string().contains("between 3 and 32"), "{err}");
}

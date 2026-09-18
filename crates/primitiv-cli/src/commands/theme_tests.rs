use std::path::Path;

use harmoni_core::api::DEFAULT_STEPS;
use pretty_assertions::assert_eq;
use primitiv_emit::{
    ThemeRamps, emit_theme_ramps_css, emit_theme_ramps_scss, emit_theme_ramps_tailwind,
};

use crate::commands::theme::{theme, theme_stem};
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
        neutral: None,
        roles: None,
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

    theme(
        &fs,
        &brand_seed(),
        Some(out),
        Some(Format::Css),
        DEFAULT_STEPS,
    )
    .unwrap();

    let written = fs.read(out).unwrap();
    let expected = emit_theme_ramps_css(&at_default_length(&[("brand", "#0a7755")])).unwrap();
    assert_eq!(written, expected.into_bytes());
}

#[test]
fn writes_the_brand_theme_scss_when_the_format_is_scss() {
    let fs = InMemoryFs::new();
    let out = Path::new("src/styles/primitiv.theme.scss");

    theme(
        &fs,
        &brand_seed(),
        Some(out),
        Some(Format::Scss),
        DEFAULT_STEPS,
    )
    .unwrap();

    let written = fs.read(out).unwrap();
    let expected = emit_theme_ramps_scss(&at_default_length(&[("brand", "#0a7755")])).unwrap();
    assert_eq!(written, expected.into_bytes());
}

#[test]
fn writes_the_brand_theme_tailwind_when_the_format_is_tailwind() {
    let fs = InMemoryFs::new();
    let out = Path::new("src/styles/primitiv.theme.css");

    theme(
        &fs,
        &brand_seed(),
        Some(out),
        Some(Format::Tailwind),
        DEFAULT_STEPS,
    )
    .unwrap();

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
        Some(Path::new("out.css")),
        Some(Format::Css),
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
        Some(Path::new("out.scss")),
        Some(Format::Scss),
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
        Some(Path::new("out.css")),
        Some(Format::Tailwind),
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

    let err = theme(
        &fs,
        &brand_seed(),
        Some(out),
        Some(Format::Css),
        DEFAULT_STEPS,
    )
    .unwrap_err();

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

    theme(&fs, &[], Some(out), Some(Format::Css), DEFAULT_STEPS).unwrap();

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
        Some(Path::new("primitiv.theme.css")),
        Some(Format::Css),
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
        Some(out),
        Some(Format::Css),
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

    theme(&fs, &brand_seed(), Some(out), Some(Format::Css), 7).unwrap();

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

    theme(
        &fs,
        &brand_seed(),
        Some(out),
        Some(Format::Css),
        DEFAULT_STEPS,
    )
    .unwrap();

    // Ten steps carry every decade the shipped Intent layer names, so a project on
    // the default scale gets ramps and nothing else.
    let written = String::from_utf8(fs.read(out).unwrap()).unwrap();
    assert!(!written.contains("--primitiv-action-"), "{written}");
}

#[test]
fn refuses_a_step_count_the_engine_does_not_support() {
    let fs = InMemoryFs::new();

    let err = theme(
        &fs,
        &brand_seed(),
        Some(Path::new("x.css")),
        Some(Format::Css),
        2,
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Usage(_)), "{err:?}");
    assert!(err.to_string().contains("between 3 and 32"), "{err}");
}

#[test]
fn writes_the_projects_neutral_ramp_from_the_config() {
    let fs = InMemoryFs::new();
    fs.write(
        Path::new("primitiv.json"),
        br##"{
          "version": 1,
          "framework": "react",
          "styles": { "enabled": true, "format": "css", "path": "s" },
          "tokens": { "format": "css", "path": "t.css" },
          "theme": {
            "brand": "#0a7755",
            "neutral": { "tint": { "source": "brand", "strength": 0.5 } }
          },
          "aliases": {},
          "registry": { "version": "0.1.0" }
        }"##,
    )
    .unwrap();
    let out = Path::new("primitiv.theme.css");

    theme(&fs, &[], Some(out), Some(Format::Css), DEFAULT_STEPS).unwrap();

    // The ramp a seed cannot express now reaches the stylesheet, tinted by the
    // brand it was told to follow.
    let written = String::from_utf8(fs.read(out).unwrap()).unwrap();
    assert_eq!(
        written.matches("--primitiv-color-neutral-500:").count(),
        2,
        "{written}"
    );
    // Tinted, not grey: the brand's own hue reaches the anchors.
    assert!(
        written.contains("--primitiv-color-neutral-50: oklch(0.99 0."),
        "{written}"
    );
}

#[test]
fn surfaces_a_malformed_neutral_block_rather_than_ignoring_it() {
    let fs = InMemoryFs::new();
    fs.write(
        Path::new("primitiv.json"),
        br##"{
          "version": 1, "framework": "react",
          "styles": { "enabled": true, "format": "css", "path": "s" },
          "tokens": { "format": "css", "path": "t.css" },
          "theme": { "brand": "#0a7755", "neutral": "#888888" },
          "aliases": {}, "registry": { "version": "0.1.0" }
        }"##,
    )
    .unwrap();

    let err = theme(
        &fs,
        &[],
        Some(Path::new("x.css")),
        Some(Format::Css),
        DEFAULT_STEPS,
    )
    .unwrap_err();

    // The command stops rather than writing a file whose greys silently came from
    // somewhere other than the config the consumer wrote.
    assert!(matches!(err, CliError::Usage(_)), "{err:?}");
}

#[test]
fn theme_stem_names_the_file_after_the_project() {
    assert_eq!(theme_stem("Acme Brand"), "acme-brand.theme");
}

#[test]
fn theme_stem_falls_back_to_primitiv_for_an_unnamed_project() {
    // A config with no name (or nothing sluggable) keeps the `primitiv.theme` naming
    // every existing project already has, rather than the plugin's `harmoni` fallback.
    assert_eq!(theme_stem(""), "primitiv.theme");
}

#[test]
fn names_the_theme_file_after_the_configs_project_name() {
    let fs = InMemoryFs::new();
    fs.write(
        Path::new("primitiv.json"),
        br##"{
          "version": 1,
          "name": "Acme Brand",
          "framework": "react",
          "styles": { "enabled": true, "format": "css", "path": "s" },
          "tokens": { "format": "css", "path": "src/styles/tokens.css" },
          "theme": { "brand": "#0a7755" },
          "aliases": {},
          "registry": { "version": "0.1.0" }
        }"##,
    )
    .unwrap();

    theme(&fs, &brand_seed(), None, None, DEFAULT_STEPS).unwrap();

    // Beside the token layer, but under the project's slug rather than `primitiv`,
    // so it matches the file the plugin exports for the same project.
    assert!(fs.exists(Path::new("src/styles/acme-brand.theme.css")));
    assert!(!fs.exists(Path::new("src/styles/primitiv.theme.css")));
}

/// A `primitiv.json` recording a token layer at `src/styles/tokens.<ext>`.
fn config_with(format: &str, path: &str) -> InMemoryFs {
    let fs = InMemoryFs::new();
    fs.write(
        Path::new("primitiv.json"),
        format!(
            r##"{{
          "version": 1,
          "framework": "react",
          "styles": {{ "enabled": true, "format": "css", "path": "s" }},
          "tokens": {{ "format": "{format}", "path": "{path}" }},
          "theme": {{ "brand": "#0a7755" }},
          "aliases": {{}},
          "registry": {{ "version": "0.1.0" }}
        }}"##
        )
        .as_bytes(),
    )
    .unwrap();
    fs
}

/// The handoff command should carry nothing the project already knows (RFC 0032
/// §5 step 3). Both of these are recorded in `primitiv.json`, so requiring them
/// again on every run is the CLI asking a question it can answer.
#[test]
fn writes_beside_the_recorded_token_layer_when_no_out_is_given() {
    let fs = config_with("css", "src/styles/tokens.css");

    theme(&fs, &brand_seed(), None, None, DEFAULT_STEPS).unwrap();

    // Beside the token layer, under the name the token layer imports — not just
    // any default path, because `tokens`' own `@import` looks for exactly this.
    assert!(fs.exists(Path::new("src/styles/primitiv.theme.css")));
}

#[test]
fn takes_the_recorded_token_format_when_no_format_is_given() {
    let fs = config_with("scss", "src/styles/tokens.scss");

    theme(&fs, &brand_seed(), None, None, DEFAULT_STEPS).unwrap();

    let written = String::from_utf8(
        fs.read(Path::new("src/styles/primitiv.theme.scss"))
            .unwrap(),
    )
    .unwrap();
    // The SCSS adapter's tell: the canonical CSS followed by resolving variables.
    assert!(written.contains("$primitiv-color-brand-500:"), "{written}");
}

#[test]
fn an_explicit_out_still_wins_over_the_recorded_one() {
    let fs = config_with("css", "src/styles/tokens.css");
    let out = Path::new("somewhere/else.css");

    theme(
        &fs,
        &brand_seed(),
        Some(out),
        Some(Format::Css),
        DEFAULT_STEPS,
    )
    .unwrap();

    assert!(fs.exists(out));
    assert!(!fs.exists(Path::new("src/styles/primitiv.theme.css")));
}

#[test]
fn refuses_to_guess_a_destination_with_no_out_and_no_config() {
    // The refusal the parser used to make, moved to where the config is in hand.
    // Writing `primitiv.theme.css` into whatever directory the shell happens to be
    // in is not a default, it is a surprise — and it would be a file nothing imports.
    let fs = InMemoryFs::new();

    let err = theme(&fs, &brand_seed(), None, None, DEFAULT_STEPS).unwrap_err();

    match err {
        CliError::Usage(message) => {
            assert!(message.contains("--out"), "{message}");
            assert!(message.contains("primitiv.json"), "{message}");
        }
        other => panic!("expected a usage error, got {other:?}"),
    }
}

/// The two flags resolve independently, so naming one does not force the other.
/// Worth stating separately from the both-and-neither cases: a single
/// "did the caller supply everything" check would pass those two and still make a
/// half-specified command fall back on the wrong half.
#[test]
fn takes_an_explicit_out_while_still_reading_the_recorded_format() {
    let fs = config_with("scss", "src/styles/tokens.scss");
    let out = Path::new("elsewhere/theme.scss");

    theme(&fs, &brand_seed(), Some(out), None, DEFAULT_STEPS).unwrap();

    let written = String::from_utf8(fs.read(out).unwrap()).unwrap();
    assert!(written.contains("$primitiv-color-brand-500:"), "{written}");
}

#[test]
fn takes_an_explicit_format_while_still_resolving_where_to_put_it() {
    let fs = config_with("css", "src/styles/tokens.css");

    theme(&fs, &brand_seed(), None, Some(Format::Scss), DEFAULT_STEPS).unwrap();

    // The named format decides the extension too, so the file lands beside the
    // token layer under the name that format's token layer would import.
    assert!(fs.exists(Path::new("src/styles/primitiv.theme.scss")));
}

#[test]
fn surfaces_a_failure_to_locate_the_working_directory() {
    // Resolving what the flags left out starts by finding the nearest config, and
    // that starts from the working directory. When the OS cannot say where that
    // is, the run fails as I/O rather than falling back to a guessed destination.
    let fs = InMemoryFs::new();
    fs.fail_current_dir();

    let err = theme(&fs, &brand_seed(), None, None, DEFAULT_STEPS).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn errors_on_a_malformed_config_rather_than_falling_back_past_it() {
    // A MISSING config is fine — it just means there is nothing to fall back on.
    // A malformed one is not: silently treating it as absent would write the
    // overrides somewhere the project did not ask for, using a format it did not
    // choose, and the broken file would stay broken and unmentioned.
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), b"{ not json").unwrap();

    let err = theme(&fs, &brand_seed(), None, None, DEFAULT_STEPS).unwrap_err();

    assert!(!matches!(err, CliError::Usage(_)), "{err:?}");
}

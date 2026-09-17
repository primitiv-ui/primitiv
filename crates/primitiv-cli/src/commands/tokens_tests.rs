use std::path::Path;

use crate::commands::tokens::tokens;
use crate::error::CliError;
use crate::format::Format;
use crate::ports::fs::{FileSystem, InMemoryFs};
use crate::ports::output::InMemoryOutput;

/// A `primitiv.json` whose `tokens.path` the command falls back to when `--out`
/// is omitted (RFC 0005 §2.3 / §3.1).
const CONFIG: &[u8] = br##"{
  "version": 1,
  "framework": "react",
  "styles": { "enabled": true, "format": "css", "path": "src/styles/primitiv" },
  "tokens": { "format": "css", "path": "src/styles/from-config.css" },
  "theme": { "brand": "#0a7755" },
  "aliases": {},
  "registry": { "version": "0.1.0" }
}"##;

/// A config whose `tokens.format` is `scss`, to drive defaulting the *format*
/// from `primitiv.json` when `--format` is omitted.
const CONFIG_SCSS: &[u8] = br##"{
  "version": 1,
  "framework": "react",
  "styles": { "enabled": true, "format": "scss", "path": "src/styles/primitiv" },
  "tokens": { "format": "scss", "path": "src/styles/from-config.scss" },
  "theme": { "brand": "#0a7755" },
  "aliases": {},
  "registry": { "version": "0.1.0" }
}"##;

#[test]
fn writes_the_design_system_token_layer_as_css() {
    let fs = InMemoryFs::new();
    let stdout = InMemoryOutput::new();
    let out = Path::new("src/styles/primitiv/tokens.css");

    tokens(&fs, &stdout, Some(Format::Css), Some(out), None).unwrap();

    let written = String::from_utf8(fs.read(out).unwrap()).unwrap();
    // The cascade-layer declaration (RFC 0008) heads the file.
    assert!(written.contains(
        "@layer primitiv.reset, primitiv.tokens, primitiv.theme, primitiv.base, primitiv.variants, primitiv.states;"
    ));
    // A real primitive routed into the base :root block (space-4 = 4px → 0.25rem).
    assert!(written.contains("--primitiv-space-space-4: 0.25rem;"));
    // The theme and density axes are scoped (palette/intent and context routed).
    assert!(written.contains("[data-theme=\"dark\"]"));
    assert!(written.contains("[data-density="));
}

#[test]
fn writes_the_token_layer_as_scss_when_the_format_is_scss() {
    let fs = InMemoryFs::new();
    let stdout = InMemoryOutput::new();
    let out = Path::new("src/styles/primitiv/tokens.scss");

    tokens(&fs, &stdout, Some(Format::Scss), Some(out), None).unwrap();

    let written = String::from_utf8(fs.read(out).unwrap()).unwrap();
    // The SCSS surface is the canonical CSS plus resolving $primitiv-* variables.
    assert!(written.contains("@layer primitiv.reset"));
    assert!(written.contains("$primitiv-space-space-4: var(--primitiv-space-space-4);"));
}

#[test]
fn writes_the_token_layer_as_a_tailwind_preset_when_the_format_is_tailwind() {
    let fs = InMemoryFs::new();
    let stdout = InMemoryOutput::new();
    let out = Path::new("src/styles/primitiv/tokens.css");

    tokens(&fs, &stdout, Some(Format::Tailwind), Some(out), None).unwrap();

    let written = String::from_utf8(fs.read(out).unwrap()).unwrap();
    // The Tailwind v4 @theme preset maps names onto Tailwind namespaces.
    assert!(written.contains("@theme {"));
    assert!(written.contains("--spacing-space-4: var(--primitiv-space-space-4);"));
}

#[test]
fn writes_a_companion_base_stylesheet_imported_by_the_token_layer() {
    let fs = InMemoryFs::new();
    let stdout = InMemoryOutput::new();
    let out = Path::new("src/styles/primitiv/tokens.css");

    tokens(&fs, &stdout, Some(Format::Css), Some(out), None).unwrap();

    // The base element styles ship as a sibling file the token layer imports, so
    // the foundation is one @import away (RFC 0008 §7).
    let base = String::from_utf8(
        fs.read(Path::new("src/styles/primitiv/primitiv-base.css"))
            .unwrap(),
    )
    .unwrap();
    assert!(base.contains("transform: skewX(-10deg)"));
    // The import leads the token file (CSS requires @import before other rules).
    let main = String::from_utf8(fs.read(out).unwrap()).unwrap();
    assert!(main.starts_with("@import \"./primitiv-base.css\";"));
}

#[test]
fn writes_the_base_companion_as_scss_for_the_scss_format() {
    let fs = InMemoryFs::new();
    let stdout = InMemoryOutput::new();
    let out = Path::new("src/styles/primitiv/tokens.scss");

    tokens(&fs, &stdout, Some(Format::Scss), Some(out), None).unwrap();

    // SCSS gets the .scss mirror so a Sass pipeline imports a partial.
    assert!(fs.exists(Path::new("src/styles/primitiv/primitiv-base.scss")));
    let main = String::from_utf8(fs.read(out).unwrap()).unwrap();
    assert!(main.starts_with("@import \"./primitiv-base.scss\";"));
}

#[test]
fn writes_the_css_base_companion_for_the_tailwind_format() {
    let fs = InMemoryFs::new();
    let stdout = InMemoryOutput::new();
    let out = Path::new("src/styles/primitiv/tokens.css");

    tokens(&fs, &stdout, Some(Format::Tailwind), Some(out), None).unwrap();

    // Tailwind shares the canonical CSS sheet; the import precedes the @theme block.
    assert!(fs.exists(Path::new("src/styles/primitiv/primitiv-base.css")));
    let main = String::from_utf8(fs.read(out).unwrap()).unwrap();
    assert!(main.starts_with("@import \"./primitiv-base.css\";"));
}

#[test]
fn inlines_the_base_layer_when_streaming_to_stdout() {
    let fs = InMemoryFs::new();
    let stdout = InMemoryOutput::new();
    fs.set_current_dir(Path::new("project"));

    // No file to host a sibling, so the streamed foundation carries the base inline.
    tokens(&fs, &stdout, Some(Format::Css), None, None).unwrap();

    let streamed = String::from_utf8(stdout.captured()).unwrap();
    assert!(streamed.contains("transform: skewX(-10deg)"));
}

#[test]
fn surfaces_a_base_companion_write_failure() {
    let fs = InMemoryFs::new();
    let stdout = InMemoryOutput::new();
    let out = Path::new("src/styles/primitiv/tokens.css");
    fs.fail_writes_to(Path::new("src/styles/primitiv/primitiv-base.css"));

    let err = tokens(&fs, &stdout, Some(Format::Css), Some(out), None).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn surfaces_a_breakpoints_companion_write_failure() {
    let fs = InMemoryFs::new();
    let stdout = InMemoryOutput::new();
    let out = Path::new("src/styles/primitiv/tokens.css");
    fs.fail_writes_to(Path::new("src/styles/primitiv/breakpoints.ts"));

    let err = tokens(&fs, &stdout, Some(Format::Css), Some(out), None).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn falls_back_to_the_config_path_when_out_is_omitted() {
    let fs = InMemoryFs::new();
    let stdout = InMemoryOutput::new();
    fs.set_current_dir(Path::new("project"));
    fs.write(Path::new("project/primitiv.json"), CONFIG)
        .unwrap();

    tokens(&fs, &stdout, Some(Format::Css), None, None).unwrap();

    // Written to the config's tokens.path, resolved by walking up from the cwd.
    let written =
        String::from_utf8(fs.read(Path::new("src/styles/from-config.css")).unwrap()).unwrap();
    assert!(written.contains("@layer primitiv.reset"));
}

#[test]
fn defaults_the_format_from_the_config_when_it_is_omitted() {
    let fs = InMemoryFs::new();
    let stdout = InMemoryOutput::new();
    fs.set_current_dir(Path::new("project"));
    fs.write(Path::new("project/primitiv.json"), CONFIG_SCSS)
        .unwrap();

    // Neither flag given: both the format (scss) and the path come from config.
    tokens(&fs, &stdout, None, None, None).unwrap();

    let written =
        String::from_utf8(fs.read(Path::new("src/styles/from-config.scss")).unwrap()).unwrap();
    assert!(written.contains("$primitiv-space-space-4: var(--primitiv-space-space-4);"));
}

#[test]
fn defaults_the_format_to_css_when_omitted_and_no_config_exists() {
    let fs = InMemoryFs::new();
    let stdout = InMemoryOutput::new();
    fs.set_current_dir(Path::new("project"));
    let out = Path::new("tokens.css");

    // --out given, --format omitted, no config: CSS is the canonical fallback.
    tokens(&fs, &stdout, None, Some(out), None).unwrap();

    let written = String::from_utf8(fs.read(out).unwrap()).unwrap();
    assert!(written.contains("@layer primitiv.reset"));
    assert!(written.contains("--primitiv-space-space-4: 0.25rem;"));
}

#[test]
fn streams_to_stdout_when_neither_out_nor_a_config_is_present() {
    let fs = InMemoryFs::new();
    let stdout = InMemoryOutput::new();
    fs.set_current_dir(Path::new("project"));

    // Principle 4: a fully config-less `tokens --format css` writes to stdout.
    tokens(&fs, &stdout, Some(Format::Css), None, None).unwrap();

    let streamed = String::from_utf8(stdout.captured()).unwrap();
    assert!(streamed.contains("@layer primitiv.reset"));
    assert!(streamed.contains("--primitiv-space-space-4: 0.25rem;"));
    // Nothing was written to disk.
    assert!(!fs.exists(Path::new("project/tokens.css")));
}

#[test]
fn surfaces_a_write_failure_to_the_config_path() {
    let fs = InMemoryFs::new();
    let stdout = InMemoryOutput::new();
    fs.set_current_dir(Path::new("project"));
    fs.write(Path::new("project/primitiv.json"), CONFIG)
        .unwrap();
    fs.fail_writes_to(Path::new("src/styles/from-config.css"));

    // --out omitted, config present: the write targets the config's tokens.path.
    let err = tokens(&fs, &stdout, Some(Format::Css), None, None).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn surfaces_a_stdout_write_failure() {
    let fs = InMemoryFs::new();
    let stdout = InMemoryOutput::new();
    fs.set_current_dir(Path::new("project"));
    stdout.fail_stdout();

    // Config-less, so the layer routes to stdout — a broken stream surfaces as I/O.
    let err = tokens(&fs, &stdout, Some(Format::Css), None, None).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn errors_on_a_malformed_config_even_when_out_is_given() {
    let fs = InMemoryFs::new();
    let stdout = InMemoryOutput::new();
    fs.set_current_dir(Path::new("project"));
    fs.write(Path::new("project/primitiv.json"), b"{ not json }")
        .unwrap();

    // --format omitted forces a config read; a broken file is never ignored.
    let err = tokens(&fs, &stdout, None, Some(Path::new("tokens.css")), None).unwrap_err();

    assert!(matches!(err, CliError::Config(_)));
}

#[test]
fn errors_when_out_is_omitted_and_the_working_directory_is_unavailable() {
    let fs = InMemoryFs::new();
    let stdout = InMemoryOutput::new();
    fs.fail_current_dir();

    let err = tokens(&fs, &stdout, Some(Format::Css), None, None).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn surfaces_a_write_failure() {
    let fs = InMemoryFs::new();
    let stdout = InMemoryOutput::new();
    let out = Path::new("tokens.css");
    fs.fail_writes_to(out);

    let err = tokens(&fs, &stdout, Some(Format::Css), Some(out), None).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn imports_the_theme_overrides_when_that_file_is_there() {
    let fs = InMemoryFs::new();
    let out = Path::new("src/styles/primitiv/tokens.css");
    fs.write(
        Path::new("src/styles/primitiv/primitiv.theme.css"),
        b"@layer primitiv.theme { :root { --primitiv-color-brand-500: red; } }",
    )
    .unwrap();

    tokens(
        &fs,
        &InMemoryOutput::new(),
        Some(Format::Css),
        Some(out),
        None,
    )
    .unwrap();

    // A project that seeded its own ramps has a theme file beside the token layer,
    // and nothing else imports it — so the token layer has to, or the seeds are
    // written and never loaded. `tokens` owns this file's imports, which is why the
    // line is added here rather than by whoever wrote the theme file: re-running
    // `primitiv tokens` rewrites the whole file and would drop it.
    let main = String::from_utf8(fs.read(out).unwrap()).unwrap();
    assert!(main.contains("@import \"./primitiv.theme.css\";"), "{main}");
    // Both imports lead the file — CSS requires @import before any other rule.
    let first_rule = main.find("@layer").unwrap();
    assert!(
        main.find("primitiv.theme.css").unwrap() < first_rule,
        "{main}"
    );
}

#[test]
fn does_not_import_theme_overrides_when_no_config_exists() {
    let fs = InMemoryFs::new();
    let out = Path::new("tokens.css");

    tokens(
        &fs,
        &InMemoryOutput::new(),
        Some(Format::Css),
        Some(out),
        None,
    )
    .unwrap();

    // No config means no seeds, so there is no theme file to import — an import of a
    // file that does not exist is a build error in every bundler. Checked as the
    // import line, not the bare name: the layer-order statement names the
    // `primitiv.theme` *layer* in every token file, seeded or not.
    let main = String::from_utf8(fs.read(out).unwrap()).unwrap();
    assert!(!main.contains("@import \"./primitiv.theme"), "{main}");
}

#[test]
fn does_not_import_theme_overrides_that_do_not_exist() {
    let fs = InMemoryFs::new();
    // A config carrying a seed but no theme file beside the token layer — exactly
    // what a default `init` leaves, since it records the shipped brand and writes no
    // override for it.
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    let out = Path::new("src/styles/primitiv/tokens.css");

    tokens(
        &fs,
        &InMemoryOutput::new(),
        Some(Format::Css),
        Some(out),
        None,
    )
    .unwrap();

    // The import has to track the file, not the config: importing a stylesheet that
    // is not there fails the build in every bundler, and "the config names a seed" is
    // not the same question as "an override file exists".
    let main = String::from_utf8(fs.read(out).unwrap()).unwrap();
    assert!(!main.contains("@import \"./primitiv.theme"), "{main}");
}

/// A designer's palette as `primitiv dtcg` writes one (RFC 0032 D1/D7) — ramps
/// per mode, under `color`, in hex.
const PALETTE: &[u8] = br##"{
  "light": { "color": { "brand": { "500": { "$type": "color", "$value": "#0a7755" } } } },
  "dark":  { "color": { "brand": { "500": { "$type": "color", "$value": "#4ab88c" } } } }
}"##;

/// D9: one command does both layers. The override file has to be written *before*
/// the token layer, because `leading_imports` decides whether to emit the
/// `@import` by asking whether that file is there.
#[test]
fn writes_the_palettes_overrides_beside_the_token_layer_and_imports_them() {
    let fs = InMemoryFs::new();
    let stdout = InMemoryOutput::new();
    fs.write(Path::new("primitiv.palette.json"), PALETTE)
        .unwrap();
    let out = Path::new("src/styles/primitiv/tokens.css");

    tokens(
        &fs,
        &stdout,
        Some(Format::Css),
        Some(out),
        Some(Path::new("primitiv.palette.json")),
    )
    .unwrap();

    let overrides = String::from_utf8(
        fs.read(Path::new("src/styles/primitiv/primitiv.theme.css"))
            .unwrap(),
    )
    .unwrap();
    assert!(
        overrides.contains("--primitiv-color-brand-500: oklch("),
        "the palette's ramp should reach the override layer, got: {overrides}"
    );
    let layer = String::from_utf8(fs.read(out).unwrap()).unwrap();
    assert!(
        layer.contains("@import \"./primitiv.theme.css\";"),
        "the token layer should import the overrides it just wrote"
    );
}

/// The values path reaches all three formats (RFC 0032 §5 step 2), so the
/// override file has to follow the token layer's own extension — a `.css` theme
/// beside a `.scss` token layer is a file the `@import` does not name.
#[test]
fn names_the_override_file_after_the_formats_own_extension() {
    for (format, name) in [
        (Format::Scss, "primitiv.theme.scss"),
        (Format::Tailwind, "primitiv.theme.css"),
    ] {
        let fs = InMemoryFs::new();
        fs.write(Path::new("primitiv.palette.json"), PALETTE)
            .unwrap();
        let out = Path::new(&format!("tokens.{}", format.extension())).to_path_buf();

        tokens(
            &fs,
            &InMemoryOutput::new(),
            Some(format),
            Some(&out),
            Some(Path::new("primitiv.palette.json")),
        )
        .unwrap();

        let overrides = String::from_utf8(fs.read(Path::new(name)).unwrap()).unwrap();
        assert!(
            overrides.contains("--primitiv-color-brand-500:"),
            "{format:?} should write its ramps to {name}, got: {overrides}"
        );
    }
}

/// A reference naming a file that is not there is a broken project, and D8's
/// warn-and-continue is about missing *coverage*, not a missing document.
/// Carrying on would emit Primitiv's own ramps under a config that says the
/// palette was applied — silently shipping the wrong colours, which is the class
/// of failure this whole handoff exists to remove.
#[test]
fn errors_when_the_reference_names_a_palette_that_is_not_there() {
    let fs = InMemoryFs::new();

    let err = tokens(
        &fs,
        &InMemoryOutput::new(),
        Some(Format::Css),
        Some(Path::new("tokens.css")),
        Some(Path::new("gone.json")),
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Io(_)), "got: {err}");
}

/// A palette that cannot be read stops the run rather than emitting a token layer
/// the config claims was re-skinned — and the message names the palette, not the
/// config, because that is the file the consumer has to go and fix.
#[test]
fn surfaces_a_malformed_palette_document() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.palette.json"), b"{ not json")
        .unwrap();

    let err = tokens(
        &fs,
        &InMemoryOutput::new(),
        Some(Format::Css),
        Some(Path::new("tokens.css")),
        Some(Path::new("primitiv.palette.json")),
    )
    .unwrap_err();

    assert!(
        matches!(&err, CliError::Config(message) if message.contains("primitiv.palette.json")),
        "got: {err}"
    );
}

/// The override layer is written before the token layer, so a failure there has
/// to stop the run — carrying on would leave a token layer importing a file that
/// was never written.
#[test]
fn surfaces_an_override_write_failure() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.palette.json"), PALETTE)
        .unwrap();
    fs.fail_writes_to(Path::new("primitiv.theme.css"));

    let err = tokens(
        &fs,
        &InMemoryOutput::new(),
        Some(Format::Css),
        Some(Path::new("tokens.css")),
        Some(Path::new("primitiv.palette.json")),
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Io(_)), "got: {err}");
}

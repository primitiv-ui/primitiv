use std::path::Path;

use pretty_assertions::assert_eq;
use primitiv_emit::{ThemeRamps, emit_theme_ramps_css};

use crate::error::CliError;
use crate::ports::fs::{FileSystem, InMemoryFs};
use crate::ports::output::InMemoryOutput;
use crate::ports::process::InMemoryProcessRunner;
use crate::ports::prompt::OsPrompt;
use crate::ports::registry::EmbeddedRegistry;
use crate::run::run;

fn args(parts: &[&str]) -> Vec<String> {
    parts.iter().map(|part| part.to_string()).collect()
}

#[test]
fn dispatches_the_theme_command_and_writes_the_file() {
    let fs = InMemoryFs::new();
    let stdout = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    run(
        &fs,
        &stdout,
        &EmbeddedRegistry,
        &runner,
        &OsPrompt,
        false,
        &args(&["theme", "--brand", "#0a7755", "--out", "out.css"]),
    )
    .unwrap();

    let written = fs.read(Path::new("out.css")).unwrap();
    assert_eq!(
        written,
        emit_theme_ramps_css(&ThemeRamps {
            seeds: &[("brand", "#0a7755")],
            steps: 10,
            intent: &serde_json::Value::Null,
            neutral: None,
            roles: None,
        })
        .unwrap()
        .into_bytes()
    );
}

#[test]
fn dispatches_the_init_command_and_writes_the_config() {
    let fs = InMemoryFs::new();
    let stdout = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    fs.write(Path::new("package.json"), b"{}").unwrap();

    run(
        &fs,
        &stdout,
        &EmbeddedRegistry,
        &runner,
        &OsPrompt,
        false,
        &args(&["init"]),
    )
    .unwrap();

    let written = String::from_utf8(fs.read(Path::new("primitiv.json")).unwrap()).unwrap();
    assert!(written.contains("\"$schema\": \"https://primitiv-ui.dev/schema/primitiv.json\""));
}

#[test]
fn dispatches_the_list_command_and_streams_the_registry() {
    let fs = InMemoryFs::new();
    let stdout = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    run(
        &fs,
        &stdout,
        &EmbeddedRegistry,
        &runner,
        &OsPrompt,
        false,
        &args(&["list"]),
    )
    .unwrap();

    let streamed = String::from_utf8(stdout.captured()).unwrap();
    assert!(streamed.contains("button"));
}

#[test]
fn dispatches_the_add_command_and_reports_the_plan() {
    let fs = InMemoryFs::new();
    let stdout = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    run(
        &fs,
        &stdout,
        &EmbeddedRegistry,
        &runner,
        &OsPrompt,
        false,
        &args(&["add", "button"]),
    )
    .unwrap();

    let reported = String::from_utf8(stdout.captured()).unwrap();
    assert!(reported.contains("Resolved 1 component to add:"));
    assert!(reported.contains("button"));
}

#[test]
fn dispatches_the_tokens_command_and_writes_the_file() {
    let fs = InMemoryFs::new();
    let stdout = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    run(
        &fs,
        &stdout,
        &EmbeddedRegistry,
        &runner,
        &OsPrompt,
        false,
        &args(&["tokens", "--out", "tokens.css"]),
    )
    .unwrap();

    let written = String::from_utf8(fs.read(Path::new("tokens.css")).unwrap()).unwrap();
    assert!(written.contains("@layer primitiv.tokens"));
}

#[test]
fn propagates_a_parse_error() {
    let fs = InMemoryFs::new();
    let stdout = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    let err = run(
        &fs,
        &stdout,
        &EmbeddedRegistry,
        &runner,
        &OsPrompt,
        false,
        &args(&["bogus"]),
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Usage(_)));
}

fn help_for(invocation: &[&str]) -> String {
    let stdout = InMemoryOutput::new();
    run(
        &InMemoryFs::new(),
        &stdout,
        &EmbeddedRegistry,
        &InMemoryProcessRunner::new(),
        &OsPrompt,
        false,
        &args(invocation),
    )
    .unwrap();
    String::from_utf8(stdout.captured()).unwrap()
}

#[test]
fn prints_an_overview_naming_every_command_for_a_top_level_help_request() {
    let help = help_for(&["--help"]);

    assert!(help.starts_with("Usage: primitiv <command> [options]\n"), "{help}");
    for command in crate::cli::COMMANDS {
        assert!(help.contains(&format!("\n  {command} ")), "{command} missing from:\n{help}");
    }
}

#[test]
fn prints_one_commands_usage_for_a_command_help_request() {
    let help = help_for(&["add", "--help"]);

    assert!(help.starts_with("Usage: primitiv add <component...> | --all [options]\n"), "{help}");
    assert!(help.contains("--dry-run"), "{help}");
}

#[test]
fn prints_usage_for_every_command() {
    for command in crate::cli::COMMANDS {
        let help = help_for(&[command, "--help"]);

        assert!(help.starts_with(&format!("Usage: primitiv {command} ")), "{help}");
    }
}

#[test]
fn reports_a_failed_help_write_as_an_io_error() {
    let stdout = InMemoryOutput::new();
    stdout.fail_stdout();

    let error = run(
        &InMemoryFs::new(),
        &stdout,
        &EmbeddedRegistry,
        &InMemoryProcessRunner::new(),
        &OsPrompt,
        false,
        &args(&["--help"]),
    )
    .unwrap_err();

    assert!(matches!(error, CliError::Io(_)), "{error:?}");
}

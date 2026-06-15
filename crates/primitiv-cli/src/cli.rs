use crate::commands::add::AddOptions;
use crate::commands::init::{InitOptions, DEFAULT_BRAND, DEFAULT_STYLES_PATH};
use crate::error::CliError;
use crate::format::Format;

/// A parsed CLI invocation — one variant per command (RFC 0005 §2). The bin
/// parses the process arguments into this, then dispatches; keeping it a plain
/// data enum lets the parser be a pure, fully-tested function.
#[derive(Debug, PartialEq)]
pub enum Command {
    Init(InitOptions),
    Add(AddOptions),
    List {
        json: bool,
    },
    Theme {
        brand: String,
        out: String,
        format: Format,
    },
    Tokens {
        out: Option<String>,
        format: Option<Format>,
    },
}

/// Parse the argument list (the process args **without** the binary name) into
/// a [`Command`]. A hand-rolled parser keeps every branch under test and out of
/// any coverage carve-out (RFC 0007 §7); the surface is small enough (RFC 0005
/// §2) that this stays simpler than a derive-macro dependency.
pub fn parse(args: &[String]) -> Result<Command, CliError> {
    let (name, rest) = args
        .split_first()
        .ok_or_else(|| usage("no command given; expected: init, add, list, theme, tokens"))?;
    match name.as_str() {
        "init" => parse_init(rest),
        "add" => parse_add(rest),
        "list" => parse_list(rest),
        "theme" => parse_theme(rest),
        "tokens" => parse_tokens(rest),
        other => Err(usage(format!(
            "unknown command '{other}'; expected: init, add, list, theme, tokens"
        ))),
    }
}

/// Parse `add <component...> [--json] [--dry-run] [--styles-only | --no-styles]
/// [--format <fmt>] [--path <dir>] [--force] [--no-wiring]` — one or more
/// component names, at least one required (RFC 0005 §2.2), with `--json`
/// selecting the structured plan for agents (§6.5) and `--dry-run` reporting the
/// plan without touching anything (§5). `--styles-only` copies the styled surface
/// without installing the headless package (§4.1 step 2); `--no-styles` installs
/// the package and stops before the styles (step 3) — combining the two would do
/// neither, so it is a usage error. `--format <fmt>` overrides the config's
/// stylesheet format for this copy and `--path <dir>` its destination; `--force`
/// overwrites even consumer-edited files (§4.2); `--no-wiring` skips the project
/// wiring offer and prints the manual snippet instead (§4.3). Names and flags are
/// order-free; any other `--`-prefixed argument is unexpected.
fn parse_add(args: &[String]) -> Result<Command, CliError> {
    let mut components = Vec::new();
    let mut json = false;
    let mut dry_run = false;
    let mut styles_only = false;
    let mut no_styles = false;
    let mut format = None;
    let mut path = None;
    let mut force = false;
    let mut no_wiring = false;
    let mut rest = args.iter();
    while let Some(arg) = rest.next() {
        match arg.as_str() {
            "--json" => json = true,
            "--dry-run" => dry_run = true,
            "--styles-only" => styles_only = true,
            "--no-styles" => no_styles = true,
            "--format" => format = Some(parse_format(&take_value(&mut rest, "--format")?)?),
            "--path" => path = Some(take_value(&mut rest, "--path")?),
            "--force" => force = true,
            "--no-wiring" => no_wiring = true,
            other if other.starts_with("--") => {
                return Err(usage(format!("unexpected argument '{other}'")))
            }
            other => components.push(other.to_string()),
        }
    }
    if components.is_empty() {
        return Err(usage("add requires at least one component"));
    }
    if styles_only && no_styles {
        return Err(usage(
            "add cannot combine --styles-only and --no-styles",
        ));
    }
    Ok(Command::Add(AddOptions {
        components,
        json,
        dry_run,
        styles_only,
        no_styles,
        format,
        path,
        force,
        no_wiring,
    }))
}

/// Parse `list [--json]` — the only flag is `--json`, which switches the output
/// from the human table to the raw index for agents (RFC 0005 §2.5 / §6.5).
fn parse_list(args: &[String]) -> Result<Command, CliError> {
    let mut json = false;
    let mut rest = args.iter();
    while let Some(flag) = rest.next() {
        match flag.as_str() {
            "--json" => json = true,
            other => return Err(usage(format!("unexpected argument '{other}'"))),
        }
    }
    Ok(Command::List { json })
}

/// Parse `init [--format <fmt>] [--brand <hex>] [--path <dir>]
/// [--styles | --no-styles] [--alias-components <value>] [--force]` — every
/// option order-free, each filled from its default when omitted (RFC 0005 §2.1).
/// This is the non-interactive seam: every prompt the future interactive `init`
/// will ask has a flag here, so an agent never drives a TTY (Principle 3).
fn parse_init(args: &[String]) -> Result<Command, CliError> {
    let mut format = Format::Css;
    let mut brand = DEFAULT_BRAND.to_string();
    let mut path = DEFAULT_STYLES_PATH.to_string();
    let mut styles_enabled = true;
    let mut alias_components = None;
    let mut force = false;
    let mut rest = args.iter();
    while let Some(flag) = rest.next() {
        match flag.as_str() {
            "--format" => format = parse_format(&take_value(&mut rest, "--format")?)?,
            "--brand" => brand = take_value(&mut rest, "--brand")?,
            "--path" => path = take_value(&mut rest, "--path")?,
            "--styles" => styles_enabled = true,
            "--no-styles" => styles_enabled = false,
            "--alias-components" => {
                alias_components = Some(take_value(&mut rest, "--alias-components")?)
            }
            "--force" => force = true,
            other => return Err(usage(format!("unexpected argument '{other}'"))),
        }
    }
    Ok(Command::Init(InitOptions {
        format,
        brand,
        path,
        styles_enabled,
        alias_components,
        force,
    }))
}

/// Parse `tokens [--out <path>] [--format <fmt>]` — both optional, order-free.
/// An omitted flag is left `None` so the command can fall back to the
/// `primitiv.json` defaults at run time (RFC 0005 §2.3 / §3.2).
fn parse_tokens(args: &[String]) -> Result<Command, CliError> {
    let mut out = None;
    let mut format = None;
    let mut rest = args.iter();
    while let Some(flag) = rest.next() {
        match flag.as_str() {
            "--out" => out = Some(take_value(&mut rest, "--out")?),
            "--format" => format = Some(parse_format(&take_value(&mut rest, "--format")?)?),
            other => return Err(usage(format!("unexpected argument '{other}'"))),
        }
    }
    Ok(Command::Tokens { out, format })
}

/// Parse `theme --brand <hex> --out <path> [--format <fmt>]` — `--brand` and
/// `--out` required, `--format` optional (defaults to CSS), all order-free.
fn parse_theme(args: &[String]) -> Result<Command, CliError> {
    let mut brand = None;
    let mut out = None;
    let mut format = Format::Css;
    let mut rest = args.iter();
    while let Some(flag) = rest.next() {
        match flag.as_str() {
            "--brand" => brand = Some(take_value(&mut rest, "--brand")?),
            "--out" => out = Some(take_value(&mut rest, "--out")?),
            "--format" => format = parse_format(&take_value(&mut rest, "--format")?)?,
            other => return Err(usage(format!("unexpected argument '{other}'"))),
        }
    }
    Ok(Command::Theme {
        brand: brand.ok_or_else(|| usage("theme requires --brand <hex>"))?,
        out: out.ok_or_else(|| usage("theme requires --out <path>"))?,
        format,
    })
}

/// Map a `--format` value to a [`Format`], erroring on an unrecognised one.
fn parse_format(value: &str) -> Result<Format, CliError> {
    Format::parse(value)
        .ok_or_else(|| usage(format!("unknown format '{value}'; expected: css, scss, tailwind")))
}

/// Consume the value following a flag, erroring if the flag ends the args.
fn take_value<'a>(
    rest: &mut impl Iterator<Item = &'a String>,
    flag: &str,
) -> Result<String, CliError> {
    rest.next()
        .map(|value| value.clone())
        .ok_or_else(|| usage(format!("{flag} needs a value")))
}

fn usage(message: impl Into<String>) -> CliError {
    CliError::Usage(message.into())
}

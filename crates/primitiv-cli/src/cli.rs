use harmoni_core::api::DEFAULT_STEPS;

use crate::commands::add::AddOptions;
use crate::commands::init::InitOptions;
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
        /// The ramp seeds to emit, as `(family, colour)` in [`RAMP_FAMILIES`]
        /// order — flags are order-free, the output is not.
        seeds: Vec<(String, String)>,
        out: String,
        format: Format,
        /// How many steps each ramp carries. The engine owns the supported range,
        /// so an out-of-range count is rejected where generation happens rather
        /// than second-guessed here.
        steps: usize,
    },
    Tokens {
        out: Option<String>,
        format: Option<Format>,
    },
    Dtcg {
        /// The ramp seeds to export, as `(family, colour)` in [`RAMP_FAMILIES`]
        /// order — the same seeds `theme` takes.
        seeds: Vec<(String, String)>,
        out: String,
        steps: usize,
    },
}

/// The palette families a `theme` seed can re-skin, in the order they are
/// emitted. One list drives the `--<family>` flags, the `primitiv.json`
/// `theme` block and the config merge, so adding a family is one entry here.
///
/// `neutral` is deliberately absent: it does not come from
/// `generate_brand_pair` at all but from the engine's `neutral` module, which
/// takes a different input shape (soft-neutral anchors plus a hue-tint mode).
/// `parse_theme` rejects `--neutral` by name rather than letting it read as an
/// unknown flag, because "this needs a model we have not surfaced yet" is a
/// different answer from "you typed that wrong".
pub const RAMP_FAMILIES: &[&str] = &["brand", "danger", "warning", "success", "info"];

/// Parse the argument list (the process args **without** the binary name) into
/// a [`Command`]. A hand-rolled parser keeps every branch under test and out of
/// any coverage carve-out (RFC 0007 §7); the surface is small enough (RFC 0005
/// §2) that this stays simpler than a derive-macro dependency.
pub fn parse(args: &[String]) -> Result<Command, CliError> {
    let (name, rest) = args
        .split_first()
        .ok_or_else(|| usage("no command given; expected: init, add, list, theme, tokens, dtcg"))?;
    match name.as_str() {
        "init" => parse_init(rest),
        "add" => parse_add(rest),
        "list" => parse_list(rest),
        "theme" => parse_theme(rest),
        "tokens" => parse_tokens(rest),
        "dtcg" => parse_dtcg(rest),
        other => Err(usage(format!(
            "unknown command '{other}'; expected: init, add, list, theme, tokens, dtcg"
        ))),
    }
}

/// Parse `add <component...> | --all [--json] [--dry-run] [--styles-only | --no-styles]
/// [--format <fmt>] [--path <dir>] [--force] [--no-wiring]` — one or more
/// component names (at least one required, RFC 0005 §2.2) **or** `--all` to add
/// every component the registry carries; the two are mutually exclusive. With `--json`
/// selecting the structured plan for agents (§6.5) and `--dry-run` reporting the
/// plan without touching anything (§5). `--styles-only` copies the styled surface
/// without installing the headless package (§4.1 step 2); `--no-styles` installs
/// the package and stops before the styles (step 3) — combining the two would do
/// neither, so it is a usage error. `--format <fmt>` overrides the config's
/// stylesheet format for this copy and `--path <dir>` its destination; `--force`
/// overwrites even consumer-edited files (§4.2); `--no-wiring` skips the project
/// wiring offer and prints the manual snippet instead (§4.3); `--registry <ref>`
/// overrides the registry source — an `http(s)://` URL or a version tag fetches
/// over the network, any other value is a repo-local directory (§6.4). Names and
/// flags are order-free; any other `--`-prefixed argument is unexpected.
fn parse_add(args: &[String]) -> Result<Command, CliError> {
    let mut components = Vec::new();
    let mut all = false;
    let mut json = false;
    let mut dry_run = false;
    let mut styles_only = false;
    let mut no_styles = false;
    let mut format = None;
    let mut path = None;
    let mut force = false;
    let mut no_wiring = false;
    let mut registry = None;
    let mut rest = args.iter();
    while let Some(arg) = rest.next() {
        match arg.as_str() {
            "--all" => all = true,
            "--json" => json = true,
            "--dry-run" => dry_run = true,
            "--styles-only" => styles_only = true,
            "--no-styles" => no_styles = true,
            "--format" => format = Some(parse_format(&take_value(&mut rest, "--format")?)?),
            "--path" => path = Some(take_value(&mut rest, "--path")?),
            "--force" => force = true,
            "--no-wiring" => no_wiring = true,
            "--registry" => registry = Some(take_value(&mut rest, "--registry")?),
            other if other.starts_with("--") => {
                return Err(usage(format!("unexpected argument '{other}'")));
            }
            other => components.push(other.to_string()),
        }
    }
    if components.is_empty() && !all {
        return Err(usage("add requires at least one component (or --all)"));
    }
    if all && !components.is_empty() {
        return Err(usage(
            "add cannot combine --all with explicit component names",
        ));
    }
    if styles_only && no_styles {
        return Err(usage("add cannot combine --styles-only and --no-styles"));
    }
    Ok(Command::Add(AddOptions {
        components,
        all,
        json,
        dry_run,
        styles_only,
        no_styles,
        format,
        path,
        force,
        no_wiring,
        registry,
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
/// [--styles | --no-styles] [--alias-components <value>] [--force] [--yes]` —
/// every option order-free. Each promptable choice is left `None` when its flag
/// is omitted, so `init` can prompt for it interactively or fall back to the
/// default (RFC 0005 §2.1); `--yes` accepts every default without prompting. This
/// is the non-interactive seam: every prompt has a flag here, so an agent never
/// drives a TTY (Principle 3).
fn parse_init(args: &[String]) -> Result<Command, CliError> {
    let mut format = None;
    let mut brand = None;
    let mut path = None;
    let mut styles_enabled = None;
    let mut alias_components = None;
    let mut force = false;
    let mut yes = false;
    let mut rest = args.iter();
    while let Some(flag) = rest.next() {
        match flag.as_str() {
            "--format" => format = Some(parse_format(&take_value(&mut rest, "--format")?)?),
            "--brand" => brand = Some(take_value(&mut rest, "--brand")?),
            "--path" => path = Some(take_value(&mut rest, "--path")?),
            "--styles" => styles_enabled = Some(true),
            "--no-styles" => styles_enabled = Some(false),
            "--alias-components" => {
                alias_components = Some(take_value(&mut rest, "--alias-components")?)
            }
            "--force" => force = true,
            "--yes" => yes = true,
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
        yes,
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

/// Parse `theme [--<family> <colour>]... --out <path> [--format <fmt>] [--steps <n>]`
/// — one optional seed per palette family in [`RAMP_FAMILIES`], `--out` required,
/// `--format` (defaults to CSS) and `--steps` (defaults to the engine's ten)
/// optional, all order-free.
///
/// A seed may be **any** CSS colour, not just hex — the engine's `parse_color`
/// accepts `oklch()`, `rgb()`, `hsl()` and named colours too, so a project that
/// keeps its brand in OkLCH can hand it over unchanged.
///
/// No seed flag is required here: the command falls back to the nearest
/// `primitiv.json`'s `theme` block, so whether a seed exists at all is a run-time
/// question the parser cannot answer — `resolve_seeds` asks it with the config in
/// hand.
fn parse_theme(args: &[String]) -> Result<Command, CliError> {
    let seeded = parse_seeded(args, "theme", true)?;
    Ok(Command::Theme {
        seeds: seeded.seeds,
        out: seeded.out,
        format: seeded.format,
        steps: seeded.steps,
    })
}

/// Parse `dtcg [--<family> <colour>]... --out <path> [--steps <n>]` — the same ramp
/// seeds and length as `theme`, written as a DTCG document instead of a stylesheet.
///
/// No `--format`: DTCG is one serialisation, so offering a choice would only
/// invite a wrong one.
fn parse_dtcg(args: &[String]) -> Result<Command, CliError> {
    let seeded = parse_seeded(args, "dtcg", false)?;
    Ok(Command::Dtcg {
        seeds: seeded.seeds,
        out: seeded.out,
        steps: seeded.steps,
    })
}

/// The ramp seeds and destination shared by `theme` and `dtcg`.
struct Seeded {
    seeds: Vec<(String, String)>,
    out: String,
    format: Format,
    steps: usize,
}

/// Parse the seed flags, `--out` and (where the command takes one) `--format`.
///
/// Shared so the two commands cannot drift apart on which families they accept or
/// on what they say about the neutral ramp — the seeds are the same question, only
/// the serialisation differs.
fn parse_seeded(args: &[String], command: &str, accepts_format: bool) -> Result<Seeded, CliError> {
    let mut seeds: Vec<Option<String>> = vec![None; RAMP_FAMILIES.len()];
    let mut out = None;
    let mut format = Format::Css;
    let mut steps = DEFAULT_STEPS;
    let mut rest = args.iter();
    while let Some(flag) = rest.next() {
        match flag.as_str() {
            "--out" => out = Some(take_value(&mut rest, "--out")?),
            "--format" if accepts_format => {
                format = parse_format(&take_value(&mut rest, "--format")?)?
            }
            "--steps" => steps = parse_steps(&take_value(&mut rest, "--steps")?)?,
            "--neutral" => return Err(neutral_unsupported(command)),
            flag => match family_index(flag) {
                Some(index) => seeds[index] = Some(take_value(&mut rest, flag)?),
                None => return Err(usage(format!("unexpected argument '{flag}'"))),
            },
        }
    }
    let seeds: Vec<(String, String)> = RAMP_FAMILIES
        .iter()
        .zip(seeds)
        .filter_map(|(family, seed)| seed.map(|seed| ((*family).to_string(), seed)))
        .collect();
    Ok(Seeded {
        seeds,
        out: out.ok_or_else(|| usage(format!("{command} requires --out <path>")))?,
        format,
        steps,
    })
}

/// Read a `--steps` value as a count, erroring on anything that is not a number.
///
/// Whether the number is *supported* is the engine's call, not this parser's —
/// `harmoni-core` owns `MIN_STEPS`/`MAX_STEPS` and words the bound itself, so
/// re-checking it here would be a second copy free to disagree.
fn parse_steps(value: &str) -> Result<usize, CliError> {
    value
        .parse()
        .map_err(|_| usage(format!("--steps expects a number, got '{value}'")))
}

/// Why the CLI will not take a neutral seed, worded the same way wherever one is
/// offered — a flag or a config key — so the two cannot drift.
pub fn neutral_unsupported(source: &str) -> CliError {
    usage(format!(
        "{source} cannot seed the neutral ramp: it is generated from soft-neutral \
         anchors and a hue-tint rule rather than a single colour, which the CLI \
         does not surface yet"
    ))
}

/// A family the CLI does not generate, named where it was found.
pub fn unknown_family(source: &str, family: &str) -> CliError {
    usage(format!(
        "{source} names no ramp family '{family}'; expected: {}",
        RAMP_FAMILIES.join(", ")
    ))
}

/// The [`RAMP_FAMILIES`] index a `--<family>` flag names, or `None` for any
/// other argument.
fn family_index(flag: &str) -> Option<usize> {
    let name = flag.strip_prefix("--")?;
    RAMP_FAMILIES.iter().position(|family| *family == name)
}

/// Map a `--format` value to a [`Format`], erroring on an unrecognised one.
fn parse_format(value: &str) -> Result<Format, CliError> {
    Format::parse(value).ok_or_else(|| {
        usage(format!(
            "unknown format '{value}'; expected: css, scss, tailwind"
        ))
    })
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

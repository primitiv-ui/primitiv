use crate::error::CliError;
use crate::format::Format;

/// A parsed CLI invocation — one variant per command (RFC 0005 §2). The bin
/// parses the process arguments into this, then dispatches; keeping it a plain
/// data enum lets the parser be a pure, fully-tested function.
#[derive(Debug, PartialEq)]
pub enum Command {
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
        .ok_or_else(|| usage("no command given; expected: theme, tokens"))?;
    match name.as_str() {
        "theme" => parse_theme(rest),
        "tokens" => parse_tokens(rest),
        other => Err(usage(format!(
            "unknown command '{other}'; expected: theme, tokens"
        ))),
    }
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

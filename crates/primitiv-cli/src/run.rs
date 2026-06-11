use std::path::Path;

use crate::cli::{parse, Command};
use crate::commands::init::init;
use crate::commands::list::list;
use crate::commands::theme::theme;
use crate::commands::tokens::tokens;
use crate::error::CliError;
use crate::ports::fs::FileSystem;
use crate::ports::output::Output;
use crate::ports::registry::Registry;

/// Parse the argument list and dispatch to the matching command, threading the
/// filesystem, stdout, and registry ports through (RFC 0005 §2). This is the
/// testable heart of the CLI: the bin is a thin shell that supplies the real
/// arguments and the OS-backed ports, then maps the returned [`CliError`] to an
/// exit code. Each arm uses only the ports it needs.
pub fn run(
    fs: &impl FileSystem,
    output: &impl Output,
    registry: &impl Registry,
    args: &[String],
) -> Result<(), CliError> {
    match parse(args)? {
        Command::Init(options) => init(fs, &options),
        Command::List { json } => list(registry, output, json),
        Command::Theme { brand, out, format } => theme(fs, &brand, Path::new(&out), format),
        Command::Tokens { out, format } => {
            tokens(fs, output, format, out.as_deref().map(Path::new))
        }
    }
}

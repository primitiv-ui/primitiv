use std::path::Path;

use crate::cli::{parse, Command};
use crate::commands::init::init;
use crate::commands::theme::theme;
use crate::commands::tokens::tokens;
use crate::error::CliError;
use crate::ports::fs::FileSystem;
use crate::ports::output::Output;

/// Parse the argument list and dispatch to the matching command, threading the
/// filesystem and stdout ports through (RFC 0005 §2). This is the testable heart
/// of the CLI: the bin is a thin shell that supplies the real arguments and the
/// OS-backed ports, then maps the returned [`CliError`] to an exit code. Only
/// `tokens` streams to stdout today, so the other arms ignore `output`.
pub fn run(
    fs: &impl FileSystem,
    output: &impl Output,
    args: &[String],
) -> Result<(), CliError> {
    match parse(args)? {
        Command::Init(options) => init(fs, &options),
        Command::Theme { brand, out, format } => theme(fs, &brand, Path::new(&out), format),
        Command::Tokens { out, format } => {
            tokens(fs, output, format, out.as_deref().map(Path::new))
        }
    }
}

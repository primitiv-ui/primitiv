use std::path::Path;

use crate::cli::{parse, Command};
use crate::commands::theme::theme;
use crate::commands::tokens::tokens;
use crate::error::CliError;
use crate::ports::fs::FileSystem;

/// Parse the argument list and dispatch to the matching command, threading the
/// filesystem port through (RFC 0005 §2). This is the testable heart of the
/// CLI: the bin is a thin shell that supplies the real arguments and an
/// OS-backed [`FileSystem`], then maps the returned [`CliError`] to an exit code.
pub fn run(fs: &impl FileSystem, args: &[String]) -> Result<(), CliError> {
    match parse(args)? {
        Command::Theme { brand, out, format } => theme(fs, &brand, Path::new(&out), format),
        Command::Tokens { out, format } => {
            tokens(fs, format, out.as_deref().map(Path::new))
        }
    }
}

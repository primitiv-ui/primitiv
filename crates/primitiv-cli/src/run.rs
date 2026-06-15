use std::path::Path;

use crate::cli::{Command, parse};
use crate::commands::add::add;
use crate::commands::init::init;
use crate::commands::list::list;
use crate::commands::theme::theme;
use crate::commands::tokens::tokens;
use crate::error::CliError;
use crate::ports::fs::FileSystem;
use crate::ports::output::Output;
use crate::ports::process::ProcessRunner;
use crate::ports::prompt::Prompt;
use crate::ports::registry::Registry;

/// Parse the argument list and dispatch to the matching command, threading the
/// filesystem, stdout, registry, process, and prompt ports through (RFC 0005 §2),
/// plus whether the session is `interactive` (a TTY, decided once by the bin).
/// This is the testable heart of the CLI: the bin is a thin shell that supplies
/// the real arguments and the OS-backed ports, then maps the returned
/// [`CliError`] to an exit code. Each arm uses only the ports it needs.
#[allow(clippy::too_many_arguments)]
pub fn run(
    fs: &impl FileSystem,
    output: &impl Output,
    registry: &impl Registry,
    runner: &impl ProcessRunner,
    prompt: &impl Prompt,
    interactive: bool,
    args: &[String],
) -> Result<(), CliError> {
    match parse(args)? {
        Command::Init(options) => init(fs, &options),
        Command::Add(options) => add(fs, registry, output, runner, prompt, interactive, &options),
        Command::List { json } => list(registry, output, json),
        Command::Theme { brand, out, format } => theme(fs, &brand, Path::new(&out), format),
        Command::Tokens { out, format } => {
            tokens(fs, output, format, out.as_deref().map(Path::new))
        }
    }
}

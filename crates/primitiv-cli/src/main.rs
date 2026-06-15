//! The `primitiv` binary — the thin shell over the `primitiv-cli` library
//! (RFC 0007 §2.1). It collects the process arguments, runs the dispatcher on
//! the OS-backed filesystem, and maps a [`CliError`](primitiv_cli::error::CliError)
//! to a stable stderr line and exit code (RFC 0005 §5). All logic lives in the
//! library and is unit-tested; this shell carries none and is exercised
//! end-to-end by `tests/cli.rs`.

use std::io::IsTerminal;
use std::process::ExitCode;

use primitiv_cli::ports::fs::OsFs;
use primitiv_cli::ports::output::OsStdout;
use primitiv_cli::ports::process::OsProcessRunner;
use primitiv_cli::ports::prompt::OsPrompt;
use primitiv_cli::ports::registry::EmbeddedRegistry;
use primitiv_cli::run::run;

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let interactive = std::io::stdin().is_terminal();
    match run(
        &OsFs,
        &OsStdout,
        &EmbeddedRegistry,
        &OsProcessRunner,
        &OsPrompt,
        interactive,
        &args,
    ) {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            eprintln!("primitiv: {error}");
            ExitCode::from(error.exit_code())
        }
    }
}

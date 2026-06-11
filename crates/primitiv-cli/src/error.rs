use std::fmt;
use std::io;

use harmoni_core::ColorInputError;

/// The error type every command returns. It unifies the two failure sources a
/// command touches — an invalid colour from the Harmoni-backed emitter and an
/// I/O failure from the [`FileSystem`](crate::ports::fs::FileSystem) port — so
/// the bin can map a single type to an exit code (RFC 0005 §5).
#[derive(Debug)]
pub enum CliError {
    /// A malformed invocation — an unknown command, a missing required flag, or
    /// a flag without its value. Carries a human-readable explanation.
    Usage(String),
    /// A brand or colour argument the emitter could not parse.
    InvalidColor(ColorInputError),
    /// A filesystem read/write failure.
    Io(io::Error),
    /// A `primitiv.json` that is missing where one is required, or malformed.
    Config(String),
    /// A write would clobber a file the consumer owns (e.g. `init` over an
    /// existing `primitiv.json`) and no `--force` was given (Principle 2).
    Conflict(String),
}

impl CliError {
    /// The process exit code the bin returns for this error (RFC 0005 §5).
    /// Codes are stable and distinct per failure source so an agent or CI can
    /// branch on them: `2` usage, `3` invalid colour, `4` I/O, `5` config,
    /// `6` conflict. New error variants take a new code rather than reusing one.
    pub fn exit_code(&self) -> u8 {
        match self {
            CliError::Usage(_) => 2,
            CliError::InvalidColor(_) => 3,
            CliError::Io(_) => 4,
            CliError::Config(_) => 5,
            CliError::Conflict(_) => 6,
        }
    }
}

impl fmt::Display for CliError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            CliError::Usage(message) => write!(f, "{message}"),
            CliError::InvalidColor(ColorInputError::InvalidCss(value)) => {
                write!(f, "invalid colour '{value}'")
            }
            CliError::Io(error) => write!(f, "{error}"),
            CliError::Config(message) => write!(f, "{message}"),
            CliError::Conflict(message) => write!(f, "{message}"),
        }
    }
}

impl From<ColorInputError> for CliError {
    fn from(error: ColorInputError) -> Self {
        CliError::InvalidColor(error)
    }
}

impl From<io::Error> for CliError {
    fn from(error: io::Error) -> Self {
        CliError::Io(error)
    }
}

use std::io;

use harmoni_core::ColorInputError;

/// The error type every command returns. It unifies the two failure sources a
/// command touches — an invalid colour from the Harmoni-backed emitter and an
/// I/O failure from the [`FileSystem`](crate::ports::fs::FileSystem) port — so
/// the bin can map a single type to an exit code (RFC 0005 §5).
#[derive(Debug)]
pub enum CliError {
    /// A brand or colour argument the emitter could not parse.
    InvalidColor(ColorInputError),
    /// A filesystem read/write failure.
    Io(io::Error),
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

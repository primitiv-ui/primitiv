use std::fmt;
use std::io;

use harmoni_core::ColorInputError;
use harmoni_core::api::GenerateError;

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
    /// The component registry could not be loaded or its index was malformed
    /// (RFC 0005 §5 — the network/registry failure source).
    Registry(String),
    /// The command was run outside an existing project — e.g. `init` in a
    /// directory with no `package.json`. The CLI configures a project the
    /// consumer already has; it never scaffolds one (RFC 0005 §1.5.1).
    Project(String),
    /// A requested component (or one pulled in as a dependency) is not in the
    /// registry index — `add` of something the registry doesn't carry
    /// (RFC 0005 §4.4).
    NotFound(String),
    /// The package manager `add` invoked failed — it couldn't be spawned, or it
    /// exited non-zero (RFC 0005 §4.1 step 2).
    Install(String),
}

impl CliError {
    /// The process exit code the bin returns for this error (RFC 0005 §5).
    /// Codes are stable and distinct per failure source so an agent or CI can
    /// branch on them: `2` usage, `3` invalid colour, `4` I/O, `5` config,
    /// `6` conflict, `7` registry, `8` not-a-project, `9` component not found,
    /// `10` install failed. New error variants take a new code rather than
    /// reusing one.
    pub fn exit_code(&self) -> u8 {
        match self {
            CliError::Usage(_) => 2,
            CliError::InvalidColor(_) => 3,
            CliError::Io(_) => 4,
            CliError::Config(_) => 5,
            CliError::Conflict(_) => 6,
            CliError::Registry(_) => 7,
            CliError::Project(_) => 8,
            CliError::NotFound(_) => 9,
            CliError::Install(_) => 10,
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
            CliError::Registry(message) => write!(f, "{message}"),
            CliError::Project(message) => write!(f, "{message}"),
            CliError::NotFound(message) => write!(f, "{message}"),
            CliError::Install(message) => write!(f, "{message}"),
        }
    }
}

/// Every colour the CLI takes reaches it through the generator, so this is the one
/// conversion into [`CliError::InvalidColor`] — there is deliberately no
/// `From<ColorInputError>`, which would be a second door onto the same variant with
/// nothing walking through it.
///
/// A generation failure splits by whose mistake it was: a colour the consumer
/// typed is [`CliError::InvalidColor`], while a step count or lightness curve
/// outside what the engine supports is a [`CliError::Usage`] carrying the
/// engine's own wording — it owns the bound, so restating it here would be a
/// second copy free to disagree.
impl From<GenerateError> for CliError {
    fn from(error: GenerateError) -> Self {
        match error {
            GenerateError::InvalidColor(error) => CliError::InvalidColor(error),
            other => CliError::Usage(other.to_string()),
        }
    }
}

impl From<io::Error> for CliError {
    fn from(error: io::Error) -> Self {
        CliError::Io(error)
    }
}

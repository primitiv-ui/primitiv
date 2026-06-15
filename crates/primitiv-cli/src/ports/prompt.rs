//! The interactive prompt port (RFC 0005 §4.2) — the seam `add` asks the
//! consumer, per edited file, whether to overwrite it or keep their edits.

use std::io::{self, Write};
use std::path::Path;

#[cfg(test)]
use std::cell::RefCell;
#[cfg(test)]
use std::path::PathBuf;

/// The consumer's answer when `add` finds a file they have edited since it was
/// last written (RFC 0005 §4.2). Two-way: take the registry version, or keep the
/// local edits (the safe default).
#[derive(Debug, PartialEq, Clone, Copy)]
pub enum Decision {
    /// Replace the edited file with the registry version.
    Overwrite,
    /// Leave the consumer's edited file untouched.
    Keep,
}

/// Map a typed answer to a [`Decision`]. `o` / `overwrite` (any case, surrounding
/// whitespace ignored) chooses [`Decision::Overwrite`]; everything else —
/// including `k`, an empty line (the default), and unrecognised input — keeps the
/// edits, the safe default (Principle 2).
pub fn parse_decision(answer: &str) -> Decision {
    match answer.trim().to_ascii_lowercase().as_str() {
        "o" | "overwrite" => Decision::Overwrite,
        _ => Decision::Keep,
    }
}

/// The prompt port — the seam `add` asks the consumer to resolve an edited-file
/// conflict (RFC 0005 §4.2). The real binary supplies [`OsPrompt`]; command-layer
/// tests supply the [`InMemoryPrompt`] fake (RFC 0007 §2.2). Whether the prompt is
/// reached at all is the caller's `interactive` decision (a non-TTY never asks).
pub trait Prompt {
    /// Ask whether to overwrite the edited file at `dest`, returning the
    /// consumer's [`Decision`]. An input/output failure is an `io::Error`.
    fn decide(&self, dest: &Path) -> io::Result<Decision>;
}

/// The real [`Prompt`] the bin runs on — writes the question to stderr (so a
/// `--json` stdout stays clean) and reads one line from stdin. It carries no TTY
/// logic of its own: the bin decides interactivity once (`std::io::IsTerminal`)
/// and only calls this when interactive. End-of-input (the non-interactive case,
/// or the consumer just pressing Enter) parses to the safe-default [`Decision::Keep`].
pub struct OsPrompt;

impl Prompt for OsPrompt {
    fn decide(&self, dest: &Path) -> io::Result<Decision> {
        let _ = write!(
            io::stderr(),
            "{} has local edits — [o]verwrite or [k]eep? (k) ",
            dest.display()
        );
        let _ = io::stderr().flush();
        let mut line = String::new();
        io::stdin().read_line(&mut line).map(|_| parse_decision(&line))
    }
}

/// An in-memory [`Prompt`] fake for command-layer tests (RFC 0007 §2.2): it
/// answers with a scripted [`Decision`], records the paths it was asked about (so
/// a test can assert it was — or wasn't — consulted), and can be made to fail so
/// the command's prompt-error branch is driven without a real stream.
#[cfg(test)]
pub struct InMemoryPrompt {
    decision: Decision,
    fail: RefCell<bool>,
    asked: RefCell<Vec<PathBuf>>,
}

#[cfg(test)]
impl InMemoryPrompt {
    pub fn new(decision: Decision) -> Self {
        Self {
            decision,
            fail: RefCell::new(false),
            asked: RefCell::new(Vec::new()),
        }
    }

    /// Make the next [`decide`](Prompt::decide) fail, modelling a closed/broken
    /// stdin.
    pub fn fail(&self) {
        *self.fail.borrow_mut() = true;
    }

    /// The destinations the prompt was asked about, in order.
    pub fn asked(&self) -> Vec<PathBuf> {
        self.asked.borrow().clone()
    }
}

#[cfg(test)]
impl Prompt for InMemoryPrompt {
    fn decide(&self, dest: &Path) -> io::Result<Decision> {
        if *self.fail.borrow() {
            return Err(io::Error::other("prompt failed"));
        }
        self.asked.borrow_mut().push(dest.to_path_buf());
        Ok(self.decision)
    }
}

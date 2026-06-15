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

/// Map a typed answer to a yes/no boolean for `[Y/n]` prompts. `n` / `no` (any
/// case, surrounding whitespace ignored) returns `false`; everything else —
/// including `y`, `yes`, an empty line (the default), and unrecognised input —
/// returns `true`, the safe-default yes.
pub fn parse_confirm(answer: &str) -> bool {
    !matches!(
        answer.trim().to_ascii_lowercase().as_str(),
        "n" | "no"
    )
}

/// The prompt port — the seam `add` asks the consumer to resolve an edited-file
/// conflict (RFC 0005 §4.2) or confirm a wiring patch (§4.3). The real binary
/// supplies [`OsPrompt`]; command-layer tests supply the [`InMemoryPrompt`] fake
/// (RFC 0007 §2.2). Whether either prompt is reached at all is the caller's
/// `interactive` decision (a non-TTY never asks).
pub trait Prompt {
    /// Ask whether to overwrite the edited file at `dest`, returning the
    /// consumer's [`Decision`]. An input/output failure is an `io::Error`.
    fn decide(&self, dest: &Path) -> io::Result<Decision>;

    /// Ask a `[Y/n]` confirmation question, returning `true` when the consumer
    /// confirms (including on empty input — the default is yes) and `false` when
    /// they decline. An input/output failure is an `io::Error`.
    fn confirm(&self, question: &str) -> io::Result<bool>;
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

    fn confirm(&self, question: &str) -> io::Result<bool> {
        let _ = write!(io::stderr(), "{question} [Y/n] ");
        let _ = io::stderr().flush();
        let mut line = String::new();
        io::stdin().read_line(&mut line).map(|_| parse_confirm(&line))
    }
}

/// An in-memory [`Prompt`] fake for command-layer tests (RFC 0007 §2.2): it
/// answers with a scripted [`Decision`] for `decide` and a boolean for `confirm`,
/// records what it was asked (so a test can assert it was — or wasn't — consulted),
/// and can be made to fail so the command's prompt-error branches are driven
/// without a real stream. `fail()` affects both methods; `deny_confirm()` only
/// affects `confirm`.
#[cfg(test)]
pub struct InMemoryPrompt {
    decision: Decision,
    confirm_yes: RefCell<bool>,
    fail: RefCell<bool>,
    asked: RefCell<Vec<PathBuf>>,
    confirmed: RefCell<Vec<String>>,
}

#[cfg(test)]
impl InMemoryPrompt {
    pub fn new(decision: Decision) -> Self {
        Self {
            decision,
            confirm_yes: RefCell::new(true),
            fail: RefCell::new(false),
            asked: RefCell::new(Vec::new()),
            confirmed: RefCell::new(Vec::new()),
        }
    }

    /// Make the next [`decide`](Prompt::decide) or [`confirm`](Prompt::confirm)
    /// fail, modelling a closed/broken stdin.
    pub fn fail(&self) {
        *self.fail.borrow_mut() = true;
    }

    /// Set the [`confirm`](Prompt::confirm) answer to `false` (deny). The
    /// default is `true` (yes, matching `[Y/n]`).
    pub fn deny_confirm(&self) {
        *self.confirm_yes.borrow_mut() = false;
    }

    /// The destinations the prompt was asked about via [`decide`](Prompt::decide),
    /// in order.
    pub fn asked(&self) -> Vec<PathBuf> {
        self.asked.borrow().clone()
    }

    /// The questions asked via [`confirm`](Prompt::confirm), in order.
    pub fn confirmed(&self) -> Vec<String> {
        self.confirmed.borrow().clone()
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

    fn confirm(&self, question: &str) -> io::Result<bool> {
        if *self.fail.borrow() {
            return Err(io::Error::other("prompt failed"));
        }
        self.confirmed.borrow_mut().push(question.to_string());
        Ok(*self.confirm_yes.borrow())
    }
}

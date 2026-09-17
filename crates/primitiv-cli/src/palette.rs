use std::ops::Range;
use std::path::{Path, PathBuf};

use primitiv_emit::{Token, tokens_from_dtcg};
use serde_json::{Map, Value};

use crate::config::Config;
use crate::error::CliError;
use crate::ports::fs::FileSystem;

/// Where the palette document is, or `None` where this project has none.
///
/// The same shape `tokens` and `theme` resolve a destination through, for the
/// same reason (RFC 0005 §3.2): the flag always wins, then the nearest
/// `primitiv.json`. There is no third tier — a project with no palette reference
/// and no flag is the ordinary case, not a default to guess at, and guessing
/// would mean a stray `primitiv.palette.json` in a parent directory silently
/// re-skinning a build that never asked for it.
pub fn locate(from: Option<&Path>, config: Option<&Config>) -> Option<PathBuf> {
    from.map(Path::to_path_buf).or_else(|| {
        config
            .and_then(|config| config.theme.palette.as_deref())
            .map(PathBuf::from)
    })
}

/// The document with only its ramps kept — every mode's `color` subtree, and
/// nothing else (RFC 0032 §7 q4's `--ramps-only`).
///
/// The palette a designer hands over always carries both halves (D3, one file
/// format); whether the roles are *applied* is the consuming project's call, not
/// the designer's, because only the developer knows whether their build wants
/// Primitiv's shipped semantics or the ones Harmoni solved. Dropping them here
/// rather than at export is what keeps that a build-time switch.
///
/// `color` is the whole test because that is where both documents put their
/// ramps and neither puts a role: Primitiv's own Intent layer names `action`,
/// `content`, `surface` and the rest at the mode's root.
pub fn ramps_only(palette: Palette) -> Palette {
    Palette(
        palette
            .0
            .into_iter()
            .map(|(mode, tokens)| {
                let ramps = match tokens.get(RAMPS) {
                    Some(ramps) => serde_json::json!({ RAMPS: ramps }),
                    None => Value::Object(Map::new()),
                };
                (mode, ramps)
            })
            .collect(),
    )
}

/// The group every ramp lives under, in a Harmoni export and in Primitiv's own
/// palette document alike.
const RAMPS: &str = "color";

/// Record the palette reference in `primitiv.json`'s theme block (RFC 0032 D10),
/// so the handoff is one command rather than a command plus a hand-edited key.
///
/// The edit is **textual**, and that is forced rather than lazy. `serde_json`'s
/// `preserve_order` is a workspace-wide hazard — adding it anywhere in the build
/// graph flips `primitiv-emit`'s token ordering from sorted to insertion order and
/// breaks its goldens — so parsing this file and re-serialising it would
/// alphabetise every key and rewrite a document the consumer owns, `$schema` line,
/// formatting and all, including any key the CLI does not model.
///
/// A reference that is already recorded and already correct is left alone, so a
/// bare re-run writes nothing. A *different* one replaces it: `--from` naming a
/// new document and the project continuing to load the old one is the same silent
/// wrong-colour failure as not recording it at all.
pub fn record(fs: &impl FileSystem, config_path: &Path, reference: &Path) -> Result<(), CliError> {
    let text = String::from_utf8(fs.read(config_path)?)
        .map_err(|error| malformed(config_path, &error.to_string()))?;
    let reference = reference.display().to_string();
    let Some(theme) = theme_block(&text) else {
        return Err(malformed(
            config_path,
            "no theme block to record the palette in",
        ));
    };
    let entry = format!("\"palette\": \"{reference}\"");
    let updated = match key_span(&text[theme.clone()]) {
        Some(existing) => {
            let existing = (theme.start + existing.start)..(theme.start + existing.end);
            if text[existing.clone()] == entry {
                return Ok(());
            }
            replace(&text, existing, &entry)
        }
        // Appended after what is already there, not prepended: a key inserted
        // straight after the `{` lands before the block's own leading space and
        // reads as a different hand wrote it.
        None => {
            let block = &text[theme.clone()];
            let end = theme.start + block.trim_end().len();
            let insert = if block.trim().is_empty() {
                format!(" {entry} ")
            } else {
                format!(", {entry}")
            };
            replace(&text, end..end, &insert)
        }
    };
    fs.write(config_path, updated.as_bytes())?;
    Ok(())
}

/// The span **inside** the theme block's braces, or `None` where the document has
/// no `"theme"` object to record into.
///
/// A brace scan rather than a regex: the block legitimately contains nested
/// objects (`neutral`, and its `tint` inside that), so matching to the first `}`
/// would stop in the middle of one.
fn theme_block(text: &str) -> Option<Range<usize>> {
    let key = text.find("\"theme\"")?;
    let open = key + text[key..].find('{')?;
    let mut depth = 0usize;
    for (offset, character) in text[open..].char_indices() {
        match character {
            '{' => depth += 1,
            '}' => {
                depth -= 1;
                if depth == 0 {
                    return Some((open + 1)..(open + offset));
                }
            }
            _ => {}
        }
    }
    None
}

/// The span of an existing `"palette"` entry within `block`, or `None`.
///
/// Bounded by the comma that ends the entry, or by the block's last non-space
/// character where it is the final key — rather than by scanning for the value's
/// own quotes, which needed four separate ways to fail on text that has already
/// parsed as JSON.
fn key_span(block: &str) -> Option<Range<usize>> {
    let key = block.find("\"palette\"")?;
    let rest = &block[key..];
    let end = key + rest.find(',').unwrap_or_else(|| rest.trim_end().len());
    Some(key..end)
}

/// `text` with `span` swapped for `replacement` — the one place the edit is
/// applied, so an insert (an empty span) and a replacement cannot diverge.
fn replace(text: &str, span: Range<usize>, replacement: &str) -> String {
    let mut updated = String::with_capacity(text.len() + replacement.len());
    updated.push_str(&text[..span.start]);
    updated.push_str(replacement);
    updated.push_str(&text[span.end..]);
    updated
}

/// A palette document's per-mode token subtrees, ready for the emitter's values
/// path (RFC 0032 D1).
///
/// The document a designer hands over is DTCG keyed by mode — `light` and `dark`
/// at the top, each holding the ramps (`color.<family>.<step>`) and, unless the
/// consumer asked otherwise, the roles solved against them (D3). That is exactly
/// the shape [`emit_theme_overrides_css`](primitiv_emit::emit_theme_overrides_css)
/// already reads, which is why the handoff needed a reader rather than a format.
pub fn parse(bytes: &[u8], path: &Path) -> Result<Palette, CliError> {
    let document: Value =
        serde_json::from_slice(bytes).map_err(|error| malformed(path, &error.to_string()))?;
    let modes = document
        .as_object()
        .ok_or_else(|| malformed(path, "expected an object keyed by mode"))?;
    Ok(Palette(
        modes
            .iter()
            // `$`-prefixed keys are DTCG's own metadata, not modes. The identity
            // block (D13) is exactly one of these, and `flatten_modes` would read
            // it as a theme scope called `$extensions`.
            .filter(|(key, _)| !key.starts_with('$'))
            .map(|(mode, tokens)| (mode.clone(), tokens.clone()))
            .collect(),
    ))
}

/// A palette document's per-mode token subtrees, the `$`-prefixed metadata
/// already removed.
///
/// A type rather than a bare [`Value`] so "these are modes" holds by
/// construction: every later step — dropping the roles, reading which step labels
/// the ramps carry, handing the whole thing to the emitter — would otherwise have
/// to re-answer "is this an object?" on a document that has already been checked.
#[derive(Debug, PartialEq)]
pub struct Palette(Map<String, Value>);

impl Palette {
    /// How many tokens the document carries, across every mode.
    ///
    /// Counted through the emitter's own `tokens_from_dtcg` rather than a second
    /// walk of the tree, so "a token" means here exactly what it means when the
    /// document is emitted.
    pub fn token_count(&self) -> usize {
        self.tokens().len()
    }

    /// Every token the document carries, across every mode.
    ///
    /// Through the emitter's own `tokens_from_dtcg` rather than a second walk of
    /// the tree, so "a token" means here exactly what it means when the document
    /// is emitted — which is what lets validation ask "does the palette supply
    /// this custom property" and get the answer the stylesheet will see.
    pub fn tokens(&self) -> Vec<Token> {
        self.0.values().flat_map(tokens_from_dtcg).collect()
    }

    /// The document as the emitter's values path reads it
    /// ([`emit_theme_overrides_css`](primitiv_emit::emit_theme_overrides_css)).
    pub fn document(self) -> Value {
        Value::Object(self.0)
    }
}

/// A palette document the CLI could not read, named where it was found.
///
/// [`CliError::Config`] rather than a variant of its own: to the consumer this is
/// a project file that says what their build is made of, exactly as
/// `primitiv.json` is, and it fails for the same reasons — so it should fail the
/// same way, with the same exit code.
fn malformed(path: &Path, reason: &str) -> CliError {
    CliError::Config(format!("{}: {reason}", path.display()))
}

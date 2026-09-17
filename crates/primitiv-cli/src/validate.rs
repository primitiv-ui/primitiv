use std::collections::{BTreeMap, BTreeSet};

use primitiv_emit::{Token, tokens_from_dtcg};

use crate::palette::Palette;
use crate::token_source::{INTENT, PALETTE, parse};

/// The `--primitiv-*` custom properties a stylesheet **reads**, as bare names
/// (`color-brand-600`, `action-primary-hover`).
///
/// Every occurrence is collected, including the component's own declarations
/// (`--primitiv-button-fg: ...`). Telling a read from a declaration by syntax
/// would need a CSS parser; the caller instead intersects this with the
/// vocabulary Primitiv's own layers supply, and a component-owned property is
/// not in it — so it drops out without either side having to reason about
/// `var()` nesting or the `:has()` and `@supports` blocks these sheets use.
pub fn referenced(css: &str) -> BTreeSet<String> {
    let mut names = BTreeSet::new();
    let mut rest = css;
    while let Some(at) = rest.find(PREFIX) {
        let tail = &rest[at + PREFIX.len()..];
        let end = tail
            .find(|c: char| !c.is_ascii_alphanumeric() && c != '-')
            .unwrap_or(tail.len());
        let name = tail[..end].trim_end_matches('-');
        if !name.is_empty() {
            names.insert(name.to_string());
        }
        rest = &tail[end..];
    }
    names
}

/// The prefix every token the design system emits carries.
const PREFIX: &str = "--primitiv-";

/// What Primitiv's own layers supply, so a name a stylesheet reads can be told
/// apart into "a ramp step", "a semantic role", or "the component's own knob".
///
/// Read from the embedded DTCG documents rather than listed here, so a token
/// added to the design system is covered without this file changing — the same
/// reason `tokens` routes those documents instead of restating them.
pub struct Vocabulary {
    /// Ramp custom-property name → its `(family, step)`.
    ///
    /// The pair is kept rather than re-derived, because the name cannot be split
    /// back reliably: `color-neutral-alpha-600` is family `neutral-alpha`, and
    /// nothing in the string says where the family ends.
    ramps: BTreeMap<String, (String, String)>,
    /// Role custom-property names.
    roles: BTreeSet<String>,
}

impl Vocabulary {
    /// The vocabulary the shipped design system carries.
    ///
    /// Light mode alone: both documents declare the same token paths in both
    /// modes, and this asks which names exist, never what they are worth.
    pub fn shipped() -> Vocabulary {
        Vocabulary {
            ramps: shipped_tokens(PALETTE)
                .filter_map(|token| {
                    let [group, family, step] = &token.path[..] else {
                        return None;
                    };
                    (group == RAMPS).then(|| (name(&token), (family.to_string(), step.to_string())))
                })
                .collect(),
            roles: shipped_tokens(INTENT).map(|token| name(&token)).collect(),
        }
    }

    /// The `(family, step)` a name is a ramp step of, or `None`.
    pub fn ramp(&self, name: &str) -> Option<(String, String)> {
        self.ramps.get(name).cloned()
    }

    /// Whether a name is one of Primitiv's semantic roles.
    pub fn is_role(&self, name: &str) -> bool {
        self.roles.contains(name)
    }
}

/// One embedded document's light-mode tokens.
fn shipped_tokens(document: &str) -> impl Iterator<Item = Token> {
    tokens_from_dtcg(&parse(document)["light"]).into_iter()
}

/// The custom-property name a token is emitted as, without the `--primitiv-`
/// prefix — the same join the CSS emitter performs.
fn name(token: &Token) -> String {
    token.path.join("-")
}

/// The group every ramp lives under in a palette document.
const RAMPS: &str = "color";

/// Which installed components read each design-system token — assembled from
/// `primitiv.lock` and the registry, so the report can name who is affected
/// rather than only what is missing.
pub type Dependencies = BTreeMap<String, BTreeSet<String>>;

/// Something the palette overrides only part of (RFC 0032 D4).
///
/// Both variants are the same idea: the palette took over *some* of what the
/// installed components read and left the rest to Primitiv, so the build renders
/// two palettes at once. Not supplying a family or the roles **at all** is a
/// coherent choice and is deliberately absent from this list.
#[derive(Debug, PartialEq)]
pub enum Gap {
    /// A ramp the palette overrides, missing a step installed components read.
    RampStep {
        family: String,
        step: String,
        name: String,
        components: Vec<String>,
    },
    /// A role installed components read, where the palette supplies other roles.
    Role {
        name: String,
        components: Vec<String>,
    },
}

/// What the palette leaves half-covered, against what the installed components
/// actually read.
pub fn gaps(palette: &Palette, dependencies: &Dependencies, vocabulary: &Vocabulary) -> Vec<Gap> {
    let supplied: BTreeSet<String> = palette.tokens().iter().map(name).collect();
    let overridden: BTreeSet<String> = supplied
        .iter()
        .filter_map(|name| vocabulary.ramp(name).map(|(family, _)| family))
        .collect();
    let supplies_roles = supplied.iter().any(|name| vocabulary.is_role(name));

    dependencies
        .iter()
        .filter(|(name, _)| !supplied.contains(*name))
        .filter_map(|(name, components)| {
            let components: Vec<String> = components.iter().cloned().collect();
            match vocabulary.ramp(name) {
                Some((family, step)) => overridden.contains(&family).then(|| Gap::RampStep {
                    family,
                    step,
                    name: name.clone(),
                    components,
                }),
                None => (supplies_roles && vocabulary.is_role(name)).then(|| Gap::Role {
                    name: name.clone(),
                    components,
                }),
            }
        })
        .collect()
}

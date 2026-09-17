use std::collections::{BTreeMap, BTreeSet};

use primitiv_emit::{Token, tokens_from_dtcg};

use std::path::Path;

use crate::format::Format;
use crate::palette::Palette;
use crate::ports::registry::Registry;
use crate::registry::RegistryIndex;
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

/// Who reads a token, agreeing with itself about one component and several — a
/// diagnostic that says "carousel use it" reads as a bug in the tool rather than
/// a finding about the palette.
fn reads(components: &[String]) -> String {
    let verb = if components.len() == 1 { "uses" } else { "use" };
    format!("{} {verb} it", components.join(", "))
}

/// The role group a custom-property name belongs to — `action-primary-hover` is
/// `action` — or `None` for a name with no group segment.
fn group(name: &str) -> Option<String> {
    name.split_once('-').map(|(group, _)| group.to_string())
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

/// Each ramp the palette carries whose length is not the ten the registry
/// stylesheets were authored against (RFC 0032 D15), as `(family, steps)`.
///
/// The re-aliasing in `primitiv-emit`'s `steps.rs` makes every role *resolve* at
/// any supported length, so nothing breaks — but a stylesheet reaching for a step
/// by name was written expecting ten, and away from that some visual intent
/// moves. Reported per family rather than for the document, because a project
/// re-seeding one ramp leaves the others on their shipped length.
pub fn lengths(palette: &Palette) -> Vec<(String, usize)> {
    let mut steps: BTreeMap<String, BTreeSet<String>> = BTreeMap::new();
    for token in palette.tokens() {
        let [group, family, step] = &token.path[..] else {
            continue;
        };
        if group == RAMPS {
            steps
                .entry(family.to_string())
                .or_default()
                .insert(step.to_string());
        }
    }
    steps
        .into_iter()
        .map(|(family, steps)| (family, steps.len()))
        .filter(|(_, length)| *length != ASSUMED_STEPS)
        .collect()
}

/// The ramp length the registry stylesheets are written against.
const ASSUMED_STEPS: usize = 10;

/// Which design-system tokens each installed component reads, in the format the
/// project builds in.
///
/// Scoped to what `primitiv.lock` records as installed: an uninstalled
/// component has dependencies too, but not ones this build can render wrong, and
/// reporting them would bury the finding that matters.
///
/// A component the registry does not carry, or whose stylesheet it cannot serve,
/// is skipped rather than raised. That is version drift between the pinned
/// registry and the lock — real, but not something a coverage report should fail
/// a build over (D8).
pub fn dependencies(
    registry: &dyn Registry,
    index: &RegistryIndex,
    installed: &BTreeSet<String>,
    format: Format,
) -> Dependencies {
    let mut dependencies = Dependencies::new();
    for component in installed {
        let Some(entry) = index.components.get(component) else {
            continue;
        };
        for file in entry.styles.formats.files(format) {
            let Ok(bytes) = registry.file(component, file) else {
                continue;
            };
            let Ok(css) = String::from_utf8(bytes) else {
                continue;
            };
            for name in referenced(&css) {
                dependencies
                    .entry(name)
                    .or_default()
                    .insert(component.clone());
            }
        }
    }
    dependencies
}

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
    // Scoped the way the ramps are: a ramp is partial when the palette overrides
    // THAT FAMILY and misses a step, so a role is partial when the palette
    // supplies other roles in THAT GROUP and misses this one. Without the scope,
    // an export supplying one `action` role reported every missing `content`,
    // `surface`, `border` and `focus` role too — groups it had said nothing
    // about, so nothing was half-done, and the real finding was buried.
    let spoken_for: BTreeSet<String> = supplied
        .iter()
        .filter(|name| vocabulary.is_role(name))
        .filter_map(|name| group(name))
        .collect();

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
                None => (vocabulary.is_role(name)
                    && group(name).is_some_and(|group| spoken_for.contains(&group)))
                .then(|| Gap::Role {
                    name: name.clone(),
                    components,
                }),
            }
        })
        .collect()
}

/// The one warning a run emits about its palette's coverage, or `None` where
/// there is nothing to say (RFC 0032 D4, D8, D15).
///
/// One block rather than a line per finding: a developer scanning build output
/// should see a single diagnostic naming the palette and what it left to
/// Primitiv, not a wall of lines they have to reassemble. And nothing at all
/// when the palette covers what is installed — warn-and-continue must not mean
/// warning on every run, or the warning stops being read.
pub fn report(source: &Path, gaps: &[Gap], lengths: &[(String, usize)]) -> Option<String> {
    if gaps.is_empty() && lengths.is_empty() {
        return None;
    }
    let mut out = format!(
        "primitiv: warning: {} leaves some of what your components use to Primitiv\n",
        source.display()
    );
    for (family, steps) in lengths {
        out.push_str(&format!(
            "  color.{family} has {steps} steps, not the 10 the registry stylesheets assume\n"
        ));
    }
    for gap in gaps {
        out.push_str(&match gap {
            Gap::RampStep {
                family,
                step,
                components,
                ..
            } => format!(
                "  color.{family} has no {step} — {}, and will take Primitiv's\n",
                reads(components)
            ),
            Gap::Role { name, components } => format!(
                "  {name} is not supplied — {}, and will take Primitiv's\n",
                reads(components)
            ),
        });
    }
    Some(out)
}

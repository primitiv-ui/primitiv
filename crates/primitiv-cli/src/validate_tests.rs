use std::path::Path;

use crate::palette::{Palette, parse};
use crate::validate::{Dependencies, Gap, Vocabulary, gaps, referenced};

/// A registry stylesheet both declares its own knobs and reads the design
/// system's tokens, often inside a `var()` fallback chain. All of them are
/// collected; which ones matter is decided against the vocabulary, not here.
#[test]
fn collects_every_token_name_a_stylesheet_mentions() {
    let names = referenced(
        ".primitiv-card {\n  \
           --primitiv-card-bg: var(--primitiv-surface-default);\n  \
           color: var(--primitiv-color-neutral-alpha-600, var(--primitiv-content-primary));\n\
         }",
    );

    assert!(names.contains("card-bg"));
    assert!(names.contains("surface-default"));
    assert!(names.contains("color-neutral-alpha-600"));
    assert!(names.contains("content-primary"));
}

/// A name is bounded by the first character that cannot be in one — a closing
/// paren, a comma, a colon. Without that the reads above would come back as
/// `color-neutral-alpha-600` glued to whatever followed.
#[test]
fn stops_a_name_at_the_first_character_that_cannot_be_in_one() {
    let names = referenced("a { b: var(--primitiv-x-1); c: var(--primitiv-y-2, red); }");

    assert_eq!(
        names.into_iter().collect::<Vec<_>>(),
        ["x-1".to_string(), "y-2".to_string()]
    );
}

/// The scan is measured against the real embedded registry rather than a
/// fixture, because §6's table is the thing it has to reproduce: a scanner that
/// agrees with a hand-written sample and not with the shipped stylesheets would
/// validate nothing.
#[test]
fn finds_the_palette_steps_the_shipped_components_actually_depend_on() {
    use crate::ports::registry::{EmbeddedRegistry, Registry};

    let mut found: Vec<String> = Vec::new();
    for component in ["card", "carousel", "button"] {
        let css = EmbeddedRegistry.file(component, "styles.css").unwrap();
        found.extend(
            referenced(&String::from_utf8(css).unwrap())
                .into_iter()
                .filter(|name| name.starts_with("color-")),
        );
    }

    // §6, measured: the mirror family is Carousel's overlay indicator, and
    // `brand-600` is the one direct brand-step dependency in the library.
    assert!(
        found
            .iter()
            .any(|name| name == "color-neutral-alpha-inverse-600")
    );
    assert!(
        found
            .iter()
            .any(|name| name.starts_with("color-neutral-alpha-"))
    );
}

/// The vocabulary is read from the embedded documents rather than listed here,
/// so a token added to the design system is covered without this file changing.
/// A ramp entry keeps its family and step apart, because the name cannot be
/// split back reliably — `color-neutral-alpha-600` is family `neutral-alpha`,
/// not family `neutral` at step `alpha-600`.
#[test]
fn reads_the_ramp_and_role_vocabulary_from_the_shipped_documents() {
    let vocabulary = Vocabulary::shipped();

    assert_eq!(
        vocabulary.ramp("color-neutral-alpha-600"),
        Some(("neutral-alpha".to_string(), "600".to_string()))
    );
    assert_eq!(
        vocabulary.ramp("color-brand-600"),
        Some(("brand".to_string(), "600".to_string()))
    );
    assert!(vocabulary.is_role("action-primary-hover"));
    // A component's own knob is in neither, which is what makes the scan's
    // collect-everything approach safe.
    assert_eq!(vocabulary.ramp("button-fg"), None);
    assert!(!vocabulary.is_role("button-fg"));
}

/// A palette overriding part of a ramp installed components read, leaving the
/// rest to Primitiv. §6's live hazard: only lengths 10, 18 and 26 label all nine
/// decades, so a 12-step neutral may simply have no `700` and three stylesheets
/// quietly keep somebody else's grey.
#[test]
fn reports_a_ramp_the_palette_overrides_but_leaves_a_used_step_out_of() {
    let palette = palette(
        r##"{ "light": { "color": { "brand": {
            "50":  { "$type": "color", "$value": "#eef8f3" },
            "500": { "$type": "color", "$value": "#0a7755" } } } } }"##,
    );

    let gaps = gaps(
        &palette,
        &dependencies(&[("color-brand-600", &["card"])]),
        &Vocabulary::shipped(),
    );

    assert_eq!(
        gaps,
        vec![Gap::RampStep {
            family: "brand".to_string(),
            step: "600".to_string(),
            name: "color-brand-600".to_string(),
            components: vec!["card".to_string()],
        }]
    );
}

/// A ramp the palette does not touch at all is not a partial override — the
/// project is simply keeping Primitiv's own, which is a coherent choice and must
/// not be nagged about.
#[test]
fn says_nothing_about_a_ramp_the_palette_never_overrides() {
    let palette = palette(
        r##"{ "light": { "color": { "brand": { "500": { "$type": "color", "$value": "#0a7755" } } } } }"##,
    );

    let gaps = gaps(
        &palette,
        &dependencies(&[("color-neutral-alpha-600", &["card"])]),
        &Vocabulary::shipped(),
    );

    assert_eq!(gaps, vec![]);
}

/// The same rule on the semantics: a palette that solved SOME roles and not
/// others leaves the components reading the rest on Primitiv's, mixing two sets
/// of semantics in one build.
#[test]
fn reports_a_role_the_palette_leaves_out_while_supplying_others() {
    let palette = palette(
        r##"{ "light": {
            "color": { "brand": { "500": { "$type": "color", "$value": "#0a7755" } } },
            "action": { "primary": { "default": { "$type": "color", "$value": "#0a7755" } } }
        } }"##,
    );

    let gaps = gaps(
        &palette,
        &dependencies(&[("action-primary-hover", &["button", "chip"])]),
        &Vocabulary::shipped(),
    );

    assert_eq!(
        gaps,
        vec![Gap::Role {
            name: "action-primary-hover".to_string(),
            components: vec!["button".to_string(), "chip".to_string()],
        }]
    );
}

/// A palette carrying no roles at all — or one applied with `--ramps-only` — is
/// keeping Primitiv's semantics wholesale. That is the documented choice (§7
/// q4), not a gap.
#[test]
fn says_nothing_about_roles_when_the_palette_supplies_none() {
    let palette = palette(
        r##"{ "light": { "color": { "brand": { "500": { "$type": "color", "$value": "#0a7755" } } } } }"##,
    );

    let gaps = gaps(
        &palette,
        &dependencies(&[("action-primary-hover", &["button"])]),
        &Vocabulary::shipped(),
    );

    assert_eq!(gaps, vec![]);
}

/// A component's own knob is in neither half of the vocabulary and must never be
/// reported — the scan collects it, the rules drop it.
#[test]
fn says_nothing_about_a_components_own_custom_property() {
    let palette = palette(
        r##"{ "light": { "color": { "brand": { "500": { "$type": "color", "$value": "#0a7755" } } } } }"##,
    );

    let gaps = gaps(
        &palette,
        &dependencies(&[("button-fg", &["button"])]),
        &Vocabulary::shipped(),
    );

    assert_eq!(gaps, vec![]);
}

/// A palette document, parsed as the command parses one.
fn palette(document: &str) -> Palette {
    parse(document.as_bytes(), Path::new("p.json")).unwrap()
}

/// Which installed components read each token, as the caller assembles it from
/// the lock and the registry.
fn dependencies(pairs: &[(&str, &[&str])]) -> Dependencies {
    pairs
        .iter()
        .map(|(name, components)| {
            (
                (*name).to_string(),
                components.iter().map(|c| (*c).to_string()).collect(),
            )
        })
        .collect()
}

/// A truncated reference names no token, so it is ignored rather than recorded
/// as a nameless one — an empty entry would sit in the set matching nothing and
/// reading, to anyone printing it, like a token whose name went missing.
#[test]
fn ignores_a_reference_with_no_name_after_the_prefix() {
    assert!(referenced("a { b: var(--primitiv-); }").is_empty());
}

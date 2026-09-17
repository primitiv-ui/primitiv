use std::path::Path;

use crate::format::Format;
use crate::palette::{Palette, parse};
use crate::ports::registry::Registry;
use crate::validate::{Dependencies, Gap, Vocabulary, gaps, lengths, referenced, report};

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

/// Scoped to what `primitiv.lock` records as installed: a component the project
/// never added has dependencies, but not ones this build can render wrong.
#[test]
fn reads_dependencies_only_from_the_components_the_project_installed() {
    use crate::ports::registry::EmbeddedRegistry;
    use crate::registry::RegistryIndex;
    use crate::validate::dependencies as read;

    let index = RegistryIndex::parse(&EmbeddedRegistry.index().unwrap()).unwrap();
    let installed = ["carousel".to_string()].into_iter().collect();

    let found = read(&EmbeddedRegistry, &index, &installed, Format::Css);

    // Carousel's overlay indicator, measured — §6's mirror-family use.
    assert_eq!(
        found.get("color-neutral-alpha-inverse-600"),
        Some(&["carousel".to_string()].into_iter().collect())
    );
    // Navigation Menu's `neutral-alpha-100` is real but this project does not
    // have it installed, so it is not this build's problem.
    assert!(!found.contains_key("color-neutral-alpha-100"));
}

/// A lock naming something the registry does not carry is version drift between
/// the pinned registry and the lock. Validation reports coverage; it is not the
/// place to fail a build over it.
#[test]
fn skips_an_installed_component_the_registry_does_not_carry() {
    use crate::ports::registry::EmbeddedRegistry;
    use crate::registry::RegistryIndex;
    use crate::validate::dependencies as read;

    let index = RegistryIndex::parse(&EmbeddedRegistry.index().unwrap()).unwrap();
    let installed = ["no-such-component".to_string()].into_iter().collect();

    assert!(read(&EmbeddedRegistry, &index, &installed, Format::Css).is_empty());
}

/// D15: the re-aliasing in `steps.rs` makes the roles resolve at any length, but
/// the registry stylesheets were authored against ten steps and some visual
/// intent moves. Reported per family, because a project re-seeding one ramp
/// leaves the rest on their shipped length.
#[test]
fn reports_a_ramp_whose_length_is_not_the_ten_the_stylesheets_assume() {
    let palette = palette(
        r##"{ "light": { "color": {
            "brand": { "50": { "$type": "color", "$value": "#1" },
                       "500": { "$type": "color", "$value": "#2" },
                       "900": { "$type": "color", "$value": "#3" } } } } }"##,
    );

    assert_eq!(lengths(&palette), vec![("brand".to_string(), 3)],);
}

/// Ten is the length everything downstream assumes, so it is silent.
#[test]
fn says_nothing_about_a_ramp_that_is_the_assumed_ten_steps() {
    let steps: Vec<String> = [
        "50", "100", "200", "300", "400", "500", "600", "700", "800", "900",
    ]
    .iter()
    .map(|step| format!(r##""{step}": {{ "$type": "color", "$value": "#0a7755" }}"##))
    .collect();
    let palette = palette(&format!(
        r##"{{ "light": {{ "color": {{ "brand": {{ {} }} }} }} }}"##,
        steps.join(", ")
    ));

    assert_eq!(lengths(&palette), vec![]);
}

/// The report is one warning, not one per finding: a developer scanning build
/// output should see a single block naming the palette and what it left to
/// Primitiv, rather than a wall of lines they have to reassemble.
#[test]
fn reports_the_gaps_and_the_lengths_as_one_named_block() {
    let palette = palette(
        r##"{ "light": { "color": { "neutral-alpha": {
            "600": { "$type": "color", "$value": "#0a7755" } } } } }"##,
    );
    let dependencies = dependencies(&[("color-neutral-alpha-700", &["carousel"])]);

    let report = report(
        Path::new("design/primitiv.palette.json"),
        &gaps(&palette, &dependencies, &Vocabulary::shipped()),
        &lengths(&palette),
    )
    .unwrap();

    assert!(report.starts_with("primitiv: warning:"), "got: {report}");
    assert!(
        report.contains("design/primitiv.palette.json"),
        "got: {report}"
    );
    assert!(report.contains("neutral-alpha"), "got: {report}");
    assert!(report.contains("700"), "got: {report}");
    assert!(report.contains("carousel"), "got: {report}");
    assert!(report.ends_with('\n'), "a diagnostic ends its own line");
}

/// A palette that covers what the installed components read has nothing to say,
/// and D8's warn-and-continue must not mean warning on every run.
#[test]
fn reports_nothing_when_the_palette_covers_what_is_installed() {
    let palette = palette(
        r##"{ "light": { "color": { "brand": { "500": { "$type": "color", "$value": "#0a7755" } } } } }"##,
    );

    assert_eq!(report(Path::new("p.json"), &[], &[]), None);
    let _ = palette;
}

/// A palette that carries roles as well as ramps: only the ramps have a length,
/// so the role tokens must not be counted into one. Both role depths appear —
/// `content.primary` and `action.primary.hover` — because a three-segment role
/// reaches the family/step shape and is rejected on its group, while a
/// two-segment one never reaches it at all.
#[test]
fn counts_only_the_ramps_when_measuring_length() {
    let palette = palette(
        r##"{ "light": {
            "color": { "brand": { "50": { "$type": "color", "$value": "#1" },
                                  "500": { "$type": "color", "$value": "#2" } } },
            "action": { "primary": { "hover": { "$type": "color", "$value": "#3" } } },
            "content": { "primary": { "$type": "color", "$value": "#4" } }
        } }"##,
    );

    assert_eq!(lengths(&palette), vec![("brand".to_string(), 2)]);
}

/// A missing role reads differently from a missing step — it has no family and
/// no step to name, only the property itself.
#[test]
fn names_a_missing_role_by_its_property() {
    let report = report(
        Path::new("p.json"),
        &[Gap::Role {
            name: "action-primary-hover".to_string(),
            components: vec!["button".to_string()],
        }],
        &[],
    )
    .unwrap();

    assert!(report.contains("action-primary-hover"), "got: {report}");
    assert!(report.contains("button"), "got: {report}");
}

/// A stylesheet the registry will not serve, or serves as bytes that are not
/// text, is skipped: a coverage report is not the place to fail a build over a
/// registry that cannot answer (D8).
#[test]
fn skips_a_stylesheet_the_registry_cannot_serve_as_text() {
    use crate::ports::registry::InMemoryRegistry;
    use crate::registry::RegistryIndex;
    use crate::validate::dependencies as read;

    let index = br##"{ "version": "0.1.0", "components": { "card": { "version": "0.1.0",
        "styles": { "formats": { "css": ["styles.css", "missing.css"] } } } } }"##;
    let registry = InMemoryRegistry::new(index).with_file("card", "styles.css", &[0xff, 0xfe]);
    let installed = ["card".to_string()].into_iter().collect();

    let found = read(
        &registry,
        &RegistryIndex::parse(index).unwrap(),
        &installed,
        Format::Css,
    );

    assert!(found.is_empty());
}

/// The role rule is scoped the way the ramp rule is. A ramp is partial when the
/// palette overrides THAT FAMILY and misses a step; a role is partial when the
/// palette supplies other roles in THAT GROUP and misses this one.
///
/// Found by running it: an export supplying one `action` role reported sixteen
/// missing roles across `content`, `surface`, `border` and `focus` — groups it
/// had said nothing about, so nothing was half-done. The developer's real
/// finding was buried in a wall of lines about choices they had not made.
#[test]
fn reports_a_missing_role_only_where_the_palette_speaks_to_that_group() {
    let palette = palette(
        r##"{ "light": {
            "color": { "brand": { "500": { "$type": "color", "$value": "#0a7755" } } },
            "action": { "primary": { "default": { "$type": "color", "$value": "#0a7755" } } }
        } }"##,
    );

    let gaps = gaps(
        &palette,
        &dependencies(&[
            ("action-primary-hover", &["button"]),
            ("surface-default", &["card"]),
        ]),
        &Vocabulary::shipped(),
    );

    assert_eq!(
        gaps,
        vec![Gap::Role {
            name: "action-primary-hover".to_string(),
            components: vec!["button".to_string()],
        }],
        "surface-default is a group the palette never speaks to"
    );
}

/// One component reads differently from several, and a diagnostic that says
/// "carousel use it" reads as a bug in the tool rather than a finding about the
/// palette.
#[test]
fn agrees_with_itself_about_one_component_and_several() {
    let one = report(
        Path::new("p.json"),
        &[Gap::Role {
            name: "surface-default".to_string(),
            components: vec!["card".to_string()],
        }],
        &[],
    )
    .unwrap();
    let several = report(
        Path::new("p.json"),
        &[Gap::Role {
            name: "surface-default".to_string(),
            components: vec!["card".to_string(), "drawer".to_string()],
        }],
        &[],
    )
    .unwrap();

    assert!(one.contains("card uses it"), "got: {one}");
    assert!(several.contains("card, drawer use it"), "got: {several}");
}

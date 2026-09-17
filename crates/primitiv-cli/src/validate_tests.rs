use crate::validate::referenced;

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

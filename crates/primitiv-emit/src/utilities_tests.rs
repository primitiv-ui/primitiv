use pretty_assertions::assert_eq;

use serde_json::Value as Json;

use crate::pipeline::TokenSources;
use crate::token::Token;
use crate::utilities::{Rule, UnknownToken, emit_rules, emit_utilities_css};

#[test]
fn renders_a_rule_inside_the_utilities_layer_after_the_full_layer_order() {
    let rules = [Rule::raw("flex", &[("display", "flex")])];

    let css = emit_rules(&rules, &[]).unwrap();

    assert_eq!(
        css,
        "@layer primitiv.reset, primitiv.tokens, primitiv.theme, primitiv.base, primitiv.variants, primitiv.states, primitiv.utilities;\n\
         \n\
         @layer primitiv.utilities {\n\
         \x20 .flex { display: flex; }\n\
         }\n"
    );
}

/// A trimmed slice of the token surface: enough for each rule under test.
fn tokens() -> Vec<Token> {
    vec![
        Token::new(&["space", "16"], "1rem"),
        Token::new(&["content", "muted"], "var(--primitiv-color-neutral-600)"),
        Token::new(&["breakpoint", "sm"], "40rem"),
        Token::new(&["breakpoint", "md"], "48rem"),
        Token::new(&["breakpoint", "lg"], "64rem"),
    ]
}

#[test]
fn reads_a_token_as_its_custom_property() {
    let rules = [Rule::tokens("p-16", &[("padding", "space.16")])];

    let css = emit_rules(&rules, &tokens()).unwrap();

    assert!(
        css.contains("  .p-16 { padding: var(--primitiv-space-16); }\n"),
        "{css}"
    );
}

#[test]
fn refuses_a_rule_whose_token_does_not_exist() {
    let rules = [Rule::tokens("p-64", &[("padding", "space.64")])];

    let error = emit_rules(&rules, &tokens()).unwrap_err();

    assert_eq!(
        error,
        UnknownToken {
            class: "p-64".to_string(),
            path: "space.64".to_string()
        }
    );
    assert_eq!(
        error.to_string(),
        "the utility .p-64 reads space.64, which is not a token"
    );
}

#[test]
fn repeats_a_responsive_rule_under_each_breakpoint_mobile_first() {
    let rules = [
        Rule::raw("flex", &[("display", "flex")]).responsive(),
        Rule::tokens("p-16", &[("padding", "space.16")]),
    ];

    let css = emit_rules(&rules, &tokens()).unwrap();

    assert_eq!(
        css,
        "@layer primitiv.reset, primitiv.tokens, primitiv.theme, primitiv.base, primitiv.variants, primitiv.states, primitiv.utilities;\n\
         \n\
         @layer primitiv.utilities {\n\
         \x20 .flex { display: flex; }\n\
         \x20 .p-16 { padding: var(--primitiv-space-16); }\n\
         \n\
         \x20 @media (min-width: 40rem) {\n\
         \x20   .sm\\:flex { display: flex; }\n\
         \x20 }\n\
         \n\
         \x20 @media (min-width: 48rem) {\n\
         \x20   .md\\:flex { display: flex; }\n\
         \x20 }\n\
         \n\
         \x20 @media (min-width: 64rem) {\n\
         \x20   .lg\\:flex { display: flex; }\n\
         \x20 }\n\
         }\n"
    );
}

#[test]
fn refuses_responsive_rules_without_the_breakpoint_tokens() {
    let rules = [Rule::raw("flex", &[("display", "flex")]).responsive()];

    let error = emit_rules(&rules, &[]).unwrap_err();

    assert_eq!(
        error,
        UnknownToken {
            class: "sm:flex".to_string(),
            path: "breakpoint.sm".to_string()
        }
    );
}

/// One of Primitiv's own token sources, as the CLI embeds it.
macro_rules! source {
    ($file:literal) => {
        serde_json::from_str::<Json>(include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../packages/tokens/src/",
            $file
        )))
        .unwrap()
    };
}

/// The utilities stylesheet emitted from the shipped token sources, routed as
/// `primitiv tokens` routes them.
fn shipped() -> String {
    let base = [
        source!("primitives.json"),
        source!("interaction.json"),
        source!("motion.json"),
        source!("elevation.json"),
        source!("breakpoint.json"),
    ];
    let theme = [source!("palette.json"), source!("intent.json")];
    let density = [source!("context.json")];
    emit_utilities_css(&TokenSources {
        base: &base,
        theme: &theme,
        density: &density,
    })
    .unwrap()
}

/// Every class name the stylesheet defines, in order, unescaped.
fn classes(css: &str) -> Vec<String> {
    css.lines()
        .filter_map(|line| line.trim_start().strip_prefix('.'))
        .map(|rest| rest[..rest.find(" {").unwrap()].replace("\\:", ":"))
        .collect()
}

/// The RFC 0034 §4 set, written out rather than derived: this list is the
/// decision, and the emitter has to match it.
const SPACE: [&str; 8] = ["0", "4", "8", "12", "16", "24", "32", "48"];

fn rfc_classes() -> Vec<String> {
    let mut expected: Vec<String> = [
        "block",
        "inline-block",
        "inline",
        "flex",
        "inline-flex",
        "grid",
        "inline-grid",
        "contents",
        "hidden",
        "flex-row",
        "flex-col",
        "flex-wrap",
        "flex-nowrap",
        "items-start",
        "items-center",
        "items-end",
        "items-stretch",
        "items-baseline",
        "justify-start",
        "justify-center",
        "justify-end",
        "justify-between",
        "grow",
        "shrink-0",
        "min-w-0",
        "grid-cols-1",
        "grid-cols-2",
        "grid-cols-3",
        "grid-cols-4",
    ]
    .iter()
    .map(|c| c.to_string())
    .collect();
    for prefix in ["gap", "p", "px", "py", "pt"] {
        expected.extend(SPACE.iter().map(|s| format!("{prefix}-{s}")));
    }
    expected.extend(["m-0".to_string(), "mx-auto".to_string()]);
    for prefix in ["mt", "mb"] {
        expected.extend(SPACE.iter().map(|s| format!("{prefix}-{s}")));
    }
    expected.extend(
        [
            "w-25",
            "w-33",
            "w-50",
            "w-66",
            "w-75",
            "w-100",
            "w-auto",
            "max-w-prose",
            "h-100",
            "h-auto",
            "text-primary",
            "text-secondary",
            "text-muted",
            "text-disabled",
            "text-inverse",
            "text-error",
            "text-success",
            "text-warning",
            "text-info",
            "text-danger",
            "body-xs",
            "body-sm",
            "body-md",
            "body-lg",
            "body-xl",
            "label-xs",
            "label-sm",
            "label-md",
            "label-lg",
            "label-xl",
            "heading-1",
            "heading-2",
            "heading-3",
            "heading-4",
            "heading-5",
            "heading-6",
            "display-lg",
            "display-xl",
            "overline",
            "font-regular",
            "font-medium",
            "font-semibold",
            "font-bold",
            "text-start",
            "text-center",
            "text-end",
            "truncate",
            "bg-default",
            "bg-subtle",
            "bg-raised",
            "bg-sunken",
            "bg-inverse",
            "bg-selected",
            "bg-success",
            "bg-warning",
            "bg-info",
            "bg-danger",
            "border",
            "border-subtle",
            "border-strong",
            "border-0",
            "rounded-0",
            "rounded-4",
            "rounded-8",
            "rounded-12",
            "rounded-16",
            "rounded-full",
            "shadow-flat",
            "shadow-raised",
            "shadow-overlay",
            "shadow-floating",
            "shadow-modal",
            "sr-only",
        ]
        .iter()
        .map(|c| c.to_string()),
    );
    let responsive = [
        "block",
        "inline-block",
        "inline",
        "flex",
        "inline-flex",
        "grid",
        "inline-grid",
        "contents",
        "hidden",
        "flex-row",
        "flex-col",
        "flex-wrap",
        "flex-nowrap",
        "grid-cols-1",
        "grid-cols-2",
        "grid-cols-3",
        "grid-cols-4",
    ];
    for breakpoint in ["sm", "md", "lg"] {
        expected.extend(responsive.iter().map(|c| format!("{breakpoint}:{c}")));
    }
    expected
}

#[test]
fn ships_exactly_the_rfc_0034_classes_from_the_token_sources() {
    let css = shipped();

    assert_eq!(classes(&css), rfc_classes());
}

#[test]
fn sets_the_overline_in_capitals_with_room_between_words() {
    let css = shipped();

    let overline = css
        .lines()
        .find(|line| line.trim_start().starts_with(".overline "))
        .unwrap();
    assert!(
        overline.contains("text-transform: uppercase;"),
        "{overline}"
    );
    assert!(
        overline.contains("letter-spacing: var(--primitiv-letter-spacing-wide);"),
        "{overline}"
    );
}

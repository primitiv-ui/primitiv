//! Utility classes (RFC 0034): a small, fixed set of classes, each reading one
//! design token, in a last `primitiv.utilities` cascade layer.

use crate::dtcg::{flatten_modes, tokens_from_dtcg};
use crate::pipeline::TokenSources;
use crate::token::Token;

/// The order every Primitiv stylesheet declares, with `primitiv.utilities`
/// appended. Layer order is fixed by each name's first appearance, so whichever
/// file loads first, the utilities layer lands last (RFC 0034 §3.1).
const LAYER_ORDER: &str = "@layer primitiv.reset, primitiv.tokens, primitiv.theme, primitiv.base, primitiv.variants, primitiv.states, primitiv.utilities;";

/// A utility that reads a token the sources do not have. The emit fails rather
/// than writing a `var()` that resolves to nothing, so a renamed token cannot
/// leave a dead utility behind (RFC 0034 §3.4).
#[derive(Debug, PartialEq)]
pub struct UnknownToken {
    pub class: String,
    pub path: String,
}

impl std::fmt::Display for UnknownToken {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "the utility .{} reads {}, which is not a token",
            self.class, self.path
        )
    }
}

/// A declaration's value: written as given, or read from a token.
pub enum Value {
    Raw(String),
    /// A dotted token path (`space.16`), emitted as its custom property.
    Token(String),
}

/// The breakpoints a responsive utility repeats under, smallest first, each a
/// `breakpoint.*` token: the emitter writes their values into real media
/// queries, which `var()` cannot appear in (RFC 0034 §4.10).
const BREAKPOINTS: [&str; 3] = ["sm", "md", "lg"];

/// One utility class and its declarations.
pub struct Rule {
    class: String,
    declarations: Vec<(String, Value)>,
    responsive: bool,
}

impl Rule {
    /// A rule mixing raw values and tokens (`border-style: solid` beside
    /// `border-color: border.default`).
    pub fn new(class: &str, declarations: Vec<(&str, Value)>) -> Self {
        Rule {
            class: class.to_string(),
            declarations: declarations
                .into_iter()
                .map(|(property, value)| (property.to_string(), value))
                .collect(),
            responsive: false,
        }
    }

    /// A rule whose values are written as given (`display: flex`).
    pub fn raw(class: &str, declarations: &[(&str, &str)]) -> Self {
        Rule {
            class: class.to_string(),
            declarations: declarations
                .iter()
                .map(|(property, value)| (property.to_string(), Value::Raw(value.to_string())))
                .collect(),
            responsive: false,
        }
    }

    /// A rule whose values are token paths (`padding: space.16`), each read as
    /// its custom property, `var(--primitiv-space-16)`.
    pub fn tokens(class: &str, declarations: &[(&str, &str)]) -> Self {
        Rule {
            class: class.to_string(),
            declarations: declarations
                .iter()
                .map(|(property, path)| (property.to_string(), Value::Token(path.to_string())))
                .collect(),
            responsive: false,
        }
    }

    /// Also emit this rule as `sm:`, `md:` and `lg:` variants, each applying
    /// from that breakpoint up.
    pub fn responsive(mut self) -> Self {
        self.responsive = true;
        self
    }
}

/// The rule's declarations, as one line, with every token checked.
fn body(rule: &Rule, tokens: &[Token]) -> Result<String, UnknownToken> {
    let mut declarations = Vec::new();
    for (property, value) in &rule.declarations {
        declarations.push(match value {
            Value::Raw(raw) => format!("{property}: {raw};"),
            Value::Token(path) => {
                let segments: Vec<&str> = path.split('.').collect();
                if !tokens.iter().any(|token| token.path == segments) {
                    return Err(UnknownToken {
                        class: rule.class.clone(),
                        path: path.clone(),
                    });
                }
                format!("{property}: var(--primitiv-{});", segments.join("-"))
            }
        });
    }
    Ok(declarations.join(" "))
}

/// Render `rules` as the utilities stylesheet, resolving token references
/// against `tokens`: every rule, then each breakpoint's media query holding the
/// responsive ones, so a wider breakpoint's variant wins by source order.
pub fn emit_rules(rules: &[Rule], tokens: &[Token]) -> Result<String, UnknownToken> {
    let mut css = format!("{LAYER_ORDER}\n\n@layer primitiv.utilities {{\n");
    let mut responsive = Vec::new();
    for rule in rules {
        let body = body(rule, tokens)?;
        css.push_str(&format!("  .{} {{ {body} }}\n", rule.class));
        if rule.responsive {
            responsive.push((&rule.class, body));
        }
    }
    if !responsive.is_empty() {
        for breakpoint in BREAKPOINTS {
            let width = tokens
                .iter()
                .find(|token| token.path == ["breakpoint", breakpoint])
                .ok_or_else(|| UnknownToken {
                    class: format!("{breakpoint}:{}", responsive[0].0),
                    path: format!("breakpoint.{breakpoint}"),
                })?;
            css.push_str(&format!("\n  @media (min-width: {}) {{\n", width.value));
            for (class, body) in &responsive {
                css.push_str(&format!("    .{breakpoint}\\:{class} {{ {body} }}\n"));
            }
            css.push_str("  }\n");
        }
    }
    css.push_str("}\n");
    Ok(css)
}

/// The eight steps of the space scale the spacing utilities use: every gap and
/// padding the components themselves use (RFC 0034 §4, §6).
const SPACE: [&str; 8] = ["0", "4", "8", "12", "16", "24", "32", "48"];

fn raw(value: &str) -> Value {
    Value::Raw(value.to_string())
}

fn token(path: &str) -> Value {
    Value::Token(path.to_string())
}

/// A text style: the type tokens a group sets (family, weight, size, line
/// height, and letter spacing where the group has one). `font-style` is left
/// out: it carries a design tool's style name (`Medium`), not a CSS value.
fn text_style(class: &str, group: &str, letter_spacing: bool) -> Rule {
    let mut declarations = vec![
        ("font-family", token(&format!("{group}.font-family"))),
        ("font-weight", token(&format!("{group}.font-weight"))),
        ("font-size", token(&format!("{group}.font-size"))),
        ("line-height", token(&format!("{group}.line-height"))),
    ];
    if letter_spacing {
        declarations.push(("letter-spacing", token(&format!("{group}.letter-spacing"))));
    }
    Rule::new(class, declarations)
}

/// The RFC 0034 §4 set, in the order the stylesheet lists it. Data, not a walk
/// of the token tree: "small and fixed" is a choice the tokens cannot make.
pub fn utility_rules() -> Vec<Rule> {
    let mut rules = Vec::new();

    // §4.1 Display, and §4.2 flex and grid — the layout set, also responsive.
    for (class, value) in [
        ("block", "block"),
        ("inline-block", "inline-block"),
        ("inline", "inline"),
        ("flex", "flex"),
        ("inline-flex", "inline-flex"),
        ("grid", "grid"),
        ("inline-grid", "inline-grid"),
        ("contents", "contents"),
        ("hidden", "none"),
    ] {
        rules.push(Rule::raw(class, &[("display", value)]).responsive());
    }
    for (class, property, value) in [
        ("flex-row", "flex-direction", "row"),
        ("flex-col", "flex-direction", "column"),
        ("flex-wrap", "flex-wrap", "wrap"),
        ("flex-nowrap", "flex-wrap", "nowrap"),
    ] {
        rules.push(Rule::raw(class, &[(property, value)]).responsive());
    }
    for (class, value) in [
        ("items-start", "start"),
        ("items-center", "center"),
        ("items-end", "end"),
        ("items-stretch", "stretch"),
        ("items-baseline", "baseline"),
    ] {
        rules.push(Rule::raw(class, &[("align-items", value)]));
    }
    for (class, value) in [
        ("justify-start", "start"),
        ("justify-center", "center"),
        ("justify-end", "end"),
        ("justify-between", "space-between"),
    ] {
        rules.push(Rule::raw(class, &[("justify-content", value)]));
    }
    rules.push(Rule::raw("grow", &[("flex", "1 1 0%")]));
    rules.push(Rule::raw("shrink-0", &[("flex-shrink", "0")]));
    rules.push(Rule::raw("min-w-0", &[("min-inline-size", "0")]));
    for columns in 1..=4 {
        rules.push(
            Rule::raw(
                &format!("grid-cols-{columns}"),
                &[(
                    "grid-template-columns",
                    &format!("repeat({columns}, minmax(0, 1fr))"),
                )],
            )
            .responsive(),
        );
    }

    // §4.3 Gap, §4.4 padding, §4.5 margin.
    for (prefix, property) in [
        ("gap", "gap"),
        ("p", "padding"),
        ("px", "padding-inline"),
        ("py", "padding-block"),
        ("pt", "padding-block-start"),
    ] {
        for step in SPACE {
            rules.push(Rule::tokens(
                &format!("{prefix}-{step}"),
                &[(property, &format!("space.{step}"))],
            ));
        }
    }
    rules.push(Rule::tokens("m-0", &[("margin", "space.0")]));
    rules.push(Rule::raw("mx-auto", &[("margin-inline", "auto")]));
    for (prefix, property) in [("mt", "margin-block-start"), ("mb", "margin-block-end")] {
        for step in SPACE {
            rules.push(Rule::tokens(
                &format!("{prefix}-{step}"),
                &[(property, &format!("space.{step}"))],
            ));
        }
    }

    // §4.6 Width and height.
    for (class, value) in [
        ("w-25", "25%"),
        ("w-33", "33.333%"),
        ("w-50", "50%"),
        ("w-66", "66.667%"),
        ("w-75", "75%"),
        ("w-100", "100%"),
        ("w-auto", "auto"),
    ] {
        rules.push(Rule::raw(class, &[("inline-size", value)]));
    }
    rules.push(Rule::raw("max-w-prose", &[("max-inline-size", "65ch")]));
    rules.push(Rule::raw("h-100", &[("block-size", "100%")]));
    rules.push(Rule::raw("h-auto", &[("block-size", "auto")]));

    // §4.7 Text: colour from the roles, then the text styles.
    for role in [
        "primary",
        "secondary",
        "muted",
        "disabled",
        "inverse",
        "error",
    ] {
        rules.push(Rule::tokens(
            &format!("text-{role}"),
            &[("color", &format!("content.{role}"))],
        ));
    }
    for tone in ["success", "warning", "info", "danger"] {
        rules.push(Rule::tokens(
            &format!("text-{tone}"),
            &[("color", &format!("feedback.{tone}.soft.foreground"))],
        ));
    }
    for size in ["xs", "sm", "md", "lg", "xl"] {
        rules.push(text_style(
            &format!("body-{size}"),
            &format!("body.{size}"),
            false,
        ));
    }
    for size in ["xs", "sm", "md", "lg", "xl"] {
        rules.push(text_style(
            &format!("label-{size}"),
            &format!("label.{size}"),
            false,
        ));
    }
    for level in 1..=6 {
        rules.push(text_style(
            &format!("heading-{level}"),
            &format!("heading.h{level}"),
            true,
        ));
    }
    for size in ["lg", "xl"] {
        rules.push(text_style(
            &format!("display-{size}"),
            &format!("display.{size}"),
            false,
        ));
    }
    // The overline tokens carry no case or tracking: set in capitals, the
    // condensed overline face loses its word spaces without `wide` tracking —
    // the same correction the docs site's own overlines make.
    let mut overline = text_style("overline", "overline.md", false);
    overline
        .declarations
        .push(("letter-spacing".to_string(), token("letter-spacing.wide")));
    overline
        .declarations
        .push(("text-transform".to_string(), raw("uppercase")));
    rules.push(overline);
    for weight in ["regular", "medium", "semibold", "bold"] {
        rules.push(Rule::tokens(
            &format!("font-{weight}"),
            &[("font-weight", &format!("font-weight.{weight}"))],
        ));
    }
    for align in ["start", "center", "end"] {
        rules.push(Rule::raw(
            &format!("text-{align}"),
            &[("text-align", align)],
        ));
    }
    rules.push(Rule::raw(
        "truncate",
        &[
            ("overflow", "hidden"),
            ("text-overflow", "ellipsis"),
            ("white-space", "nowrap"),
        ],
    ));

    // §4.8 Surface, border, radius, shadow.
    for role in [
        "default", "subtle", "raised", "sunken", "inverse", "selected",
    ] {
        rules.push(Rule::tokens(
            &format!("bg-{role}"),
            &[("background-color", &format!("surface.{role}"))],
        ));
    }
    for tone in ["success", "warning", "info", "danger"] {
        rules.push(Rule::tokens(
            &format!("bg-{tone}"),
            &[(
                "background-color",
                &format!("feedback.{tone}.soft.background"),
            )],
        ));
    }
    rules.push(Rule::new(
        "border",
        vec![
            ("border-width", token("border-width.1")),
            ("border-style", raw("solid")),
            ("border-color", token("border.default")),
        ],
    ));
    rules.push(Rule::tokens(
        "border-subtle",
        &[("border-color", "border.subtle")],
    ));
    rules.push(Rule::tokens(
        "border-strong",
        &[("border-color", "border.strong")],
    ));
    rules.push(Rule::tokens(
        "border-0",
        &[("border-width", "border-width.0")],
    ));
    for radius in ["0", "4", "8", "12", "16", "full"] {
        rules.push(Rule::tokens(
            &format!("rounded-{radius}"),
            &[("border-radius", &format!("radii.{radius}"))],
        ));
    }
    for depth in ["flat", "raised", "overlay", "floating", "modal"] {
        rules.push(Rule::tokens(
            &format!("shadow-{depth}"),
            &[("box-shadow", &format!("elevation.{depth}"))],
        ));
    }

    // §4.9 Accessibility: visually hidden, still announced.
    rules.push(Rule::raw(
        "sr-only",
        &[
            ("position", "absolute"),
            ("inline-size", "1px"),
            ("block-size", "1px"),
            ("padding", "0"),
            ("margin", "-1px"),
            ("overflow", "hidden"),
            ("clip-path", "inset(50%)"),
            ("white-space", "nowrap"),
            ("border-width", "0"),
        ],
    ));

    rules
}

/// Emit the utilities stylesheet (RFC 0034) against the shipped token
/// sources, routed as `primitiv tokens` routes them. Fails if any utility reads
/// a token the sources do not have.
pub fn emit_utilities_css(sources: &TokenSources) -> Result<String, UnknownToken> {
    let mut tokens = Vec::new();
    for document in sources.base {
        tokens.extend(tokens_from_dtcg(document));
    }
    for document in sources.theme.iter().chain(sources.density) {
        for (_, mode_tokens) in flatten_modes(document) {
            tokens.extend(mode_tokens);
        }
    }
    emit_rules(&utility_rules(), &tokens)
}

//! Utility classes (RFC 0034): a small, fixed set of classes, each reading one
//! design token, in a last `primitiv.utilities` cascade layer.

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
        write!(f, "the utility .{} reads {}, which is not a token", self.class, self.path)
    }
}

/// A declaration's value: written as given, or read from a token.
enum Value {
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

//! Utility classes (RFC 0034): a small, fixed set of classes, each reading one
//! design token, in a last `primitiv.utilities` cascade layer.

use crate::token::Token;

/// The order every Primitiv stylesheet declares, with `primitiv.utilities`
/// appended. Layer order is fixed by each name's first appearance, so whichever
/// file loads first, the utilities layer lands last (RFC 0034 §3.1).
const LAYER_ORDER: &str = "@layer primitiv.reset, primitiv.tokens, primitiv.theme, primitiv.base, primitiv.variants, primitiv.states, primitiv.utilities;";

/// A declaration's value: written as given, or read from a token.
enum Value {
    Raw(String),
    /// A dotted token path (`space.16`), emitted as its custom property.
    Token(String),
}

/// One utility class and its declarations.
pub struct Rule {
    class: String,
    declarations: Vec<(String, Value)>,
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
        }
    }
}

/// Render `rules` as the utilities stylesheet, resolving token references
/// against `tokens`.
pub fn emit_rules(rules: &[Rule], _tokens: &[Token]) -> Result<String, String> {
    let mut css = format!("{LAYER_ORDER}\n\n@layer primitiv.utilities {{\n");
    for rule in rules {
        let body: Vec<String> = rule
            .declarations
            .iter()
            .map(|(property, value)| match value {
                Value::Raw(raw) => format!("{property}: {raw};"),
                Value::Token(path) => format!("{property}: var(--primitiv-{});", path.replace('.', "-")),
            })
            .collect();
        css.push_str(&format!("  .{} {{ {} }}\n", rule.class, body.join(" ")));
    }
    css.push_str("}\n");
    Ok(css)
}

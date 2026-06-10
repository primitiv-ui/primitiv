use crate::token::Token;

/// The `@layer primitiv.*` sublayer-order declaration, emitted once at the top
/// of the shared token file so the precedence `tokens → theme → base →
/// variants → states` is fixed regardless of later import order (RFC 0008 §2.1).
const SUBLAYER_DECLARATION: &str =
    "@layer primitiv.tokens, primitiv.theme, primitiv.base, primitiv.variants, primitiv.states;";

/// A block of theme tokens under one or more selectors — a single mode scope in
/// the `primitiv.tokens` layer (RFC 0009 §2.2). The default mode shares the
/// `:root` selector (`:root, [data-theme="light"]`); each non-default mode emits
/// as its own `[data-*="…"]` block, swapping values behind stable names.
pub struct Scope {
    pub selectors: Vec<String>,
    pub tokens: Vec<Token>,
}

impl Scope {
    pub fn new(selectors: &[&str], tokens: Vec<Token>) -> Self {
        Self {
            selectors: selectors.iter().map(|selector| selector.to_string()).collect(),
            tokens,
        }
    }
}

/// Emit the shared theme-token surface as canonical CSS (RFC 0006 §4.2,
/// RFC 0008 §3.1, RFC 0009 §2.2): the sublayer-order declaration, then one
/// selector block per mode scope — each a set of `--primitiv-*` custom
/// properties — wrapped in `@layer primitiv.tokens`. No `!important` is ever
/// written (RFC 0008 §2.4).
pub fn emit_css(scopes: &[Scope]) -> String {
    let mut out = String::new();
    out.push_str(SUBLAYER_DECLARATION);
    out.push_str("\n\n@layer primitiv.tokens {\n");
    for scope in scopes {
        out.push_str(&format!("  {} {{\n", scope.selectors.join(",\n  ")));
        for token in &scope.tokens {
            out.push_str(&format!(
                "    --primitiv-{}: {};\n",
                token.path.join("-"),
                token.value
            ));
        }
        out.push_str("  }\n");
    }
    out.push_str("}\n");
    out
}

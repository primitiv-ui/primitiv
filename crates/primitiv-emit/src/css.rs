use crate::token::Token;

/// The `@layer primitiv.*` sublayer-order declaration, emitted once at the top
/// of the shared token file so the precedence `tokens → theme → base →
/// variants → states` is fixed regardless of later import order (RFC 0008 §2.1).
const SUBLAYER_DECLARATION: &str =
    "@layer primitiv.tokens, primitiv.theme, primitiv.base, primitiv.variants, primitiv.states;";

/// Emit the shared theme-token surface as canonical CSS (RFC 0006 §4.2,
/// RFC 0008 §3.1): the sublayer-order declaration, then a `:root` block of
/// `--primitiv-*` custom properties wrapped in `@layer primitiv.tokens`. No
/// `!important` is ever written (RFC 0008 §2.4).
pub fn emit_css(tokens: &[Token]) -> String {
    let mut out = String::new();
    out.push_str(SUBLAYER_DECLARATION);
    out.push_str("\n\n@layer primitiv.tokens {\n  :root {\n");
    for token in tokens {
        out.push_str(&format!(
            "    --primitiv-{}: {};\n",
            token.path.join("-"),
            token.value
        ));
    }
    out.push_str("  }\n}\n");
    out
}

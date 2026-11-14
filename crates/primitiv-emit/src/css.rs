use crate::token::Token;

/// The `@layer primitiv.*` sublayer-order declaration, emitted once at the top
/// of the shared token file so the precedence `reset → tokens → theme → base →
/// variants → states` is fixed regardless of later import order (RFC 0008 §2.1).
/// `reset` is the lowest sublayer — the opt-in base element styles live there so
/// a consumer (and Primitiv's own component classes) override them at will.
const SUBLAYER_DECLARATION: &str = "@layer primitiv.reset, primitiv.tokens, primitiv.theme, primitiv.base, primitiv.variants, primitiv.states;";

/// A block of theme tokens under one or more selectors — a single mode scope in
/// the `primitiv.tokens` layer (RFC 0009 §2.2). The default mode shares the
/// `:root` selector (`:root, [data-theme="light"]`); each non-default mode emits
/// as its own `[data-*="..."]` block, swapping values behind stable names.
pub struct Scope {
    pub selectors: Vec<String>,
    pub tokens: Vec<Token>,
}

impl Scope {
    pub fn new(selectors: &[&str], tokens: Vec<Token>) -> Self {
        Self {
            selectors: selectors
                .iter()
                .map(|selector| selector.to_string())
                .collect(),
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
    out.push_str("\n\n");
    out.push_str(&emit_layer("primitiv.tokens", scopes));
    out
}

/// Emit `primitiv theme` brand overrides into the `primitiv.theme` sublayer
/// (RFC 0006 §5.1, RFC 0008 §5): the same scope blocks of `--primitiv-*` custom
/// properties, but in the layer that sits *above* `primitiv.tokens`, so a
/// re-skin reliably beats the base palette by layer order regardless of import
/// order. This is a separate file; it re-opens the named layer and never
/// re-declares the sublayer order (that lives once in the shared token file).
pub fn emit_theme_css(scopes: &[Scope]) -> String {
    emit_layer("primitiv.theme", scopes)
}

/// The selector of the theme's dark scope, the one block the operating
/// system's preference can also turn on.
const DARK_SCOPE: &str = "[data-theme=\"dark\"]";

/// Render the scope blocks inside one named `@layer`, shared by every layer the
/// emitter writes — the `--primitiv-<path>: <value>` custom properties under
/// each scope's comma-joined selectors.
///
/// The dark theme scope is written twice: once for `data-theme="dark"`, and
/// once inside `@media (prefers-color-scheme: dark)` for a page that sets no
/// theme of its own, so a site follows the reader's system setting until it
/// chooses. An explicit `data-theme="light"` on the root opts out.
fn emit_layer(layer: &str, scopes: &[Scope]) -> String {
    let mut out = format!("@layer {layer} {{\n");
    for scope in scopes {
        out.push_str(&block(&scope.selectors.join(",\n  "), &scope.tokens, "  "));
        if scope.selectors == [DARK_SCOPE] {
            out.push_str("  @media (prefers-color-scheme: dark) {\n");
            out.push_str(&block(":root:not([data-theme=\"light\"])", &scope.tokens, "    "));
            out.push_str("  }\n");
        }
    }
    out.push_str("}\n");
    out
}

/// One selector block of custom properties, at `indent`.
fn block(selector: &str, tokens: &[Token], indent: &str) -> String {
    let mut out = format!("{indent}{selector} {{\n");
    for token in tokens {
        out.push_str(&format!(
            "{indent}  --primitiv-{}: {};\n",
            token.path.join("-"),
            token.value
        ));
    }
    out.push_str(&format!("{indent}}}\n"));
    out
}

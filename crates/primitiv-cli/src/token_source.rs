//! The design system's own DTCG token documents, embedded into the binary.
//!
//! Shared rather than private to one command: `tokens` routes the whole set into
//! the base layer, and `theme` reads `INTENT` alone so a ramp of a non-default
//! length can re-point the roles that length has moved. One `include_str!` per
//! document, in one place, so the two cannot end up reading different copies.

// The design system's own DTCG token documents, embedded into the binary so
// `tokens` can emit the base layer with no project input. Routing mirrors the
// figma-token-sync collection table (RFC 0006 §4): the single-mode `primitives`
// and `interaction` form the mode-independent base; `palette` and `intent`
// carry the theme axis; `context` carries the density axis. `motion` is also a
// mode-independent base document, but unlike the others it is **code-only** — it
// has no Figma collection (easing curves have no Figma variable type), so it
// sits outside the token sync's five-file write-set and is never overwritten.
// `elevation` is also a mode-independent base document (RFC 0017): its three
// `shadow.color.*` primitives back a Figma `Elevation` COLOR collection, while
// the layered `shadow.*` box-shadows and the semantic `elevation.*` roles are
// code-only composites (Figma has no shadow variable type — effect styles are
// their Figma form).
// `breakpoint` is also a mode-independent base document (RFC 0025): a flat
// `xs`/`sm`/`md`/`lg`/`xl`/`2xl` scale, code-only like `motion` (no Figma
// variable backs a viewport breakpoint). `sm`-`2xl` deliberately match
// Tailwind v4's own built-in defaults, so `emit_tailwind` (RFC 0025 D2)
// omits redeclaring those five and emits only the additive `xs`.
pub const PRIMITIVES: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../packages/tokens/src/primitives.json"
));
pub const INTERACTION: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../packages/tokens/src/interaction.json"
));
pub const MOTION: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../packages/tokens/src/motion.json"
));
pub const ELEVATION: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../packages/tokens/src/elevation.json"
));
pub const BREAKPOINT: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../packages/tokens/src/breakpoint.json"
));
pub const PALETTE: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../packages/tokens/src/palette.json"
));
pub const INTENT: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../packages/tokens/src/intent.json"
));
pub const CONTEXT: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../packages/tokens/src/context.json"
));

/// Parse one embedded DTCG document. The input is compiled into the binary and
/// asserted by the `tokens` tests, so a parse failure is a build-time programmer
/// error, not a runtime condition — hence the panic rather than a `CliError`.
pub fn parse(document: &str) -> serde_json::Value {
    serde_json::from_str(document).expect("embedded DTCG document is valid JSON")
}

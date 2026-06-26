//! The global base element stylesheet — bare-element typographic styles shipped
//! as part of the foundation (written next to the token layer by `primitiv
//! tokens` / `primitiv init`), not installed per-component. The content is
//! hand-authored in `assets/base.{css,scss}` and embedded verbatim; it lives
//! entirely in `@layer primitiv.reset`, the lowest sublayer, so consumer rules
//! and Primitiv's own component classes override it for free (RFC 0008 §7).

/// The canonical CSS base element stylesheet.
pub const BASE_CSS: &str = include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/assets/base.css"));

/// The SCSS mirror of [`BASE_CSS`] — byte-identical today (the base layer
/// declares no `$primitiv-*` aliases), kept as its own asset so a Sass pipeline
/// imports a `.scss` and for parity with the per-component stylesheets.
pub const BASE_SCSS: &str = include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/assets/base.scss"));

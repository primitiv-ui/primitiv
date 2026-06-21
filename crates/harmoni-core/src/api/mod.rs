// Curated public API for harmoni-core.
//
// Adapters (web, Figma plugin, CLI, etc.) should call into this
// module rather than the lower-level palette::generator functions.
// Colour-accepting entry points take ColorInput so callers never need to
// know about palette::Oklch directly; the gamut helpers (RFC 0010) work in
// raw OkLCH numbers because they render a chart axis, not a chosen colour.

pub mod audit;
pub mod gamut;
pub mod generate;
pub mod neutral;

pub use audit::audit_contrast;
pub use gamut::{max_in_gamut_chroma, paint_hue_strip, paint_lc_plane};
pub use generate::{
    generate, generate_brand_pair, generate_pair, generate_with_lightness, generate_with_options,
    GenerateOptions, PaletteSet,
};
pub use neutral::{derive_soft_neutrals, generate_neutral_ramp, tint_neutrals};

#[cfg(test)]
mod audit_tests;
#[cfg(test)]
mod gamut_tests;
#[cfg(test)]
mod generate_tests;
#[cfg(test)]
mod neutral_tests;

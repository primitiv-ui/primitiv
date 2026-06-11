// Curated public API for harmoni-core.
//
// Adapters (web, Figma plugin, CLI, etc.) should call into this
// module rather than the lower-level palette::generator functions.
// Everything here accepts ColorInput so callers never need to know
// about palette::Oklch directly.

pub mod audit;
pub mod generate;
pub mod neutral;

pub use audit::audit_contrast;
pub use generate::{
    generate, generate_brand_pair, generate_pair, generate_with_lightness, generate_with_options,
    GenerateOptions, PaletteSet,
};
pub use neutral::{derive_soft_neutrals, generate_neutral_ramp, tint_neutrals};

#[cfg(test)]
mod audit_tests;
#[cfg(test)]
mod generate_tests;
#[cfg(test)]
mod neutral_tests;

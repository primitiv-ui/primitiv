pub mod api;
pub mod audit;
pub mod color;
pub mod neutral;
pub mod palette;

pub use audit::contrast::ContrastResult;
pub use color::input::{ColorInput, ColorInputError};
pub use color::output::{format_oklch, oklch_to_hex, oklch_to_rgb, Rgb};
pub use neutral::derive::SoftNeutrals;
pub use neutral::ramp::TintMode;
pub use api::generate::PaletteSet;
pub use palette::generator::{Palette, Swatch, SwatchLabel, SwatchStep};

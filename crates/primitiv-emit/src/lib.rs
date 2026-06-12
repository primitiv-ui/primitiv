pub mod alias;
pub mod component;
pub mod css;
pub mod dtcg;
pub mod mode;
pub mod pipeline;
pub mod scss;
pub mod tailwind;
pub mod theme;
pub mod token;
pub mod value;

pub use alias::link_aliases;
pub use component::{emit_component_css, Component};
pub use css::{emit_css, emit_theme_css};
pub use dtcg::{flatten_modes, tokens_from_dtcg};
pub use mode::{scope_selectors, Axis};
pub use pipeline::{
    emit_component_tokens_css, emit_tailwind_tokens, emit_theme_brand_css, emit_theme_brand_scss,
    emit_theme_brand_tailwind, emit_theme_overrides_css, emit_tokens_css, emit_tokens_scss,
    TokenSources,
};
pub use scss::{emit_component_scss, emit_scss, emit_theme_scss};
pub use tailwind::{emit_tailwind, emit_theme_tailwind};
pub use theme::brand_tokens;
pub use token::Token;
pub use value::format_number;

#[cfg(test)]
mod alias_tests;
#[cfg(test)]
mod component_tests;
#[cfg(test)]
mod css_tests;
#[cfg(test)]
mod dtcg_tests;
#[cfg(test)]
mod mode_tests;
#[cfg(test)]
mod pipeline_tests;
#[cfg(test)]
mod scss_tests;
#[cfg(test)]
mod tailwind_tests;
#[cfg(test)]
mod theme_tests;
#[cfg(test)]
mod value_tests;

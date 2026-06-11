pub mod alias;
pub mod component;
pub mod css;
pub mod dtcg;
pub mod mode;
pub mod pipeline;
pub mod scss;
pub mod token;
pub mod ts;
pub mod value;

pub use alias::{link_aliases, resolve_against_base, resolve_aliases};
pub use component::{emit_component_css, Component};
pub use css::{emit_css, emit_theme_css};
pub use dtcg::{flatten_modes, tokens_from_dtcg};
pub use mode::{scope_selectors, Axis};
pub use pipeline::{
    emit_component_tokens_css, emit_theme_overrides_css, emit_tokens_css, emit_tokens_scss,
    TokenSources,
};
pub use scss::emit_scss;
pub use token::Token;
pub use ts::emit_ts;
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
mod ts_tests;
#[cfg(test)]
mod value_tests;

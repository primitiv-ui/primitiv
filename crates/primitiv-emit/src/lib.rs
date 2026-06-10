pub mod alias;
pub mod css;
pub mod dtcg;
pub mod token;
pub mod value;

pub use alias::resolve_aliases;
pub use css::emit_css;
pub use dtcg::tokens_from_dtcg;
pub use token::Token;
pub use value::format_number;

#[cfg(test)]
mod alias_tests;
#[cfg(test)]
mod css_tests;
#[cfg(test)]
mod dtcg_tests;
#[cfg(test)]
mod value_tests;

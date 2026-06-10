use pretty_assertions::assert_eq;

use crate::mode::{scope_selectors, Axis};

#[test]
fn theme_default_mode_shares_root() {
    assert_eq!(
        scope_selectors(&Axis::Theme, "light"),
        vec![":root".to_string(), "[data-theme=\"light\"]".to_string()]
    );
}

#[test]
fn theme_non_default_mode_is_its_own_scope() {
    assert_eq!(
        scope_selectors(&Axis::Theme, "dark"),
        vec!["[data-theme=\"dark\"]".to_string()]
    );
}

#[test]
fn density_default_mode_shares_root() {
    assert_eq!(
        scope_selectors(&Axis::Density, "comfortable"),
        vec![":root".to_string(), "[data-density=\"comfortable\"]".to_string()]
    );
}

#[test]
fn density_non_default_mode_is_its_own_scope() {
    assert_eq!(
        scope_selectors(&Axis::Density, "dense"),
        vec!["[data-density=\"dense\"]".to_string()]
    );
}

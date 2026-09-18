use pretty_assertions::assert_eq;

use crate::slug::slug;

#[test]
fn lowercases_the_name_and_joins_its_words_with_hyphens() {
    assert_eq!(slug("My Project"), "my-project");
}

#[test]
fn collapses_every_run_of_non_alphanumerics_to_one_hyphen_and_trims_the_edges() {
    assert_eq!(slug("  Spaced  Name "), "spaced-name");
    assert_eq!(slug("v2 Theme!"), "v2-theme");
    assert_eq!(slug("Brand / Design"), "brand-design");
}

#[test]
fn is_empty_for_a_name_with_no_slug_characters_at_all() {
    // The caller — not this function — decides the fallback, so an unsluggable
    // name comes back empty rather than pre-substituted.
    assert_eq!(slug(""), "");
    assert_eq!(slug("   "), "");
    assert_eq!(slug("!!!"), "");
}

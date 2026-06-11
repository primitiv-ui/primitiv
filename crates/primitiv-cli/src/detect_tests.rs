use pretty_assertions::assert_eq;

use crate::detect::parse_components_alias;

#[test]
fn derives_the_components_alias_from_a_root_src_mapping() {
    // The canonical Vite / shadcn setup: `@/*` resolves to `./src/*`.
    let config = br#"{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }"#;

    assert_eq!(parse_components_alias(config), Some("@/components".to_string()));
}

#[test]
fn honours_a_non_at_prefix() {
    // Whatever the prefix is, the components alias is `<prefix>/components`.
    let config = br#"{ "compilerOptions": { "paths": { "~/*": ["./src/*"] } } }"#;

    assert_eq!(parse_components_alias(config), Some("~/components".to_string()));
}

#[test]
fn accepts_a_target_without_a_leading_dot_slash() {
    let config = br#"{ "compilerOptions": { "paths": { "@/*": ["src/*"] } } }"#;

    assert_eq!(parse_components_alias(config), Some("@/components".to_string()));
}

#[test]
fn accepts_a_next_js_root_without_a_src_dir() {
    // Next.js without a `src` dir maps the alias straight at the project root.
    let config = br#"{ "compilerOptions": { "paths": { "@/*": ["./*"] } } }"#;

    assert_eq!(parse_components_alias(config), Some("@/components".to_string()));
}

#[test]
fn returns_none_for_a_config_that_does_not_parse() {
    assert_eq!(parse_components_alias(b"not json"), None);
}

#[test]
fn returns_none_when_there_are_no_compiler_options() {
    assert_eq!(parse_components_alias(b"{}"), None);
}

#[test]
fn returns_none_when_there_are_no_paths() {
    assert_eq!(parse_components_alias(br#"{ "compilerOptions": {} }"#), None);
}

#[test]
fn ignores_a_non_wildcard_alias_key() {
    // A bare alias (no `/*`) is not a root mapping we can extend.
    let config = br#"{ "compilerOptions": { "paths": { "@/components": ["./src/components"] } } }"#;

    assert_eq!(parse_components_alias(config), None);
}

#[test]
fn ignores_a_mapping_with_no_targets() {
    let config = br#"{ "compilerOptions": { "paths": { "@/*": [] } } }"#;

    assert_eq!(parse_components_alias(config), None);
}

#[test]
fn ignores_a_mapping_that_does_not_resolve_to_the_source_root() {
    // `@/*` pointing at a nested dir is not the root alias we extend.
    let config = br#"{ "compilerOptions": { "paths": { "@/*": ["./app/lib/*"] } } }"#;

    assert_eq!(parse_components_alias(config), None);
}

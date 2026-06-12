use std::path::Path;

use pretty_assertions::assert_eq;

use crate::detect::{components_alias, parse_components_alias, parse_components_path};
use crate::error::CliError;
use crate::ports::fs::{FileSystem, InMemoryFs};

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

#[test]
fn resolves_a_root_src_mapping_to_the_src_components_directory() {
    // `@/*` → `./src/*` means the components alias resolves on disk to
    // `src/components`, where `add` writes the React surface.
    let config = br#"{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }"#;

    assert_eq!(parse_components_path(config), Some("src/components".to_string()));
}

#[test]
fn resolves_a_next_js_root_mapping_to_the_components_directory() {
    // Next.js without a `src` dir maps the alias at the project root, so the
    // components directory is just `components`.
    let config = br#"{ "compilerOptions": { "paths": { "@/*": ["./*"] } } }"#;

    assert_eq!(parse_components_path(config), Some("components".to_string()));
}

#[test]
fn resolves_to_none_when_there_is_no_root_mapping() {
    let config = br#"{ "compilerOptions": { "paths": { "@/*": ["./app/lib/*"] } } }"#;

    assert_eq!(parse_components_path(config), None);
}

#[test]
fn reads_the_alias_from_tsconfig_in_the_directory() {
    let fs = InMemoryFs::new();
    fs.write(
        Path::new("project/tsconfig.json"),
        br#"{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }"#,
    )
    .unwrap();

    let alias = components_alias(&fs, Path::new("project")).unwrap();

    assert_eq!(alias, Some("@/components".to_string()));
}

#[test]
fn falls_back_to_jsconfig_when_tsconfig_is_absent() {
    let fs = InMemoryFs::new();
    fs.write(
        Path::new("project/jsconfig.json"),
        br#"{ "compilerOptions": { "paths": { "~/*": ["./src/*"] } } }"#,
    )
    .unwrap();

    let alias = components_alias(&fs, Path::new("project")).unwrap();

    assert_eq!(alias, Some("~/components".to_string()));
}

#[test]
fn returns_none_when_neither_config_exists() {
    let fs = InMemoryFs::new();

    let alias = components_alias(&fs, Path::new("project")).unwrap();

    assert_eq!(alias, None);
}

#[test]
fn prefers_tsconfig_even_when_it_carries_no_alias() {
    // A present tsconfig is authoritative: its lack of a root mapping is not a
    // cue to consult jsconfig, so the alias-bearing jsconfig is ignored.
    let fs = InMemoryFs::new();
    fs.write(Path::new("project/tsconfig.json"), b"{}").unwrap();
    fs.write(
        Path::new("project/jsconfig.json"),
        br#"{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }"#,
    )
    .unwrap();

    let alias = components_alias(&fs, Path::new("project")).unwrap();

    assert_eq!(alias, None);
}

#[test]
fn surfaces_a_failure_to_read_a_config() {
    let fs = InMemoryFs::new();
    fs.fail_reads_to(Path::new("project/tsconfig.json"));

    let err = components_alias(&fs, Path::new("project")).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

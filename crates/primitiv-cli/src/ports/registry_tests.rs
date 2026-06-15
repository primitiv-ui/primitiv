use std::path::Path;

use crate::ports::fs::{FileSystem, InMemoryFs};
use crate::ports::registry::{EmbeddedRegistry, InMemoryRegistry, LocalRegistry, Registry};
use crate::registry::RegistryIndex;

#[test]
fn embedded_registry_serves_the_baked_in_index() {
    let index = RegistryIndex::parse(&EmbeddedRegistry.index().unwrap()).unwrap();

    // The authored registry.json is valid and carries the seed components.
    assert!(index.components.contains_key("button"));
    assert!(index.components.contains_key("switch"));
}

#[test]
fn embedded_registry_serves_a_component_file() {
    let bytes = EmbeddedRegistry.file("button", "styles.css").unwrap();

    // The baked-in Button stylesheet, served verbatim.
    let css = String::from_utf8(bytes).unwrap();
    assert!(css.contains(".primitiv-button"));
}

#[test]
fn embedded_registry_reports_an_unknown_file_as_not_found() {
    assert_eq!(
        EmbeddedRegistry
            .file("button", "nope.css")
            .unwrap_err()
            .kind(),
        std::io::ErrorKind::NotFound
    );
}

#[test]
fn in_memory_registry_serves_a_configured_file() {
    let registry = InMemoryRegistry::new(b"{}").with_file("button", "styles.css", b".primitiv-button{}");

    assert_eq!(
        registry.file("button", "styles.css").unwrap(),
        b".primitiv-button{}"
    );
}

#[test]
fn in_memory_registry_reports_an_unconfigured_file_as_not_found() {
    let registry = InMemoryRegistry::new(b"{}");

    assert_eq!(
        registry.file("button", "styles.css").unwrap_err().kind(),
        std::io::ErrorKind::NotFound
    );
}

#[test]
fn in_memory_registry_serves_its_configured_index() {
    let registry = InMemoryRegistry::new(b"{ \"version\": \"9.9.9\" }");

    assert_eq!(registry.index().unwrap(), b"{ \"version\": \"9.9.9\" }");
}

#[test]
fn in_memory_registry_can_fail() {
    let registry = InMemoryRegistry::failing();

    assert_eq!(
        registry.index().unwrap_err().kind(),
        std::io::ErrorKind::NotFound
    );
}

#[test]
fn local_registry_reads_the_index_from_its_base_directory() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("vendor/registry/registry.json"), b"{ \"version\": \"0.1.0\" }")
        .unwrap();
    let registry = LocalRegistry::new(&fs, Path::new("vendor/registry"));

    assert_eq!(registry.index().unwrap(), b"{ \"version\": \"0.1.0\" }");
}

#[test]
fn local_registry_reads_a_component_file_from_the_r_layout() {
    let fs = InMemoryFs::new();
    fs.write(
        Path::new("vendor/registry/r/button/styles.css"),
        b".primitiv-button{}",
    )
    .unwrap();
    let registry = LocalRegistry::new(&fs, Path::new("vendor/registry"));

    assert_eq!(
        registry.file("button", "styles.css").unwrap(),
        b".primitiv-button{}"
    );
}

#[test]
fn local_registry_reports_a_missing_file_as_not_found() {
    let fs = InMemoryFs::new();
    let registry = LocalRegistry::new(&fs, Path::new("vendor/registry"));

    assert_eq!(
        registry.file("button", "styles.css").unwrap_err().kind(),
        std::io::ErrorKind::NotFound
    );
}

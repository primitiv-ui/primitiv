use crate::ports::registry::{EmbeddedRegistry, InMemoryRegistry, Registry};
use crate::registry::RegistryIndex;

#[test]
fn embedded_registry_serves_the_baked_in_index() {
    let index = RegistryIndex::parse(&EmbeddedRegistry.index().unwrap()).unwrap();

    // The authored registry.json is valid and carries the seed components.
    assert!(index.components.contains_key("button"));
    assert!(index.components.contains_key("switch"));
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

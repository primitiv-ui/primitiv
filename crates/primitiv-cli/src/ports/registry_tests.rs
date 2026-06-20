use std::io::{Read, Write};
use std::net::TcpListener;
use std::path::Path;
use std::thread;

use crate::ports::fs::{FileSystem, InMemoryFs};
use crate::ports::registry::{
    EmbeddedRegistry, HttpsRegistry, InMemoryRegistry, LocalRegistry, Registry,
};
use crate::registry::RegistryIndex;

/// Spin up a loopback HTTP server that answers the next request with `status`
/// and `body`, then returns its `http://127.0.0.1:<port>` base URL. Lets the real
/// `ureq` fetch path run deterministically without reaching the network (RFC 0007
/// §2.2 — the adapter's testable seam). The listener moves into the handler
/// thread, which runs detached for the one request the test makes.
fn serve_once(status: &str, body: &str) -> String {
    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let port = listener.local_addr().unwrap().port();
    let response = format!("{status}\r\nContent-Length: {}\r\n\r\n{body}", body.len());
    thread::spawn(move || {
        if let Ok((mut stream, _)) = listener.accept() {
            let mut scratch = [0u8; 1024];
            let _ = stream.read(&mut scratch);
            let _ = stream.write_all(response.as_bytes());
        }
    });
    format!("http://127.0.0.1:{port}")
}

#[test]
fn embedded_registry_serves_the_baked_in_index() {
    let index = RegistryIndex::parse(&EmbeddedRegistry.index().unwrap()).unwrap();

    // The authored registry.json is valid and carries the seed components.
    assert!(index.components.contains_key("button"));
    assert!(index.components.contains_key("field"));
    assert!(index.components.contains_key("input"));
    assert!(index.components.contains_key("input-group"));
    assert!(index.components.contains_key("switch"));
    assert!(index.components.contains_key("tabs"));
}

#[test]
fn embedded_input_group_declares_its_input_component_dependency() {
    let index = RegistryIndex::parse(&EmbeddedRegistry.index().unwrap()).unwrap();

    // InputGroup's default theme neutralises the nested `.primitiv-input` frame,
    // so it pulls Input in transitively — the first real component dependency.
    assert_eq!(
        index.components["input-group"].depends_on.components,
        ["input"],
    );
}

#[test]
fn embedded_registry_serves_the_structural_compound_files() {
    // Tabs is the first structural compound — its baked-in surface is served
    // verbatim, so `primitiv add tabs` resolves against the binary's own copy.
    let css = String::from_utf8(EmbeddedRegistry.file("tabs", "styles.css").unwrap()).unwrap();
    assert!(css.contains(".primitiv-tabs__trigger"));
    let wrapper = String::from_utf8(EmbeddedRegistry.file("tabs", "tabs.tsx").unwrap()).unwrap();
    assert!(wrapper.contains("export function TabsTrigger"));
}

#[test]
fn embedded_registry_serves_the_field_files() {
    // Field is a structural, no-modifier compound — its baked-in surface carries
    // the per-part wrappers `primitiv add field` resolves against the binary.
    let css = String::from_utf8(EmbeddedRegistry.file("field", "styles.css").unwrap()).unwrap();
    assert!(css.contains(".primitiv-field__error"));
    let wrapper = String::from_utf8(EmbeddedRegistry.file("field", "field.tsx").unwrap()).unwrap();
    assert!(wrapper.contains("export function FieldErrorText"));
}

#[test]
fn embedded_registry_serves_the_input_group_files() {
    // InputGroup is a structural compound with adornment slots — its baked-in
    // surface carries the per-part wrappers `primitiv add input-group` resolves.
    let css =
        String::from_utf8(EmbeddedRegistry.file("input-group", "styles.css").unwrap()).unwrap();
    assert!(css.contains(".primitiv-input-group__leading"));
    let wrapper =
        String::from_utf8(EmbeddedRegistry.file("input-group", "input-group.tsx").unwrap())
            .unwrap();
    assert!(wrapper.contains("export function InputGroupLeadingAdornment"));
}

#[test]
fn embedded_registry_serves_the_input_files() {
    // Input is the first registry control whose styled wrapper omits a native
    // attribute (`size`) — its baked-in surface is served verbatim.
    let css = String::from_utf8(EmbeddedRegistry.file("input", "styles.css").unwrap()).unwrap();
    assert!(css.contains(".primitiv-input"));
    let wrapper = String::from_utf8(EmbeddedRegistry.file("input", "input.tsx").unwrap()).unwrap();
    assert!(wrapper.contains("export function Input"));
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
fn local_registry_reads_a_component_file_from_the_components_layout() {
    let fs = InMemoryFs::new();
    fs.write(
        Path::new("vendor/registry/components/button/styles.css"),
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

#[test]
fn https_registry_fetches_the_index_over_http() {
    let base = serve_once("HTTP/1.1 200 OK", "{ \"version\": \"0.1.0\" }");
    let registry = HttpsRegistry::new(base);

    assert_eq!(registry.index().unwrap(), b"{ \"version\": \"0.1.0\" }");
}

#[test]
fn https_registry_fetches_a_component_file_over_http() {
    let base = serve_once("HTTP/1.1 200 OK", ".primitiv-button{}");
    let registry = HttpsRegistry::new(base);

    assert_eq!(
        registry.file("button", "styles.css").unwrap(),
        b".primitiv-button{}"
    );
}

#[test]
fn https_registry_maps_a_non_2xx_status_to_an_error() {
    let base = serve_once("HTTP/1.1 404 Not Found", "not here");
    let registry = HttpsRegistry::new(base);

    assert!(registry.file("button", "styles.css").is_err());
}

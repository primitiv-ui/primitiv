//! Regenerates the example markup `registry.json` names as each component's
//! `elements.example` (RFC 0033 §8.1) from that component's contract. Writes
//! exactly what the generator produces, so a committed snippet never drifts
//! from it; `snippet_tests` fails until this has been run.
use std::fs;
use std::path::Path;

use primitiv_emit::contract::Contract;
use primitiv_emit::snippet::emit_snippet;

fn main() {
    let registry = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../registry");
    let index: serde_json::Value =
        serde_json::from_str(&fs::read_to_string(registry.join("registry.json")).unwrap()).unwrap();
    for (name, entry) in index["components"].as_object().unwrap() {
        if let Some(file) = entry["elements"]["example"].as_str() {
            let dir = registry.join("components").join(name);
            let contract = Contract::parse(&fs::read(dir.join("contract.json")).unwrap()).unwrap();
            fs::write(dir.join(file), emit_snippet(&contract)).unwrap();
            println!("wrote registry/components/{name}/{file}");
        }
    }
}

//! Regenerates every markup snippet `registry.json` lists under a component's
//! `elements.files` (RFC 0033 §8.1) from that component's contract. Writes
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
        let files = entry["elements"]["files"].as_array().into_iter().flatten();
        for file in files
            .filter_map(|file| file.as_str())
            .filter(|file| file.ends_with(".html"))
        {
            let dir = registry.join("components").join(name);
            let contract = Contract::parse(&fs::read(dir.join("contract.json")).unwrap()).unwrap();
            fs::write(dir.join(file), emit_snippet(&contract)).unwrap();
            println!("wrote registry/components/{name}/{file}");
        }
    }
}

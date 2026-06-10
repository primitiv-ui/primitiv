use serde_json::{Map, Value};

use crate::token::Token;

/// Flatten a DTCG token tree into resolved [`Token`]s (RFC 0006 §3–4).
///
/// A node carrying a string `$value` is a leaf — its nesting path becomes the
/// token path. Group nodes recurse; `$`-prefixed metadata keys (`$type`,
/// `$description`) are skipped. Alias resolution and non-string value
/// formatting arrive in later cycles.
pub fn tokens_from_dtcg(root: &Value) -> Vec<Token> {
    let mut tokens = Vec::new();
    let mut path = Vec::new();
    if let Some(map) = root.as_object() {
        collect(map, &mut path, &mut tokens);
    }
    tokens
}

fn collect(map: &Map<String, Value>, path: &mut Vec<String>, out: &mut Vec<Token>) {
    for (key, child) in map {
        if key.starts_with('$') {
            continue;
        }
        path.push(key.clone());
        if let Some(value) = child.get("$value").and_then(Value::as_str) {
            out.push(Token {
                path: path.clone(),
                value: value.to_string(),
            });
        } else if let Some(child_map) = child.as_object() {
            collect(child_map, path, out);
        }
        path.pop();
    }
}

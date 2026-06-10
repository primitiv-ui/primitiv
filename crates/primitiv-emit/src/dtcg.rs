use serde_json::{Map, Value};

use crate::token::Token;
use crate::value::format_number;

/// Flatten a DTCG token tree into resolved [`Token`]s (RFC 0006 §3–4).
///
/// A node carrying a `$value` is a leaf — its nesting path becomes the token
/// path. String values (colours, aliases) are taken verbatim; numeric values
/// are formatted by category (`format_number`). Group nodes recurse;
/// `$`-prefixed metadata keys (`$type`, `$description`) are skipped. Leaves
/// whose `$value` is neither text nor a number (e.g. composite shadow/gradient
/// tokens) are not yet supported and are skipped.
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
        if let Some(value) = child.get("$value") {
            if let Some(text) = value.as_str() {
                out.push(Token {
                    path: path.clone(),
                    value: text.to_string(),
                });
            } else if let Some(number) = value.as_f64() {
                out.push(Token {
                    path: path.clone(),
                    value: format_number(&path[0], number),
                });
            }
        } else if let Some(child_map) = child.as_object() {
            collect(child_map, path, out);
        }
        path.pop();
    }
}

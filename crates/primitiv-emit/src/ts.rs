//! TS/JS serialiser — a nested, typed token object (RFC 0006 §4.2, D47).

use crate::token::Token;

/// Emit the token surface as a nested, typed TS object (RFC 0006 §4.2, D47):
/// each token's path becomes a nesting of object keys (`color.primary`) ending
/// in its value, exported `as const` so consumers get literal-typed
/// autocomplete (`tokens.color.primary`). Values are inlined, not `var()`
/// references — the TS object is for tokens-in-code, the CSS path carries the
/// override chain.
pub fn emit_ts(tokens: &[Token]) -> String {
    let mut root = Node::default();
    for token in tokens {
        root.insert(&token.path, &token.value);
    }
    let mut out = String::from("export const tokens = ");
    root.write(&mut out, 0);
    out.push_str(" as const;\n");
    out
}

/// An insertion-ordered node of the token tree: a leaf carries an inlined
/// `value`; a branch carries ordered `children` keyed by path segment.
#[derive(Default)]
struct Node {
    value: Option<String>,
    children: Vec<(String, Node)>,
}

impl Node {
    fn insert(&mut self, path: &[String], value: &str) {
        match path.split_first() {
            None => self.value = Some(value.to_string()),
            Some((segment, rest)) => {
                if !self.children.iter().any(|(key, _)| key == segment) {
                    self.children.push((segment.clone(), Node::default()));
                }
                let child = self
                    .children
                    .iter_mut()
                    .find(|(key, _)| key == segment)
                    .map(|(_, node)| node)
                    .expect("segment was just inserted");
                child.insert(rest, value);
            }
        }
    }

    fn write(&self, out: &mut String, depth: usize) {
        if let Some(value) = &self.value {
            out.push_str(&format!("\"{value}\""));
            return;
        }
        out.push_str("{\n");
        let inner = "  ".repeat(depth + 1);
        for (key, child) in &self.children {
            out.push_str(&inner);
            out.push_str(&object_key(key));
            out.push_str(": ");
            child.write(out, depth + 1);
            out.push_str(",\n");
        }
        out.push_str(&"  ".repeat(depth));
        out.push('}');
    }
}

/// A path segment as a TS object key — bare when it is a valid identifier.
fn object_key(segment: &str) -> String {
    segment.to_string()
}

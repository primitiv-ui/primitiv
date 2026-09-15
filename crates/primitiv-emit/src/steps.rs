//! Re-pointing the semantic layer when a ramp is not ten steps long.
//!
//! Primitiv's own scale is ten, and the shipped Intent layer is written against
//! it: `action/primary/hover` aliases `{color.brand.600}`, `disabled` aliases
//! `{color.brand.200}`, and so on. Ask the engine for a ramp of any other length
//! and those steps stop existing — a seven-step ramp labels
//! `50, 100, 300, 500, 630, 770, 900`, so `var(--primitiv-color-brand-600)`
//! resolves to nothing and the role silently keeps whatever the base layer had.
//!
//! Ten is in fact the **only** length at which the shipped Intent layer resolves
//! completely. Even nine and eleven lose 600, 700 and 800.

use crate::token::Token;

/// The label closest to `wanted` among the ones a ramp actually has.
///
/// Ties go to the **higher** label. A role that cannot land on its own step is
/// better served by more contrast than less: a higher step is darker in the light
/// ramp and lighter in the dark one, so it reads more strongly against its own
/// mode's surface either way.
pub fn nearest_label(wanted: u16, available: &[u16]) -> u16 {
    available
        .iter()
        .copied()
        .min_by_key(|label| (label.abs_diff(wanted), u16::MAX - label))
        .unwrap_or(wanted)
}

/// The Intent roles that need re-pointing because the ramp they alias no longer
/// has the step they name, each carrying its rewritten DTCG alias.
///
/// Only roles aliasing one of `families` are considered — the families actually
/// being regenerated. A project that re-seeds `brand` at seven steps leaves every
/// other family on the shipped ten-step ramp, so their roles still resolve and
/// must not be touched.
///
/// A role whose step survives the new length is **not** returned: re-emitting it
/// unchanged would be noise in the override file, and the point is to say only
/// what moved. At ten steps and above nothing moves at all, which is why a
/// project on the default scale sees no Intent block whatsoever.
///
/// The value is left as a DTCG alias rather than a `var()` reference so the
/// caller resolves it through [`link_aliases`](crate::alias::link_aliases), the
/// same path every other alias takes — there is one place that decides what a
/// custom property is called.
pub fn realias(intent: &serde_json::Value, families: &[&str], labels: &[u16]) -> Vec<Token> {
    let mut moved = Vec::new();
    collect_roles(intent, &mut Vec::new(), families, labels, &mut moved);
    moved
}

/// Walks the Intent tree, rewriting each alias that names a missing step.
fn collect_roles(
    node: &serde_json::Value,
    path: &mut Vec<String>,
    families: &[&str],
    labels: &[u16],
    out: &mut Vec<Token>,
) {
    let Some(map) = node.as_object() else {
        return;
    };

    if let Some(value) = map.get("$value").and_then(serde_json::Value::as_str) {
        if let Some((family, step)) = aliased_step(value) {
            if families.contains(&family.as_str()) && !labels.contains(&step) {
                let nearest = nearest_label(step, labels);
                out.push(Token::new(
                    &path.iter().map(String::as_str).collect::<Vec<_>>(),
                    &format!("{{color.{family}.{nearest}}}"),
                ));
            }
        }
        return;
    }

    for (key, child) in map {
        if key.starts_with('$') {
            continue;
        }
        path.push(key.clone());
        collect_roles(child, path, families, labels, out);
        path.pop();
    }
}

/// The `(family, step)` a `{color.<family>.<step>}` alias names, or `None` for any
/// other value — a literal colour, or an alias into another collection.
fn aliased_step(value: &str) -> Option<(String, u16)> {
    let path = value.strip_prefix("{color.")?.strip_suffix('}')?;
    let (family, step) = path.rsplit_once('.')?;
    Some((family.to_string(), step.parse().ok()?))
}

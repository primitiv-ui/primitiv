//! Re-pointing the semantic layer when a ramp is not ten steps long.
//!
//! Primitiv's own scale is ten, and the shipped Intent layer is written against
//! it: `action/primary/hover` aliases `{color.brand.600}`, `disabled` aliases
//! `{color.brand.200}`, and so on. Ask the engine for a ramp of any other length
//! and those steps stop existing — a seven-step ramp labels
//! `50, 100, 230, 370, 500, 700, 900`, so `var(--primitiv-color-brand-600)`
//! resolves to nothing and the role silently keeps whatever the base layer had.
//!
//! Measured against the shipped `intent.json` across every supported length:
//! **10, 18 and 26** are the only ones whose labels carry all nine decades, so
//! they need no re-pointing at all. Every other length between 3 and 32 moves
//! between 21 and 73 roles, and the count does not fall as the ramp grows — 12
//! steps moves 59 where 6 moves 21 — because what matters is which decades the
//! rounding happens to land on, not how many steps there are. No length in that
//! range produces two identical labels, so there is always exactly one nearest
//! step to move a role to.

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
    collect_roles(
        intent,
        &mut Vec::new(),
        families,
        labels,
        Emit::Moved,
        &mut moved,
    );
    moved
}

/// **Every** role in the document, re-pointed where this ramp length dropped the
/// step it names.
///
/// The counterpart to [`realias`], for a caller emitting its OWN semantic layer
/// rather than patching Primitiv's shipped one. There the whole point is that
/// nothing is emitted unless it moved; here the whole point is that everything is,
/// because nothing else is going to declare these roles.
///
/// A role whose `$value` is not an alias is skipped, as it is there — this walks
/// aliases. That costs nothing for a resolved role, which always names a ramp and
/// a step by construction.
pub fn resolve_roles(roles: &serde_json::Value, families: &[&str], labels: &[u16]) -> Vec<Token> {
    let mut all = Vec::new();
    collect_roles(
        roles,
        &mut Vec::new(),
        families,
        labels,
        Emit::All,
        &mut all,
    );
    all
}

/// Which roles a walk keeps: the ones a shortened ramp broke, or all of them.
#[derive(Clone, Copy, PartialEq, Eq)]
enum Emit {
    Moved,
    All,
}

/// Walks the Intent tree, rewriting each alias that names a missing step.
fn collect_roles(
    node: &serde_json::Value,
    path: &mut Vec<String>,
    families: &[&str],
    labels: &[u16],
    emit: Emit,
    out: &mut Vec<Token>,
) {
    let Some(map) = node.as_object() else {
        return;
    };

    if let Some(value) = map.get("$value").and_then(serde_json::Value::as_str) {
        if let Some((family, step)) = aliased_step(value) {
            // A step only needs moving when this length dropped it from a family the
            // caller is actually regenerating; anything else still resolves as written.
            let moved = families.contains(&family.as_str()) && !labels.contains(&step);
            if moved || emit == Emit::All {
                let step = if moved {
                    nearest_label(step, labels)
                } else {
                    step
                };
                out.push(Token::new(
                    &path.iter().map(String::as_str).collect::<Vec<_>>(),
                    &format!("{{color.{family}.{step}}}"),
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
        collect_roles(child, path, families, labels, emit, out);
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

use std::collections::BTreeSet;

use crate::error::CliError;
use crate::ports::output::Output;
use crate::ports::registry::Registry;
use crate::registry::RegistryIndex;

/// The `primitiv add <component...>` command (RFC 0005 §2.2 / §4).
///
/// This is the resolution spine of `add`: it loads the registry index through
/// the [`Registry`] port, resolves each requested component **and its transitive
/// component dependencies** (§4.4), and reports the install plan to stdout. A
/// requested or depended-on component that the registry doesn't carry is a
/// [`CliError::NotFound`]. The package-install and style-copy effects (§4.2–§4.3)
/// layer on in later slices; resolving and reporting come first.
pub fn add(
    registry: &impl Registry,
    output: &impl Output,
    components: &[String],
) -> Result<(), CliError> {
    let index = registry
        .index()
        .map_err(|error| CliError::Registry(error.to_string()))?;
    let index = RegistryIndex::parse(&index)?;
    let resolved = resolve(&index, components)?;
    output.write_stdout(render(&index, &resolved).as_bytes())?;
    Ok(())
}

/// Resolve the requested components to the full, deduplicated, sorted set that
/// must be added — every request plus everything reachable through
/// `dependsOn.components` (RFC 0005 §4.4). A name absent from the index is a
/// [`CliError::NotFound`]; the `insert`-guarded walk both deduplicates and keeps
/// a dependency cycle from looping forever.
fn resolve(index: &RegistryIndex, requested: &[String]) -> Result<Vec<String>, CliError> {
    let mut resolved = BTreeSet::new();
    let mut pending: Vec<String> = requested.to_vec();
    while let Some(name) = pending.pop() {
        let entry = index.components.get(&name).ok_or_else(|| {
            CliError::NotFound(format!(
                "component '{name}' is not in the registry; \
                 run 'primitiv list' to see what's available"
            ))
        })?;
        if resolved.insert(name) {
            pending.extend(entry.depends_on.components.iter().cloned());
        }
    }
    Ok(resolved.into_iter().collect())
}

/// Format the resolved set as a plan — a `Resolved N component(s) to add:` header
/// over an aligned `name  version` list, the components in sorted order.
fn render(index: &RegistryIndex, resolved: &[String]) -> String {
    let plural = if resolved.len() == 1 { "" } else { "s" };
    let width = resolved.iter().map(String::len).max().unwrap_or(0);
    let mut plan = format!("Resolved {} component{plural} to add:\n", resolved.len());
    for name in resolved {
        let version = &index.components[name].version;
        plan.push_str(&format!("  {name:<width$}  {version}\n"));
    }
    plan
}

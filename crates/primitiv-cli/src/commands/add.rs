use std::collections::BTreeSet;

use crate::error::CliError;
use crate::ports::output::Output;
use crate::ports::registry::Registry;
use crate::registry::RegistryIndex;

/// The `primitiv add <component...>` command (RFC 0005 §2.2 / §4).
///
/// This is the resolution spine of `add`: it loads the registry index through
/// the [`Registry`] port, resolves each requested component **and its transitive
/// component dependencies** (§4.4), and reports the install plan to stdout — the
/// human table, or the structured plan under `--json` for agents (§6.5). A
/// requested or depended-on component that the registry doesn't carry is a
/// [`CliError::NotFound`]. The package-install and style-copy effects (§4.2–§4.3)
/// layer on in later slices; resolving and reporting come first.
pub fn add(
    registry: &impl Registry,
    output: &impl Output,
    components: &[String],
    json: bool,
) -> Result<(), CliError> {
    let index = registry
        .index()
        .map_err(|error| CliError::Registry(error.to_string()))?;
    let index = RegistryIndex::parse(&index)?;
    let resolved = resolve(&index, components)?;
    let plan = if json {
        render_json(&index, &resolved)
    } else {
        render(&index, &resolved)
    };
    output.write_stdout(plan.as_bytes())?;
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
/// over an aligned `name  version` list, then (when any) the `Packages to
/// ensure:` the components pull in. Both lists are sorted; the package list is
/// the deduplicated union across the resolved components (RFC 0005 §4.4).
fn render(index: &RegistryIndex, resolved: &[String]) -> String {
    let plural = if resolved.len() == 1 { "" } else { "s" };
    let width = resolved.iter().map(String::len).max().unwrap_or(0);
    let mut plan = format!("Resolved {} component{plural} to add:\n", resolved.len());
    for name in resolved {
        let version = &index.components[name].version;
        plan.push_str(&format!("  {name:<width$}  {version}\n"));
    }
    let packages = packages(index, resolved);
    if !packages.is_empty() {
        plan.push_str("\nPackages to ensure:\n");
        for package in &packages {
            plan.push_str(&format!("  {package}\n"));
        }
    }
    plan
}

/// Format the plan as JSON for agents (RFC 0005 §6.5): the resolved components
/// with their versions, and the packages to ensure — the same data the human
/// table carries, machine-readable. Hand-rendered to exact bytes (the authored-
/// golden discipline, RFC 0007 §4); the values are registry-controlled and need
/// no escaping.
fn render_json(index: &RegistryIndex, resolved: &[String]) -> String {
    let components: Vec<String> = resolved
        .iter()
        .map(|name| {
            let version = &index.components[name].version;
            format!("    {{ \"name\": \"{name}\", \"version\": \"{version}\" }}")
        })
        .collect();
    let packages: Vec<String> = packages(index, resolved)
        .iter()
        .map(|package| format!("    \"{package}\""))
        .collect();
    format!(
        "{{\n  \"components\": {},\n  \"packages\": {}\n}}\n",
        json_array(components),
        json_array(packages),
    )
}

/// Wrap pre-indented `items` as a JSON array, collapsing to `[]` when empty so
/// an empty package list stays valid.
fn json_array(items: Vec<String>) -> String {
    if items.is_empty() {
        "[]".to_string()
    } else {
        format!("[\n{}\n  ]", items.join(",\n"))
    }
}

/// The deduplicated, sorted union of the npm packages the resolved components
/// declare — the headless libraries `add` ensures are installed (RFC 0005 §4.4).
fn packages<'a>(index: &'a RegistryIndex, resolved: &[String]) -> Vec<&'a str> {
    resolved
        .iter()
        .flat_map(|name| index.components[name].depends_on.packages.iter())
        .map(String::as_str)
        .collect::<BTreeSet<_>>()
        .into_iter()
        .collect()
}

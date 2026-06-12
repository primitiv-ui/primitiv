use std::collections::BTreeSet;
use std::path::Path;

use crate::config;
use crate::error::CliError;
use crate::package_manager::PackageManager;
use crate::ports::fs::FileSystem;
use crate::ports::output::Output;
use crate::ports::process::ProcessRunner;
use crate::ports::registry::Registry;
use crate::registry::RegistryIndex;

/// The order-free options `add` is invoked with (RFC 0005 §2.2 / §5), mirroring
/// [`InitOptions`](crate::commands::init::InitOptions): one or more component
/// names plus the agent/dry-run switches. Deriving `Default` lets later flags
/// (`--styles-only`, `--no-styles`, …) join without churning every call site.
#[derive(Debug, Default, PartialEq)]
pub struct AddOptions {
    pub components: Vec<String>,
    pub json: bool,
    pub dry_run: bool,
    /// Copy the styled surface but skip installing the headless package (RFC
    /// 0005 §4.1 step 2). Mutually exclusive with `no_styles` (enforced by the
    /// parser).
    pub styles_only: bool,
    /// Install the headless package but stop before copying styles (§4.1 step 3).
    pub no_styles: bool,
}

/// The `primitiv add <component...>` command (RFC 0005 §2.2 / §4).
///
/// It loads the registry index through the [`Registry`] port, resolves each
/// requested component **and its transitive component dependencies** (§4.4),
/// reports the install plan to stdout — the human table, or the structured plan
/// under `--json` for agents (§6.5) — then **ensures the headless package(s)**
/// are installed by running the detected package manager through the
/// [`ProcessRunner`] port (§4.1 step 2) and **copies the styled surface** into
/// the project (§4.1 step 4, [`copy_styles`]). `--dry-run` reports the plan and
/// stops before touching anything. A requested or depended-on component the
/// registry doesn't carry is a [`CliError::NotFound`]; a package manager that
/// fails is a [`CliError::Install`]. The remaining wiring effects (§4.3) layer
/// on in later slices.
pub fn add(
    fs: &impl FileSystem,
    registry: &impl Registry,
    output: &impl Output,
    runner: &impl ProcessRunner,
    options: &AddOptions,
) -> Result<(), CliError> {
    let AddOptions {
        components,
        json,
        dry_run,
        styles_only,
        no_styles,
    } = options;
    let index = registry
        .index()
        .map_err(|error| CliError::Registry(error.to_string()))?;
    let index = RegistryIndex::parse(&index)?;
    let resolved = resolve(&index, components)?;
    let plan = if *json {
        render_json(&index, &resolved)
    } else {
        render(&index, &resolved)
    };
    output.write_stdout(plan.as_bytes())?;
    if !*dry_run {
        let dir = fs.current_dir()?;
        if !*styles_only {
            ensure_packages(fs, runner, &index, &resolved, &dir)?;
        }
        if !*no_styles {
            copy_styles(fs, registry, &index, &resolved, &dir)?;
        }
    }
    Ok(())
}

/// Copy each resolved component's stylesheet for the configured format into the
/// styles path (RFC 0005 §4.1 step 4). Style-copy opts in through the project
/// config: with no `primitiv.json` (a headless-only install) or
/// `styles.enabled = false`, nothing is copied. Otherwise each declared file is
/// fetched through the [`Registry`] port and written under
/// `<styles.path>/<component>/`, the component directory created first. A file
/// the registry can't serve is a [`CliError::Registry`].
fn copy_styles(
    fs: &impl FileSystem,
    registry: &impl Registry,
    index: &RegistryIndex,
    resolved: &[String],
    dir: &Path,
) -> Result<(), CliError> {
    let Some(config) = config::try_resolve(fs, dir)? else {
        return Ok(());
    };
    if !config.styles.enabled {
        return Ok(());
    }
    for name in resolved {
        let component_dir = Path::new(&config.styles.path).join(name);
        for file in index.components[name].styles.formats.files(config.styles.format) {
            let bytes = registry
                .file(name, file)
                .map_err(|error| CliError::Registry(error.to_string()))?;
            fs.create_dir_all(&component_dir)?;
            fs.write(&component_dir.join(file), &bytes)?;
        }
    }
    Ok(())
}

/// Install the resolved components' headless package(s) with the project's
/// package manager (RFC 0005 §4.1 step 2). The manager is detected from the
/// lockfile in the working directory, and a single invocation installs the
/// deduplicated package set; an empty set (nothing declares a package) is a
/// no-op. A spawn failure or non-zero exit becomes a [`CliError::Install`].
fn ensure_packages(
    fs: &impl FileSystem,
    runner: &impl ProcessRunner,
    index: &RegistryIndex,
    resolved: &[String],
    dir: &Path,
) -> Result<(), CliError> {
    let packages = packages(index, resolved);
    if packages.is_empty() {
        return Ok(());
    }
    let manager = PackageManager::detect(fs, dir);
    runner
        .run(manager.program(), &manager.install_args(&packages), dir)
        .map_err(|error| {
            CliError::Install(format!(
                "failed to install {} with {}: {error}",
                packages.join(", "),
                manager.program()
            ))
        })
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

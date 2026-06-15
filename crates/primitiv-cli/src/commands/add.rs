use std::collections::BTreeSet;
use std::path::{Path, PathBuf};

use crate::config;
use crate::detect;
use crate::error::CliError;
use crate::format::Format;
use crate::lock::{self, Lock, Refresh};
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
    /// Override the stylesheet format for this copy (§4.1 step 3 / §5). When
    /// `None` the project config's `styles.format` is used; an explicit
    /// `--format` wins, mirroring `tokens` / `theme` (no persistence).
    pub format: Option<Format>,
    /// Override the styles destination for this copy (§5). When `None` the
    /// config's `styles.path` is used; an explicit `--path` wins (no persistence).
    pub path: Option<String>,
    /// Overwrite every copied file, even one a consumer has edited since `add`
    /// last wrote it (RFC 0005 §4.2). Without it, edited files are kept.
    pub force: bool,
}

/// One file the real (non-dry) copy would process — used by both the dry-run
/// refresh report (which classifies each destination without fetching bytes) and
/// the real copy (which fetches bytes and writes them through the port).
struct PlannedFile {
    /// The component name in the registry index, used to fetch bytes.
    name: String,
    /// The file name within the component's registry entry, used to fetch bytes.
    file: String,
    /// The destination path the file will be written to.
    dest: PathBuf,
}

/// The human-readable status label for a classified file (RFC 0005 §4.2).
fn status_label(refresh: &Refresh, force: bool) -> &'static str {
    match refresh {
        Refresh::New => "new",
        Refresh::Unchanged => "refresh",
        Refresh::Edited if force => "overwrite",
        Refresh::Edited => "keep",
    }
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
        format,
        path,
        force,
    } = options;
    let index = registry
        .index()
        .map_err(|error| CliError::Registry(error.to_string()))?;
    let index = RegistryIndex::parse(&index)?;
    let resolved = resolve(&index, components)?;
    // Compute the per-file classification for the dry-run report. Both the human
    // ("Refresh plan:") and JSON ("files" array) outputs consume it.
    // - `None` when not dry-running (JSON omits the "files" key entirely).
    // - `Some(vec![])` when --no-styles is set (no files to copy; JSON still
    //   includes the empty array, human section is suppressed).
    // - `Some(files)` otherwise, classifying each planned destination.
    let refresh_files: Option<Vec<(String, &'static str)>> = if *dry_run {
        if *no_styles {
            Some(vec![])
        } else {
            let dir = fs.current_dir()?;
            let files = planned_files(fs, &index, &resolved, *format, path.as_deref(), &dir)?;
            let lock_path = dir.join(lock::FILE_NAME);
            let lock = Lock::read(fs, &lock_path)?;
            let classified: Result<Vec<(String, &'static str)>, CliError> = files
                .iter()
                .map(|pf| {
                    let refresh = lock.classify(fs, &pf.dest)?;
                    let label = status_label(&refresh, *force);
                    Ok((pf.dest.to_string_lossy().into_owned(), label))
                })
                .collect();
            Some(classified?)
        }
    } else {
        None
    };
    let plan = if *json {
        render_json(&index, &resolved, refresh_files.as_deref())
    } else {
        render(&index, &resolved)
    };
    output.write_stdout(plan.as_bytes())?;
    // When dry-running in human mode, append the "Refresh plan:" section after the
    // main plan. JSON already embeds the "files" array inside the object above.
    if !*json {
        if let Some(ref files) = refresh_files {
            if !files.is_empty() {
                output.write_stdout(render_refresh_plan(files).as_bytes())?;
            }
        }
    }
    if !*dry_run {
        let dir = fs.current_dir()?;
        if !*styles_only {
            ensure_packages(fs, runner, &index, &resolved, &dir)?;
        }
        if !*no_styles {
            copy_styled_surface(
                fs,
                registry,
                &index,
                &resolved,
                &dir,
                *format,
                path.as_deref(),
                *force,
            )?;
        }
    }
    Ok(())
}

/// The components directory `add` writes the React surface into when the project
/// has no detectable import alias (RFC 0005 §3.3 fallback) — the project-root
/// `components`, making no `src`-layout assumption.
const DEFAULT_COMPONENTS_DIR: &str = "components";

/// Copy a resolved set's styled surface into the project (RFC 0005 §4.1 step 4,
/// D55). It opts in through the project config: with no `primitiv.json` (a
/// headless-only install) or `styles.enabled = false`, nothing is copied.
/// Otherwise each component's per-format stylesheet lands in the styles path and
/// its format-independent React surface (recipe + wrapper) in the components
/// directory. An explicit `format` / `path` overrides the config's
/// `styles.format` / `styles.path` for the stylesheet (RFC 0005 §4.1 step 3 /
/// §5); the React surface is format-independent and alias-placed, so neither
/// affects it. Every write goes through the [`Lock`] refresh check (§4.2): the
/// manifest beside the config is read first, each copied file is recorded, and
/// the updated lock is written back, so a re-add keeps consumer edits unless
/// `force` is set.
#[allow(clippy::too_many_arguments)]
fn copy_styled_surface(
    fs: &impl FileSystem,
    registry: &impl Registry,
    index: &RegistryIndex,
    resolved: &[String],
    dir: &Path,
    format: Option<Format>,
    path: Option<&str>,
    force: bool,
) -> Result<(), CliError> {
    let lock_path = dir.join(lock::FILE_NAME);
    let mut lock = Lock::read(fs, &lock_path)?;
    let files = planned_files(fs, index, resolved, format, path, dir)?;
    if files.is_empty() {
        return Ok(());
    }
    for pf in &files {
        copy_file(fs, registry, &mut lock, &pf.name, &pf.file, &pf.dest, force)?;
    }
    lock.write(fs, &lock_path)
}

/// Enumerate every destination file the real copy would process — the same set
/// the dry-run refresh report classifies and the real copy writes. Returns an
/// empty `Vec` when styles are disabled / no config is present (mirroring
/// `copy_styled_surface`). The React alias resolution is attempted only when at
/// least one component declares a React surface (mirroring `copy_react_surface`).
/// No registry bytes are fetched.
fn planned_files(
    fs: &impl FileSystem,
    index: &RegistryIndex,
    resolved: &[String],
    format: Option<Format>,
    path: Option<&str>,
    dir: &Path,
) -> Result<Vec<PlannedFile>, CliError> {
    let Some(config) = config::try_resolve(fs, dir)? else {
        return Ok(vec![]);
    };
    if !config.styles.enabled {
        return Ok(vec![]);
    }
    let format = format.unwrap_or(config.styles.format);
    let styles_path = path.unwrap_or(&config.styles.path);
    let mut files = Vec::new();
    // Stylesheets: <styles_path>/<component>/<file>
    for name in resolved {
        let component_dir = Path::new(styles_path).join(name);
        for file in index.components[name].styles.formats.files(format) {
            files.push(PlannedFile {
                name: name.clone(),
                file: file.to_string(),
                dest: component_dir.join(file),
            });
        }
    }
    // React surface: <components_dir>/<file> (shared directory, flat layout)
    let has_react = resolved
        .iter()
        .any(|name| !index.components[name].styles.react.is_empty());
    if has_react {
        let components_dir = detect::components_path(fs, dir)?
            .unwrap_or_else(|| DEFAULT_COMPONENTS_DIR.to_string());
        let components_dir = PathBuf::from(&components_dir);
        for name in resolved {
            for file in &index.components[name].styles.react {
                files.push(PlannedFile {
                    name: name.clone(),
                    file: file.clone(),
                    dest: components_dir.join(file),
                });
            }
        }
    }
    Ok(files)
}

/// Render the human "Refresh plan:" section for the dry-run report. Each entry
/// is `  {path:<width$}  {status}`, left-aligned to the max path width, matching
/// the aligned layout of the components table (RFC 0005 §4.2).
fn render_refresh_plan(files: &[(String, &str)]) -> String {
    let width = files.iter().map(|(p, _)| p.len()).max().unwrap_or(0);
    let mut out = "\nRefresh plan:\n".to_string();
    for (path, status) in files {
        out.push_str(&format!("  {path:<width$}  {status}\n"));
    }
    out
}

/// Fetch one registry file and write it to `dest` — but only when the
/// [`Lock`] says so (RFC 0005 §4.2): a new or untouched file is written and its
/// hash recorded; a consumer-edited file is kept unless `force`. A file the
/// registry can't serve is a [`CliError::Registry`]; a directory/write failure
/// surfaces as the port's [`CliError::Io`].
fn copy_file(
    fs: &impl FileSystem,
    registry: &impl Registry,
    lock: &mut Lock,
    name: &str,
    file: &str,
    dest: &Path,
    force: bool,
) -> Result<(), CliError> {
    let bytes = registry
        .file(name, file)
        .map_err(|error| CliError::Registry(error.to_string()))?;
    if lock.should_write(fs, dest, force)? {
        if let Some(dest_dir) = dest.parent() {
            fs.create_dir_all(dest_dir)?;
        }
        fs.write(dest, &bytes)?;
        lock.record(&dest.to_string_lossy(), &bytes);
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
/// table carries, machine-readable. Under `--dry-run`, `files` is `Some` and the
/// object includes a `"files"` array (even when empty → `[]`); a non-dry-run call
/// passes `None` and the key is omitted. Hand-rendered to exact bytes (the
/// authored-golden discipline, RFC 0007 §4); the values are registry-controlled
/// and need no escaping.
fn render_json(
    index: &RegistryIndex,
    resolved: &[String],
    files: Option<&[(String, &str)]>,
) -> String {
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
    if let Some(file_entries) = files {
        let file_items: Vec<String> = file_entries
            .iter()
            .map(|(path, status)| {
                format!("    {{ \"path\": \"{path}\", \"status\": \"{status}\" }}")
            })
            .collect();
        format!(
            "{{\n  \"components\": {},\n  \"packages\": {},\n  \"files\": {}\n}}\n",
            json_array(components),
            json_array(packages),
            json_array(file_items),
        )
    } else {
        format!(
            "{{\n  \"components\": {},\n  \"packages\": {}\n}}\n",
            json_array(components),
            json_array(packages),
        )
    }
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

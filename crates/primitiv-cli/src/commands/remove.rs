use std::path::Path;

use crate::commands::add::{DEFAULT_COMPONENTS_DIR, update_barrel, update_style_index};
use crate::config::{Surface, try_resolve_at};
use crate::detect;
use crate::error::CliError;
use crate::lock::{self, Lock, Refresh};
use crate::ports::fs::FileSystem;
use crate::ports::output::Output;
use crate::ports::registry::Registry;
use crate::registry::RegistryIndex;

/// What a `remove` run was asked for.
#[derive(Debug, Default, PartialEq)]
pub struct RemoveOptions {
    pub components: Vec<String>,
    /// Delete files the consumer edited since `add` wrote them.
    pub force: bool,
}

/// Whether `file`, a path the lock records, was copied for `name`: it sits in a
/// folder named after the component (`primitiv/tooltip/styles.css`), or is
/// named after it (`tooltip.tsx`, `tooltip.recipe.ts`). Exact, so `breadcrumb`
/// never claims `breadcrumb-overflow`'s files.
fn belongs(file: &str, name: &str) -> bool {
    let path = Path::new(file);
    let in_folder = path
        .parent()
        .is_some_and(|dir| dir.components().any(|part| part.as_os_str() == name));
    let named = path
        .file_name()
        .and_then(|file| file.to_str())
        .is_some_and(|file| file.starts_with(&format!("{name}.")));
    in_folder || named
}

/// The `primitiv remove <component...> [--force]` command: undo an `add`.
///
/// Deletes the files `add` copied for each component, takes the components out
/// of `primitiv.lock`, and regenerates the stylesheet index (elements) or the
/// components barrel (React) that listed them. It refuses — changing nothing —
/// a component that is not installed, one another installed component still
/// uses, and files the consumer has edited, unless `force`. Components installed
/// alongside as dependencies stay: something else may use them.
pub fn remove(
    fs: &impl FileSystem,
    registry: &dyn Registry,
    output: &impl Output,
    options: &RemoveOptions,
) -> Result<(), CliError> {
    let dir = fs.current_dir()?;
    let located = try_resolve_at(fs, &dir)?;
    let config = located.as_ref().map(|(_, config)| config);
    let lock_path = dir.join(lock::FILE_NAME);
    let mut lock = Lock::read(fs, &lock_path)?;
    let removing = &options.components;
    for name in removing {
        if !lock.components.contains(name) {
            return Err(CliError::NotFound(format!(
                "{name} is not installed: primitiv.lock does not list it"
            )));
        }
    }
    let index = RegistryIndex::parse(
        &registry
            .index()
            .map_err(|error| CliError::Registry(error.to_string()))?,
    )?;
    for name in removing {
        let dependent = lock.components.iter().filter(|other| !removing.contains(other)).find(|other| {
            index
                .components
                .get(*other)
                .is_some_and(|entry| entry.depends_on.components.contains(name))
        });
        if let Some(dependent) = dependent {
            return Err(CliError::Conflict(format!(
                "{name} is used by {dependent}: remove {dependent} too, or keep {name}"
            )));
        }
    }
    let files: Vec<String> = lock
        .files
        .keys()
        .filter(|file| removing.iter().any(|name| belongs(file, name)))
        .cloned()
        .collect();
    let mut edited = Vec::new();
    for file in &files {
        if lock.classify(fs, Path::new(file))? == Refresh::Edited {
            edited.push(file.as_str());
        }
    }
    if !edited.is_empty() && !options.force {
        return Err(CliError::Conflict(format!(
            "you have edited files primitiv added; pass --force to delete them anyway:\n  {}",
            edited.join("\n  ")
        )));
    }
    let mut report = format!("Removed {}:\n", removing.join(", "));
    for file in &files {
        if fs.exists(Path::new(file)) {
            fs.remove_file(Path::new(file))?;
        }
        lock.files.remove(file);
        report.push_str(&format!("  {file}  deleted\n"));
    }
    for name in removing {
        lock.components.remove(name);
    }
    let elements = config.is_none_or(|config| config.surface == Surface::Elements);
    if let Some(config) = config.filter(|config| config.styles.enabled) {
        let updated = if elements {
            update_style_index(
                fs,
                &lock,
                Path::new(&config.styles.path),
                config.styles.format.extension(),
            )?
        } else {
            let components_dir = detect::components_path(fs, &dir)?
                .unwrap_or_else(|| DEFAULT_COMPONENTS_DIR.to_string());
            match update_barrel(fs, &lock, Path::new(&components_dir))? {
                Some(barrel) => barrel,
                // `add` writes no barrel for an empty set, but this one already
                // exports what was just deleted: empty it, or imports of it break.
                None => {
                    let barrel = Path::new(&components_dir).join("index.ts");
                    fs.write(&barrel, b"")?;
                    barrel.to_string_lossy().into_owned()
                }
            }
        };
        report.push_str(&format!("  {updated}  updated\n"));
    }
    lock.write(fs, &lock_path)?;
    let pronoun = if removing.len() == 1 { "it" } else { "them" };
    report.push_str(&if elements {
        format!(
            "\nTake {pronoun} out of your pages too: {} markup, and {} <script> tag if nothing else on the page uses it.\n",
            if removing.len() == 1 { "its" } else { "their" },
            if removing.len() == 1 { "its" } else { "each" },
        )
    } else {
        format!("\nTake {pronoun} out of your imports too.\n")
    });
    output.write_stdout(report.as_bytes())?;
    Ok(())
}

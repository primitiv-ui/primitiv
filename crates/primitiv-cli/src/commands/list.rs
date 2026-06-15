use crate::error::CliError;
use crate::lock::{self, Lock};
use crate::ports::fs::FileSystem;
use crate::ports::output::Output;
use crate::ports::registry::Registry;
use crate::registry::RegistryIndex;

/// The column header for the component name, and the floor for its width.
const NAME_HEADER: &str = "COMPONENT";
/// The version column header and the floor for its width.
const VERSION_HEADER: &str = "VERSION";
/// The installed-marker column header.
const INSTALLED_HEADER: &str = "INSTALLED";

/// The `primitiv list [--json]` command (RFC 0005 §2.5): load the registry index
/// through the [`Registry`] port and write the available components, their
/// versions, and whether each is installed in this project to stdout.
///
/// `--json` streams the raw index as data for agents (RFC 0005 §6.5) and needs no
/// project context; otherwise a human-readable table is printed, its `INSTALLED`
/// column read from `primitiv.lock` beside the working directory (the manifest
/// `add` records every installed component in). A missing lock means nothing is
/// installed yet, so every cell is the `-` placeholder.
pub fn list(
    fs: &impl FileSystem,
    registry: &impl Registry,
    output: &impl Output,
    json: bool,
) -> Result<(), CliError> {
    let index = registry
        .index()
        .map_err(|error| CliError::Registry(error.to_string()))?;
    if json {
        output.write_stdout(&index)?;
        return Ok(());
    }
    let dir = fs.current_dir()?;
    let lock = Lock::read(fs, &dir.join(lock::FILE_NAME))?;
    let rendered = render(&RegistryIndex::parse(&index)?, &lock);
    output.write_stdout(rendered.as_bytes())?;
    Ok(())
}

/// Format the index as an aligned `COMPONENT  VERSION  INSTALLED` table, the
/// components in the index's (sorted) order. The name and version columns are
/// padded to the widest of their values and headers; `INSTALLED` reads `yes` for
/// a component the [`Lock`] records and `-` otherwise.
fn render(index: &RegistryIndex, lock: &Lock) -> String {
    let name_width = column_width(index.components.keys().map(String::len), NAME_HEADER);
    let version_width = column_width(
        index.components.values().map(|e| e.version.len()),
        VERSION_HEADER,
    );
    let mut table =
        format!("{NAME_HEADER:<name_width$}  {VERSION_HEADER:<version_width$}  {INSTALLED_HEADER}\n");
    for (name, entry) in &index.components {
        let installed = if lock.components.contains(name) {
            "yes"
        } else {
            "-"
        };
        table.push_str(&format!(
            "{name:<name_width$}  {version:<version_width$}  {installed}\n",
            version = entry.version,
        ));
    }
    table
}

/// The width of a column: the widest of its cell lengths and its header.
fn column_width(cells: impl Iterator<Item = usize>, header: &str) -> usize {
    cells.chain(std::iter::once(header.len())).max().unwrap()
}

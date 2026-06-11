use crate::error::CliError;
use crate::ports::output::Output;
use crate::ports::registry::Registry;
use crate::registry::RegistryIndex;

/// The column header for the component name, and the floor for its width.
const HEADER: &str = "COMPONENT";

/// The `primitiv list [--json]` command (RFC 0005 §2.5): load the registry index
/// through the [`Registry`] port and write the available components and their
/// versions to stdout.
///
/// `--json` streams the raw index as data for agents (RFC 0005 §6.5); otherwise
/// a human-readable table is printed. Config-less by design (Principle 4) — it
/// needs no `primitiv.json`. (The "installed in this project" column is a later
/// increment.)
pub fn list(
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
    let rendered = render(&RegistryIndex::parse(&index)?);
    output.write_stdout(rendered.as_bytes())?;
    Ok(())
}

/// Format the index as an aligned `COMPONENT  VERSION` table, the components in
/// the index's (sorted) order.
fn render(index: &RegistryIndex) -> String {
    let width = index
        .components
        .keys()
        .map(String::len)
        .chain(std::iter::once(HEADER.len()))
        .max()
        .unwrap();
    let mut table = format!("{HEADER:<width$}  VERSION\n");
    for (name, entry) in &index.components {
        table.push_str(&format!("{name:<width$}  {}\n", entry.version));
    }
    table
}

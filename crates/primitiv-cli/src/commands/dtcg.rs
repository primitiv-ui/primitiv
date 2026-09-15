use std::path::Path;

use primitiv_emit::emit_dtcg_ramps;

use crate::error::CliError;
use crate::ports::fs::FileSystem;
use crate::seeds::{as_pairs, resolve_seeds};

/// The `primitiv dtcg [--<family> <colour>]... --out <path>` command: generate
/// each seeded family's paired light + dark ramps and write them as a DTCG
/// document through the filesystem port.
///
/// This is the route out of the CLI and into a design tool. A consumer who seeds
/// their palette in code and later wants those ramps as Figma variables has no
/// Primitiv plugin to read a bespoke payload with, so the output is **standard
/// DTCG in hex** — what the token ecosystem's importers already consume, and what
/// Figma's variables panel shows. The engine's rendered OkLCH reproduces its own
/// hex exactly, so handing over the hex loses nothing.
///
/// `steps` is the ramp length, the same knob `theme` takes — nothing here needs the
/// Intent layer, because the document carries only the palette families and an
/// importer reads whatever labels the engine produced.
pub fn dtcg(
    fs: &impl FileSystem,
    seeds: &[(String, String)],
    out: &Path,
    steps: usize,
) -> Result<(), CliError> {
    let resolved = resolve_seeds(fs, seeds, "dtcg")?;

    fs.write(
        out,
        emit_dtcg_ramps(&as_pairs(&resolved), steps)?.as_bytes(),
    )?;
    Ok(())
}

use crate::cli::{neutral_unsupported, unknown_family, RAMP_FAMILIES};
use crate::config::try_resolve;
use crate::error::CliError;
use crate::ports::fs::FileSystem;

/// The ramp seeds a command generates from: the flags it was given, with the
/// nearest `primitiv.json`'s `theme` block filling in every family no flag named.
///
/// Flags win per family, not wholesale — so `--brand` on the command line and
/// `danger` in the config produce both ramps, and re-seeding one colour for a
/// single run does not silently drop the rest.
///
/// This is what finally makes the brand `init` records load-bearing: `theme.brand`
/// was parsed into the config type and read by no command at all, so a project
/// that answered `init`'s brand prompt still emitted Primitiv's own blue.
///
/// A missing config is fine — the flags stand alone. A *malformed* one always
/// errors, because silently ignoring a file the consumer wrote is worse than
/// stopping.
pub fn resolve_seeds(
    fs: &impl FileSystem,
    flags: &[(String, String)],
    command: &str,
) -> Result<Vec<(String, String)>, CliError> {
    let config = try_resolve(fs, &fs.current_dir()?)?;
    let configured = config.map(|config| config.theme.seeds).unwrap_or_default();

    for family in configured.keys() {
        if !RAMP_FAMILIES.contains(&family.as_str()) {
            return Err(match family.as_str() {
                "neutral" => neutral_unsupported(&format!("{FILE_LABEL}'s theme block")),
                other => unknown_family(&format!("{FILE_LABEL}'s theme block"), other),
            });
        }
    }

    let seeds: Vec<(String, String)> = RAMP_FAMILIES
        .iter()
        .filter_map(|family| {
            let flag = flags
                .iter()
                .find(|(name, _)| name == family)
                .map(|(_, seed)| seed.clone());

            flag.or_else(|| configured.get(*family).cloned())
                .map(|seed| ((*family).to_string(), seed))
        })
        .collect();

    if seeds.is_empty() {
        return Err(CliError::Usage(format!(
            "{command} needs at least one ramp seed: pass {}, or record them in \
             {FILE_LABEL}'s theme block",
            RAMP_FAMILIES
                .iter()
                .map(|family| format!("--{family} <colour>"))
                .collect::<Vec<_>>()
                .join(", ")
        )));
    }

    Ok(seeds)
}

/// How the config file is named in a message, so every mention matches the file
/// the consumer is looking at.
const FILE_LABEL: &str = "primitiv.json";

/// Convenience for the commands: the seeds as the borrowed pairs the emitter
/// takes.
pub fn as_pairs(seeds: &[(String, String)]) -> Vec<(&str, &str)> {
    seeds
        .iter()
        .map(|(family, seed)| (family.as_str(), seed.as_str()))
        .collect()
}

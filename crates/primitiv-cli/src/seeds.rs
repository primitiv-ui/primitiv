use crate::cli::{RAMP_FAMILIES, neutral_unsupported, unknown_family};
use harmoni_core::ColorInput;
use harmoni_core::api::NeutralTint;
use primitiv_emit::NeutralRamp;

use crate::config::{DEFAULT_BLACK, DEFAULT_WHITE, NeutralEntry, try_resolve};
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
            // `neutral` cannot reach here: it is a named field on `Theme`, so serde
            // lifts it out before the flattened map is built. Its own shape error
            // comes from `resolve_neutral`, which can say what to write instead.
            return Err(unknown_family(
                &format!("{FILE_LABEL}'s theme block"),
                family,
            ));
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

/// The theme block, as a message names it.
const FILE_LABEL_THEME: &str = "primitiv.json's theme block";

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

/// The project's neutral ramp, as the emitter takes it, or `None` where the
/// config declares no `neutral` block.
///
/// Absent and empty mean different things, deliberately. No block at all leaves
/// the shipped neutral ramp alone — the project is not overriding its greys. An
/// empty block (`"neutral": {}`) *is* an override, of the plugin's own default
/// anchors, which is what a project that only wants a tint writes.
///
/// A tint `source` naming a ramp family resolves to that family's seed, which is
/// its step 500. That indirection is the feature: the tint exists so the neutral
/// relates to the brand and follows it when the brand moves, and a colour copied
/// in by hand would freeze that relationship where it was written. Anything the
/// seeds do not name is passed through as a colour for the engine to parse.
pub fn resolve_neutral(
    fs: &impl FileSystem,
    seeds: &[(String, String)],
) -> Result<Option<NeutralRamp>, CliError> {
    let config = try_resolve(fs, &fs.current_dir()?)?;
    let Some(entry) = config.and_then(|config| config.theme.neutral) else {
        return Ok(None);
    };
    let neutral = match entry {
        NeutralEntry::Ramp(neutral) => neutral,
        // The CLI surfaces the neutral model now, so the answer is no longer "it
        // cannot be done" — it is the shape to write.
        NeutralEntry::Seed(_) => return Err(neutral_unsupported(FILE_LABEL_THEME)),
    };

    let anchor = |named: Option<String>, fallback: &str| {
        ColorInput::Css(named.unwrap_or_else(|| fallback.to_string()))
    };

    Ok(Some(NeutralRamp {
        white: anchor(neutral.white, DEFAULT_WHITE),
        black: anchor(neutral.black, DEFAULT_BLACK),
        tint: neutral.tint.map(|tint| NeutralTint {
            source: ColorInput::Css(tint_source(&tint.source, seeds)),
            strength: tint.strength,
            spread: tint.spread,
            bow: tint.bow,
        }),
    }))
}

/// The colour a tint source names: a ramp family's own seed, or the string
/// itself where it names no family the project seeded.
fn tint_source(source: &str, seeds: &[(String, String)]) -> String {
    seeds
        .iter()
        .find(|(family, _)| family == source)
        .map(|(_, seed)| seed.clone())
        .unwrap_or_else(|| source.to_string())
}

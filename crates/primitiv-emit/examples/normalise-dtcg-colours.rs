//! Normalises every raw colour in the DTCG source to CSS `oklch()`.
//!
//! Primitiv is OkLCH-first, so the token source is authored in OkLCH rather than
//! hex. Hex cannot carry what the engine computes: it holds a ramp's hue constant
//! (RFC 0027 step 4), and 8 bits per channel cannot represent that, so a stored
//! hex silently moved `brand/light/50` 4.6 degrees off its ramp's hue.
//!
//! Figma has no OkLCH variable type, which is **not** a reason to author hex —
//! Figma is a consumer of the palette, so the conversion happens on the way out
//! to it (its panel shows hex either way).
//!
//! Two kinds of value are deliberately left alone, both by
//! [`primitiv_emit::format_color`]'s own policy: a **`{...}` alias**, which is not
//! a colour yet, and a **fully transparent** colour, which has no hue or lightness
//! worth stating.
//!
//! Idempotent: an already-`oklch()` value passes through untouched, so this is
//! safe to re-run after anyone hand-adds a hex.
//!
//! Run:  cargo run -p primitiv-emit --example normalise-dtcg-colours

use std::path::PathBuf;

use primitiv_emit::format_color;

/// The DTCG documents carrying raw colour values. `context.json` and the rest
/// carry none, so they are not listed rather than walked for nothing.
const DOCUMENTS: &[&str] = &["palette.json", "intent.json", "elevation.json"];

/// The hex shape a colour `$value` takes: `#rrggbb` or `#rrggbbaa`. No other DTCG
/// type in this source uses a `#`-prefixed value, which is what makes a
/// line-oriented edit safe — and a line edit is what preserves key order, since
/// `serde_json`'s `preserve_order` is a workspace-wide hazard.
fn hex_value(line: &str) -> Option<&str> {
    let rest = line.trim_start().strip_prefix("\"$value\": \"#")?;
    let hex = rest.split('"').next()?;
    let digits = hex.len() == 6 || hex.len() == 8;
    (digits && hex.chars().all(|c| c.is_ascii_hexdigit())).then_some(hex)
}

fn main() {
    let root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../packages/tokens/src");
    let mut total = 0usize;
    for name in DOCUMENTS {
        let path = root.join(name);
        let source = std::fs::read_to_string(&path).expect("read document");
        let mut out = String::with_capacity(source.len());
        let mut changed = 0usize;
        for line in source.lines() {
            match hex_value(line) {
                Some(hex) => {
                    let converted = format_color(&format!("#{hex}"));
                    let replaced = line.replace(&format!("#{hex}"), &converted);
                    if replaced != line {
                        changed += 1;
                    }
                    out.push_str(&replaced);
                }
                None => out.push_str(line),
            }
            out.push('\n');
        }
        std::fs::write(&path, out).expect("write document");
        println!("{name}: {changed} colour(s) converted");
        total += changed;
    }
    println!("{total} colour(s) now authored in oklch");
}

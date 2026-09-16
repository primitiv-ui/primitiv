//! One-shot regeneration of the three `theme --brand` golden files after an
//! engine change. Writes exactly what the emitter produces, so a regenerated
//! golden can never drift from it by a transcription slip.
use std::fs;
use std::path::Path;

use primitiv_emit::{
    ThemeRamps, emit_theme_ramps_css, emit_theme_ramps_scss, emit_theme_ramps_tailwind,
};

fn main() {
    let dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/golden");
    let seeds = [("brand", "#0a7755")];
    // The goldens are the default scale, so no Intent role moves and the document
    // is never consulted.
    let ramps = ThemeRamps {
        seeds: &seeds,
        steps: 10,
        intent: &serde_json::Value::Null,
        // The goldens are the shipped scale, which has no neutral override.
        neutral: None,
    };
    fs::write(
        dir.join("theme-brand.css"),
        emit_theme_ramps_css(&ramps).unwrap(),
    )
    .unwrap();
    fs::write(
        dir.join("theme-brand.scss"),
        emit_theme_ramps_scss(&ramps).unwrap(),
    )
    .unwrap();
    fs::write(
        dir.join("theme-brand.tailwind.css"),
        emit_theme_ramps_tailwind(&ramps).unwrap(),
    )
    .unwrap();
    println!("regenerated 3 brand goldens from {}", seeds[0].1);
}

//! One-shot regeneration of the three `theme --brand` golden files after an
//! engine change. Writes exactly what the emitter produces, so a regenerated
//! golden can never drift from it by a transcription slip.
use std::fs;
use std::path::Path;

use primitiv_emit::{emit_theme_brand_css, emit_theme_brand_scss, emit_theme_brand_tailwind};

fn main() {
    let dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/golden");
    let brand = "#0a7755";
    fs::write(dir.join("theme-brand.css"), emit_theme_brand_css(brand).unwrap()).unwrap();
    fs::write(dir.join("theme-brand.scss"), emit_theme_brand_scss(brand).unwrap()).unwrap();
    fs::write(
        dir.join("theme-brand.tailwind.css"),
        emit_theme_brand_tailwind(brand).unwrap(),
    )
    .unwrap();
    println!("regenerated 3 brand goldens from {brand}");
}

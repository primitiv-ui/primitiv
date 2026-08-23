//! Print the ramp a curve preset produces, for designing the Curve view
//! against real engine output rather than a drawn approximation.
//!
//! ```sh
//! cargo run -p harmoni-core --example preset-ramp -- 0.5557 0.192 259.9 arc ease-in-out 0.5
//! ```

use harmoni_core::api::{
    generate_with_options, CurvePreset, Direction, Easing, GenerateOptions,
};
use harmoni_core::color::input::ColorInput;

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let num = |i: usize, d: f32| args.get(i).and_then(|a| a.parse().ok()).unwrap_or(d);

    let easing = match args.get(3).map(String::as_str).unwrap_or("arc") {
        "linear" => Easing::Linear,
        "quadratic" => Easing::Quadratic,
        "cubic" => Easing::Cubic,
        "quartic" => Easing::Quartic,
        "quintic" => Easing::Quintic,
        "sine" => Easing::Sine,
        "exponential" => Easing::Exponential,
        "circular" => Easing::Circular,
        _ => Easing::Arc,
    };
    let direction = match args.get(4).map(String::as_str).unwrap_or("ease-in-out") {
        "ease-in" => Direction::EaseIn,
        "ease-out" => Direction::EaseOut,
        _ => Direction::EaseInOut,
    };

    let input = ColorInput::Oklch {
        l: num(0, 0.5557),
        c: num(1, 0.192),
        h: num(2, 259.9),
    };
    let options = GenerateOptions {
        curve: Some(CurvePreset::new(easing, direction).with_accent(num(5, 0.5))),
        ..GenerateOptions::default()
    };

    let palette = generate_with_options(input, options).unwrap();
    for step in &palette.swatches {
        println!("{}\t{:.4}\t{}", step.label, step.l, step.hex);
    }
}

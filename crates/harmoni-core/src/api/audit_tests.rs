use crate::api::audit::audit_contrast;
use crate::color::input::{ColorInput, ColorInputError};

#[test]
fn audit_contrast_rates_pure_black_on_pure_white_as_aaa() {
    let bg = ColorInput::Rgb {
        r: 255,
        g: 255,
        b: 255,
    };
    let fg = ColorInput::Rgb { r: 0, g: 0, b: 0 };

    let result = audit_contrast(bg, fg).expect("valid inputs should audit");

    assert_eq!(result.rating, "AAA");
    assert_eq!(result.ratio, 21.0);
}

#[test]
fn audit_contrast_propagates_an_invalid_background_color() {
    let bg = ColorInput::Css("not-a-color".to_string());
    let fg = ColorInput::Rgb { r: 0, g: 0, b: 0 };

    let result = audit_contrast(bg, fg);

    assert_eq!(
        result,
        Err(ColorInputError::InvalidCss("not-a-color".to_string()))
    );
}

#[test]
fn audit_contrast_propagates_an_invalid_foreground_color_when_the_background_is_valid() {
    let bg = ColorInput::Rgb {
        r: 255,
        g: 255,
        b: 255,
    };
    let fg = ColorInput::Css("not-a-color".to_string());

    let result = audit_contrast(bg, fg);

    assert_eq!(
        result,
        Err(ColorInputError::InvalidCss("not-a-color".to_string()))
    );
}

mod ramp_quality_through_the_api {
    use crate::api::{assess_ramp, generate_brand_pair, Gamut};
    use crate::color::input::ColorInput;

    #[test]
    fn assesses_a_generated_brand_ramp_without_reaching_below_the_api() {
        let pair = generate_brand_pair(ColorInput::Css("#236ce1".to_string()))
            .expect("the brand seed should generate");

        let quality = assess_ramp(&pair.light, Gamut::Srgb);

        assert_eq!(quality.steps.len(), pair.light.swatches.len());
        assert!(quality.foreground_coverage.is_complete());
    }
}

mod readable_step_through_the_api {
    use crate::api::{generate_brand_pair, readable_step};
    use crate::color::input::ColorInput;
    use crate::palette::generator::SwatchStep;

    /// The dark theme's page background, `#141414`.
    fn dark_surface() -> SwatchStep {
        let ok = ColorInput::Css("#141414".to_string())
            .to_oklch()
            .expect("a valid surface colour");
        SwatchStep::from_label(ok.l, ok.chroma, ok.hue.into_degrees(), "Surface")
    }

    #[test]
    fn recommends_the_step_the_semantic_tier_had_to_hand_pick() {
        // `dark.action.link.foreground.default` was left aliasing `brand.500`,
        // which measures 3.78:1 on this surface — a silent AA failure found by a
        // design audit months later. It was fixed by hand to `brand.600`.
        // The engine now derives the same answer, which is what makes the whole
        // class of failure structural rather than a list of three fixes
        // (RFC 0027 §7, docs/interface-audit.md).
        let pair = generate_brand_pair(ColorInput::Css("#236ce1".to_string()))
            .expect("the brand seed should generate");

        let found = readable_step(&pair.dark.steps(), &dark_surface(), 4.5).expect("a readable link colour");

        assert_eq!(found.label.to_string(), "600");
        assert!(
            found.contrast_ratio >= 4.5,
            "expected AA, got {:.2}:1",
            found.contrast_ratio,
        );
    }
}

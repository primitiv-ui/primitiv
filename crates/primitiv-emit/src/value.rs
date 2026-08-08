/// Token-path categories (the first path segment) whose numeric values are
/// CSS lengths, emitted in `rem` against a 16px base.
const LENGTH_CATEGORIES: &[&str] = &[
    "space",
    "size",
    "radii",
    "font-size",
    "line-height",
    "border-width",
    "letter-spacing",
    "breakpoint",
    // `tree` is a component namespace, not a primitive scale — the one entry
    // here that is. Component families normally alias the primitive scales, so
    // their numbers never reach this function; Tree's two connector stub widths
    // (`tree.{size}.connector.stub-width` / `-leaf`) are deliberately literal
    // because they are derived from chevron-glyph geometry and land off every
    // rung of the ladder (13, 18, 23, 34…). Without this they would emit
    // unitless and be invalid as a width — the trap `avatar-group` documents.
    "tree",
];

/// Format a raw DTCG `number` value as a CSS string, choosing the unit from the
/// token's category (its first path segment) — the policy decided for the
/// emitter rather than carried in the source, since DTCG types every number as
/// `"number"` (RFC 0006 §4):
///
/// - length categories (`space`, `size`, `radii`, `font-size`, `line-height`,
///   `border-width`, `letter-spacing`) → `rem` at a 16px base (`8` → `0.5rem`);
/// - `duration` → CSS time in `ms` (`150` → `150ms`);
/// - `opacity` → a unitless `0–1` ratio (`80` → `0.8`);
/// - everything else (e.g. `font-weight`) → the unitless number (`400`).
pub fn format_number(category: &str, value: f64) -> String {
    if LENGTH_CATEGORIES.contains(&category) {
        format!("{}rem", trim(value / 16.0))
    } else if category == "duration" {
        format!("{}ms", trim(value))
    } else if category == "opacity" {
        trim(value / 100.0)
    } else {
        trim(value)
    }
}

/// One layer of a DTCG `shadow` composite (RFC 0006 §4, RFC 0017 §4) — the five
/// box-shadow components, each pre-formatted as a CSS string (a `var()` alias or
/// a literal). Assembled by the DTCG flattener; rendered by [`format_shadow`].
pub struct ShadowLayer {
    pub offset_x: String,
    pub offset_y: String,
    pub blur: String,
    pub spread: String,
    pub color: String,
}

/// Render a DTCG `shadow` composite's layers as a CSS `box-shadow` value — each
/// layer in CSS order (`offset-x offset-y blur spread color`), layers joined with
/// `, `. An **empty** layer list renders the `none` keyword, the declarative
/// no-elevation rung (`elevation-flat`, RFC 0017 §4 D5).
pub fn format_shadow(layers: &[ShadowLayer]) -> String {
    if layers.is_empty() {
        return "none".to_string();
    }
    layers
        .iter()
        .map(|layer| {
            format!(
                "{} {} {} {} {}",
                layer.offset_x, layer.offset_y, layer.blur, layer.spread, layer.color
            )
        })
        .collect::<Vec<_>>()
        .join(", ")
}

/// Format a DTCG `cubicBezier` value — four control points `[x1, y1, x2, y2]`
/// (RFC 0006 §4) — as a CSS `cubic-bezier()` timing function, each point
/// `trim`med so `1.0` → `1`.
pub fn format_cubic_bezier(points: &[f64]) -> String {
    let rendered: Vec<String> = points.iter().map(|point| trim(*point)).collect();
    format!("cubic-bezier({})", rendered.join(", "))
}

/// Render a number with at most four decimal places, dropping trailing zeros
/// (and a bare trailing dot) so `1.0` → `1` and `0.5000` → `0.5`. Four places
/// is exact for any integer ÷ 16 and rounds away Figma's float noise.
fn trim(value: f64) -> String {
    let rendered = format!("{value:.4}");
    rendered
        .trim_end_matches('0')
        .trim_end_matches('.')
        .to_string()
}

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

/// Format a DTCG `cubicBezier` value — four control points `[x1, y1, x2, y2]`
/// (RFC 0006 §4) — as a CSS `cubic-bezier()` timing function, each point
/// `trim`med so `1.0` → `1`. The single point of composite-value emit the
/// shadow tokens will reuse.
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

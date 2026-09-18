/// A project name reduced to a filename-safe stem.
///
/// The theme file a project emits is named after the project (`<slug>.theme.css`),
/// so this has to agree **byte-for-byte** with the Harmoni plugin's own
/// `projectSlug`: a file the plugin exports and a file this CLI writes or imports
/// must land on the same name, or the auto-`@import` misses it. The rule is kept
/// deliberately ASCII-simple for exactly that reason — Unicode casing and
/// normalisation are where a Rust and a TypeScript implementation would drift:
///
/// - lowercased,
/// - every run of characters outside `[a-z0-9]` collapses to a single `-`,
/// - leading and trailing `-` trimmed.
///
/// The result may be empty (a name with nothing sluggable in it); the caller
/// supplies its own fallback — [`theme_stem`](crate::commands::theme::theme_stem)
/// uses `primitiv`, where the plugin's is `harmoni`. The two only need to agree
/// when a real name is present, and there this produces the same slug the plugin
/// does.
pub fn slug(name: &str) -> String {
    let mut out = String::new();
    let mut pending_hyphen = false;
    for ch in name.chars() {
        if ch.is_ascii_alphanumeric() {
            // A separator only becomes a hyphen *between* kept characters, which
            // is what trims the leading run: an empty `out` swallows it.
            if pending_hyphen && !out.is_empty() {
                out.push('-');
            }
            pending_hyphen = false;
            out.push(ch.to_ascii_lowercase());
        } else {
            pending_hyphen = true;
        }
    }
    out
}

/// A single resolved theme token: a dotted path plus the CSS value it carries.
///
/// The path becomes the custom-property name (`["color", "primary"]` →
/// `--primitiv-color-primary`); the value is emitted verbatim. DTCG parsing
/// and alias/value resolution feed this model in later cycles (RFC 0006 §4).
#[derive(Debug, Clone, PartialEq)]
pub struct Token {
    pub path: Vec<String>,
    pub value: String,
}

impl Token {
    pub fn new(path: &[&str], value: &str) -> Self {
        Self {
            path: path.iter().map(|segment| segment.to_string()).collect(),
            value: value.to_string(),
        }
    }
}

//! `contract → example markup` generator (RFC 0033 §8.1): plain HTML carrying
//! the contract's classes, which `primitiv add --surface elements` prints for
//! the developer to paste. Nothing imports markup, so unlike the React wrapper
//! it is never copied into a project. It pastes into any template language: a
//! plain page, a server-rendered template, or a Vue, Angular or Svelte component.

use crate::contract::Contract;

/// Generate a component's example markup from its contract: the root element
/// with its identity class and every modifier group's default class, in
/// authored order — the classes the styled wrapper applies when no prop is set.
///
/// `None` for a compound (decorative parts or structural subcomponents): the
/// contract records each part's classes but not which part nests in which, or
/// which repeats per value, so a compound's example is hand-written and the
/// registry's drift guard holds it to the contract's classes instead.
pub fn emit_snippet(contract: &Contract) -> Option<String> {
    if !contract.parts.is_empty() || !contract.subcomponents.is_empty() {
        return None;
    }
    let mut classes = vec![contract.root.class.as_str()];
    classes.extend(contract.modifiers.iter().flat_map(|group| {
        group
            .options
            .iter()
            .filter(move |option| option.name == group.default)
            .map(|option| option.class.as_str())
    }));
    let element = &contract.root.element;
    // A `<button>` outside a form still defaults to `type="submit"`, so the
    // snippet says what it means.
    let kind = if element == "button" {
        " type=\"button\""
    } else {
        ""
    };
    let open = format!("<{element}{kind} class=\"{}\">", classes.join(" "));
    let text = sample_text(&contract.name);
    // The styled wrapper puts text children in a label span (so `text-box-trim`
    // sits on the text, not the flex box); the example writes the same span,
    // on its own indented line so the nesting reads.
    Some(if contract.wrap_text_children {
        format!(
            "{open}\n  <span class=\"{}__label\">{text}</span>\n</{element}>\n",
            contract.root.class
        )
    } else {
        format!("{open}{text}</{element}>\n")
    })
}

/// Placeholder content: the component name in sentence case (`demo-box` →
/// `Demo box`), so the pasted markup shows something to replace.
fn sample_text(name: &str) -> String {
    let words = name.replace('-', " ");
    let mut chars = words.chars();
    let first = chars.next().expect("component name is non-empty");
    first.to_uppercase().collect::<String>() + chars.as_str()
}

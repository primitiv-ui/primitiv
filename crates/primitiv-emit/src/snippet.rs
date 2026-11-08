//! `contract → markup snippet` generator (RFC 0033 §8.1) — the elements
//! surface's counterpart of the styled wrapper: plain HTML carrying the
//! contract's classes, copied into a project as an editable file. It pastes
//! into any template language, so it is the same file for a plain page, a
//! server-rendered template and a Vue, Angular or Svelte component.

use crate::contract::{Contract, pascal_case};

/// Generate a component's markup snippet from its contract: the root element
/// with its identity class and every modifier group's default class, in
/// authored order — the classes the styled wrapper applies when no prop is set.
pub fn emit_snippet(contract: &Contract) -> String {
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
    let text = sample_text(&contract.name);
    // The styled wrapper puts text children in a label span (so `text-box-trim`
    // sits on the text, not the flex box); the snippet writes the same span.
    let content = if contract.wrap_text_children {
        format!(
            "<span class=\"{}__label\">{text}</span>",
            contract.root.class
        )
    } else {
        text
    };
    let mut out = header(&contract.name);
    out.push_str(&format!(
        "<{element}{kind} class=\"{}\">{content}</{element}>\n",
        classes.join(" ")
    ));
    out
}

/// The comment every snippet opens with: what generated it and who owns it.
fn header(name: &str) -> String {
    format!(
        "<!--\n  {} — markup snippet, generated from contract.json.\n\n  \
         Yours to edit once `primitiv add --surface elements` copies it into your\n  \
         project: re-running `add` keeps your changes unless you pass --force. (In the\n  \
         Primitiv repo, edit registry/components/{name}/contract.json and regenerate\n  \
         instead.) Plain HTML with the default classes applied, so it pastes into any\n  \
         template language.\n-->\n",
        pascal_case(name)
    )
}

/// Placeholder content: the component name in sentence case (`demo-box` →
/// `Demo box`), so the pasted markup shows something to replace.
fn sample_text(name: &str) -> String {
    let words = name.replace('-', " ");
    let mut chars = words.chars();
    let first = chars.next().expect("component name is non-empty");
    first.to_uppercase().collect::<String>() + chars.as_str()
}

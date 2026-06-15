use std::path::Path;

use pretty_assertions::assert_eq;

use crate::ports::prompt::{parse_confirm, parse_decision, Decision, InMemoryPrompt, OsPrompt, Prompt};

#[test]
fn parses_o_as_overwrite() {
    assert_eq!(parse_decision("o"), Decision::Overwrite);
}

#[test]
fn parses_the_full_overwrite_word() {
    assert_eq!(parse_decision("overwrite"), Decision::Overwrite);
}

#[test]
fn ignores_case_and_surrounding_whitespace() {
    assert_eq!(parse_decision("  Overwrite\n"), Decision::Overwrite);
}

#[test]
fn parses_k_as_keep() {
    assert_eq!(parse_decision("k"), Decision::Keep);
}

#[test]
fn an_empty_answer_keeps_the_edits() {
    assert_eq!(parse_decision(""), Decision::Keep);
}

#[test]
fn unrecognised_input_keeps_the_edits() {
    assert_eq!(parse_decision("maybe"), Decision::Keep);
}

#[test]
fn os_prompt_keeps_on_end_of_input() {
    // Under `cargo test` stdin is not a terminal and reads end-of-input, so the
    // real adapter resolves to the safe-default Keep — exercising every line of
    // `decide` without a live terminal.
    assert_eq!(
        OsPrompt.decide(Path::new("button.tsx")).unwrap(),
        Decision::Keep
    );
}

#[test]
fn in_memory_prompt_returns_its_scripted_decision_and_records_the_ask() {
    let prompt = InMemoryPrompt::new(Decision::Overwrite);

    assert_eq!(
        prompt.decide(Path::new("button.tsx")).unwrap(),
        Decision::Overwrite
    );
    assert_eq!(prompt.asked(), vec![Path::new("button.tsx").to_path_buf()]);
}

#[test]
fn in_memory_prompt_can_be_made_to_fail() {
    let prompt = InMemoryPrompt::new(Decision::Keep);
    prompt.fail();

    assert!(prompt.decide(Path::new("button.tsx")).is_err());
    // A failed ask records nothing.
    assert!(prompt.asked().is_empty());
}

// --- parse_confirm ---

#[test]
fn parses_y_as_confirm_yes() {
    assert!(parse_confirm("y"));
}

#[test]
fn parses_yes_as_confirm_yes() {
    assert!(parse_confirm("yes"));
}

#[test]
fn confirm_ignores_case_and_whitespace() {
    assert!(parse_confirm("  YES\n"));
}

#[test]
fn empty_confirm_answer_defaults_to_yes() {
    assert!(parse_confirm(""));
}

#[test]
fn parses_n_as_confirm_no() {
    assert!(!parse_confirm("n"));
}

#[test]
fn parses_no_as_confirm_no() {
    assert!(!parse_confirm("no"));
}

#[test]
fn unrecognised_confirm_input_defaults_to_yes() {
    assert!(parse_confirm("maybe"));
}

// --- OsPrompt::confirm ---

#[test]
fn os_prompt_confirms_on_end_of_input() {
    // stdin is end-of-input under `cargo test` → empty → default [Y/n] = yes
    assert!(OsPrompt.confirm("Apply wiring?").unwrap());
}

// --- InMemoryPrompt::confirm ---

#[test]
fn in_memory_prompt_confirms_yes_by_default() {
    let prompt = InMemoryPrompt::new(Decision::Keep);
    assert!(prompt.confirm("Apply wiring?").unwrap());
    assert_eq!(prompt.confirmed(), vec!["Apply wiring?"]);
}

#[test]
fn in_memory_prompt_can_deny_confirm() {
    let prompt = InMemoryPrompt::new(Decision::Keep);
    prompt.deny_confirm();
    assert!(!prompt.confirm("Apply wiring?").unwrap());
}

#[test]
fn in_memory_prompt_confirm_fail_returns_error() {
    let prompt = InMemoryPrompt::new(Decision::Keep);
    prompt.fail();
    assert!(prompt.confirm("Apply wiring?").is_err());
    assert!(prompt.confirmed().is_empty());
}

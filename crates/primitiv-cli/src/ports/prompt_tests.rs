use std::path::Path;

use pretty_assertions::assert_eq;

use crate::ports::prompt::{parse_decision, Decision, InMemoryPrompt, OsPrompt, Prompt};

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

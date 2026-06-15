use std::path::Path;

use pretty_assertions::assert_eq;

use crate::ports::prompt::{
    parse_confirm, parse_decision, resolve_answer, Decision, InMemoryPrompt, OsPrompt, Prompt,
};

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

// --- resolve_answer ---

#[test]
fn resolve_answer_returns_the_trimmed_input() {
    assert_eq!(resolve_answer("  #ff0000\n", "#0a7755"), "#ff0000");
}

#[test]
fn empty_answer_resolves_to_the_default() {
    assert_eq!(resolve_answer("", "#0a7755"), "#0a7755");
}

#[test]
fn whitespace_only_answer_resolves_to_the_default() {
    assert_eq!(resolve_answer("   \n", "#0a7755"), "#0a7755");
}

// --- OsPrompt::ask ---

#[test]
fn os_prompt_asks_and_returns_the_default_on_end_of_input() {
    // stdin is end-of-input under `cargo test` → empty → the supplied default.
    assert_eq!(OsPrompt.ask("Brand colour?", "#0a7755").unwrap(), "#0a7755");
}

// --- InMemoryPrompt::ask ---

#[test]
fn in_memory_prompt_returns_a_scripted_answer_and_records_the_question() {
    let prompt = InMemoryPrompt::new(Decision::Keep);
    prompt.queue_answers(&["#ff0000"]);

    assert_eq!(prompt.ask("Brand colour?", "#0a7755").unwrap(), "#ff0000");
    assert_eq!(prompt.questions(), vec!["Brand colour?"]);
}

#[test]
fn in_memory_prompt_answers_with_the_default_when_nothing_is_scripted() {
    let prompt = InMemoryPrompt::new(Decision::Keep);

    assert_eq!(prompt.ask("Brand colour?", "#0a7755").unwrap(), "#0a7755");
}

#[test]
fn in_memory_prompt_scripted_answers_are_consumed_in_order() {
    let prompt = InMemoryPrompt::new(Decision::Keep);
    prompt.queue_answers(&["scss", "app/styles"]);

    assert_eq!(prompt.ask("Format?", "css").unwrap(), "scss");
    assert_eq!(prompt.ask("Path?", "src/styles/primitiv").unwrap(), "app/styles");
}

#[test]
fn in_memory_prompt_ask_fail_returns_error() {
    let prompt = InMemoryPrompt::new(Decision::Keep);
    prompt.fail();
    assert!(prompt.ask("Brand colour?", "#0a7755").is_err());
    assert!(prompt.questions().is_empty());
}

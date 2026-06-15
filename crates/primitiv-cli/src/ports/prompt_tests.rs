use pretty_assertions::assert_eq;

use crate::ports::prompt::{parse_decision, Decision};

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

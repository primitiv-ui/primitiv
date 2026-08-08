use crate::js::emit_breakpoints_ts;
use crate::token::Token;

#[test]
fn emits_a_ts_const_object_of_breakpoint_values() {
    let ts = emit_breakpoints_ts(&[
        Token::new(&["breakpoint", "xs"], "22.5rem"),
        Token::new(&["breakpoint", "sm"], "40rem"),
        Token::new(&["breakpoint", "md"], "48rem"),
        Token::new(&["breakpoint", "lg"], "64rem"),
        Token::new(&["breakpoint", "xl"], "80rem"),
        Token::new(&["breakpoint", "2xl"], "96rem"),
    ]);

    assert_eq!(
        ts,
        include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/tests/golden/breakpoints.ts"))
    );
}

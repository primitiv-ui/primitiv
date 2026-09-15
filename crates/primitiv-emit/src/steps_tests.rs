use crate::steps::nearest_label;

#[test]
fn picks_the_closest_label_the_ramp_actually_has() {
    // A seven-step ramp labels 50, 100, 300, 500, 630, 770, 900. A role written
    // against 600 has no such step, and 630 is the one beside it.
    let seven = [50, 100, 300, 500, 630, 770, 900];

    assert_eq!(nearest_label(600, &seven), 630);
    assert_eq!(nearest_label(500, &seven), 500);
    assert_eq!(nearest_label(900, &seven), 900);
}

#[test]
fn breaks_a_tie_towards_the_higher_label() {
    // 200 sits exactly between 100 and 300 on a seven-step ramp. The higher step
    // is darker in the light ramp and lighter in the dark one, so it reads more
    // strongly against its own mode's surface either way.
    assert_eq!(nearest_label(200, &[50, 100, 300, 500, 630, 770, 900]), 300);
}

#[test]
fn keeps_the_wanted_label_when_the_ramp_offers_nothing() {
    // No ramp is empty, but leaving the alias as written is the only answer that
    // cannot invent a step, so it is the one this gives.
    assert_eq!(nearest_label(600, &[]), 600);
}

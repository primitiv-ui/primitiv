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

mod realias {
    use pretty_assertions::assert_eq;
    use serde_json::json;

    use crate::steps::realias;
    use crate::token::Token;

    #[test]
    fn re_points_only_the_roles_whose_step_the_ramp_no_longer_has() {
        let intent = json!({
            "action": {
                // Group-level metadata, which the shipped documents carry and the
                // walk must step over rather than read as a role.
                "$description": "interactive colour",
                "primary": {
                    "default": { "$type": "color", "$value": "{color.brand.500}" },
                    "hover":   { "$type": "color", "$value": "{color.brand.600}" }
                }
            }
        });

        let tokens = realias(&intent, &["brand"], &[50, 100, 300, 500, 630, 770, 900]);

        // 500 survives every length, so `default` is left alone; 600 does not exist
        // on a seven-step ramp, so `hover` moves to the step beside it.
        assert_eq!(
            tokens,
            vec![Token::new(
                &["action", "primary", "hover"],
                "{color.brand.630}"
            )]
        );
    }

    #[test]
    fn leaves_a_family_that_is_not_being_regenerated_alone() {
        let intent = json!({
            "feedback": { "info": { "soft": {
                "$type": "color", "$value": "{color.info.600}"
            }}}
        });

        // Only `brand` is re-seeded, so `info` keeps the shipped ten-step ramp and
        // its 600 still resolves. Re-pointing it would break a role that works.
        assert_eq!(realias(&intent, &["brand"], &[50, 500, 900]), Vec::new());
    }

    #[test]
    fn ignores_a_value_that_is_not_a_palette_step_alias() {
        let intent = json!({
            "scrim": { "$type": "color", "$value": "oklch(0 0 0 / 0.502)" },
            "surface": { "floating": {
                "$type": "color", "$value": "{color.absolute-white}"
            }}
        });

        // A literal colour names no step, and a family-level alias has no step to
        // move — neither is a role this can re-point.
        assert_eq!(realias(&intent, &["brand"], &[50, 500, 900]), Vec::new());
    }

    #[test]
    fn ignores_anything_it_cannot_read_as_a_step_alias() {
        let intent = json!({
            "unparseable": { "$type": "color", "$value": "{color.brand.sixhundred}" },
            "unclosed": { "$type": "color", "$value": "{color.brand.600" },
            "not-a-group": 42
        });

        // The source is a document a consumer can hand-edit, so a malformed alias
        // is skipped rather than guessed at — re-pointing something this cannot
        // read would be inventing a role.
        assert_eq!(realias(&intent, &["brand"], &[50, 500, 900]), Vec::new());
    }
}

//! `contract → cva recipe` generator (RFC 0006 §6.1 / D53). The recipe is the
//! styled surface's class engine for every format — it maps the variant props to
//! the contract's modifier classes; the styling lives in the copied stylesheet.

use crate::contract::{
    pascal_case, recipe_binding, subcomponent_binding, subcomponent_pascal, Contract, ModifierGroup,
};

/// Generate a component's `cva` recipe(s) from its contract. A single-element or
/// decorative-slot component emits one root recipe — a `cva` over the modifier
/// classes, or a base-only `cva(rootClass)` when it has none (the Switch proof).
/// A **structural** compound additionally emits one recipe per subcomponent, each
/// keyed by that part's own modifiers (the list's `justify`), so every styled
/// part has its own class engine the consumer composes (D56).
pub fn emit_recipe(contract: &Contract) -> String {
    let pascal = pascal_case(&contract.name);

    let mut out = header(&contract.name, &pascal);
    out.push_str("import { cva, type VariantProps } from \"class-variance-authority\";\n\n");

    emit_part(
        &mut out,
        &recipe_binding(&contract.name),
        &pascal,
        &contract.root.class,
        &contract.modifiers,
    );

    for sub in &contract.subcomponents {
        out.push('\n');
        emit_part(
            &mut out,
            &subcomponent_binding(&contract.name, &sub.name),
            &subcomponent_pascal(&contract.name, &sub.name),
            &sub.class,
            &sub.modifiers,
        );
    }
    out
}

/// Emit one part's `cva` const followed by its `VariantProps` type alias. With no
/// modifiers the const is a base-only `cva("class")`; otherwise it carries the
/// `variants` map and `defaultVariants` derived from the modifier groups.
fn emit_part(
    out: &mut String,
    binding: &str,
    pascal: &str,
    class: &str,
    modifiers: &[ModifierGroup],
) {
    if modifiers.is_empty() {
        out.push_str(&format!("export const {binding} = cva(\"{class}\");\n\n"));
    } else {
        out.push_str(&format!("export const {binding} = cva(\"{class}\", {{\n"));

        out.push_str("  variants: {\n");
        for group in modifiers {
            out.push_str(&format!("    {}: {{\n", group.prop()));
            for option in &group.options {
                out.push_str(&format!("      {}: \"{}\",\n", option.name, option.class));
            }
            out.push_str("    },\n");
        }
        out.push_str("  },\n");

        out.push_str("  defaultVariants: {\n");
        for group in modifiers {
            out.push_str(&format!("    {}: \"{}\",\n", group.prop(), group.default));
        }
        out.push_str("  },\n");

        out.push_str("});\n\n");
    }

    out.push_str(&format!(
        "export type {pascal}Variants = VariantProps<typeof {binding}>;\n"
    ));
}

/// The generated-file banner: names the component, points at the contract as the
/// source of truth, and states the recipe's role.
fn header(name: &str, pascal: &str) -> String {
    format!(
        "/*\n \
         * {pascal} styled-surface recipe — generated from contract.json.\n \
         *\n \
         * Do not edit by hand: change registry/components/{name}/contract.json and regenerate.\n \
         * Maps the variant props to the contract's modifier classes; the styling lives\n \
         * in the copied stylesheet (RFC 0006 §6.1 / D53).\n \
         */\n"
    )
}

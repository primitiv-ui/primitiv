//! `contract → cva recipe` generator (RFC 0006 §6.1 / D53). The recipe is the
//! styled surface's class engine for every format — it maps the variant props to
//! the contract's modifier classes; the styling lives in the copied stylesheet.

use crate::contract::{camel_case, pascal_case, Contract};

/// Generate a component's `cva` recipe from its contract. Variant axes are keyed
/// by the consumer-facing prop name (D52); each option maps to its modifier
/// class; `defaultVariants` carries each group's default.
pub fn emit_recipe(contract: &Contract) -> String {
    let camel = camel_case(&contract.name);
    let pascal = pascal_case(&contract.name);

    let mut out = header(&contract.name, &pascal);
    out.push_str("import { cva, type VariantProps } from \"class-variance-authority\";\n\n");
    out.push_str(&format!("export const {camel} = cva(\"{}\", {{\n", contract.root.class));

    out.push_str("  variants: {\n");
    for group in &contract.modifiers {
        out.push_str(&format!("    {}: {{\n", group.prop()));
        for option in &group.options {
            out.push_str(&format!("      {}: \"{}\",\n", option.name, option.class));
        }
        out.push_str("    },\n");
    }
    out.push_str("  },\n");

    out.push_str("  defaultVariants: {\n");
    for group in &contract.modifiers {
        out.push_str(&format!("    {}: \"{}\",\n", group.prop(), group.default));
    }
    out.push_str("  },\n");

    out.push_str("});\n\n");
    out.push_str(&format!(
        "export type {pascal}Variants = VariantProps<typeof {camel}>;\n"
    ));
    out
}

/// The generated-file banner: names the component, points at the contract as the
/// source of truth, and states the recipe's role.
fn header(name: &str, pascal: &str) -> String {
    format!(
        "/*\n \
         * {pascal} styled-surface recipe — generated from contract.json.\n \
         *\n \
         * Do not edit by hand: change registry/r/{name}/contract.json and regenerate.\n \
         * Maps the variant props to the contract's modifier classes; the styling lives\n \
         * in the copied stylesheet (RFC 0006 §6.1 / D53).\n \
         */\n"
    )
}

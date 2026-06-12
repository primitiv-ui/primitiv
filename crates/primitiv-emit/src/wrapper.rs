//! `contract → styled wrapper` generator (RFC 0004 §3.5 / D51, D53). The wrapper
//! is the primary DX: a typed `<Button variant size>` props surface over the
//! headless `@primitiv-ui/react` component + the generated recipe. Variant-prop
//! JSDoc is generated from the contract; the headless props' JSDoc flows through
//! the `extends` for free.

use crate::contract::{pascal_case, recipe_binding, Contract};

/// Generate a component's styled wrapper from its contract.
pub fn emit_wrapper(contract: &Contract) -> String {
    let binding = recipe_binding(&contract.name);
    let pascal = pascal_case(&contract.name);

    let mut out = header(&contract.name, &pascal);
    out.push_str(&format!(
        "import {{ {pascal} as {pascal}Primitive, type {pascal}Props as {pascal}PrimitiveProps }} from \"@primitiv-ui/react\";\n"
    ));
    out.push_str(&format!("import {{ {binding} }} from \"./{}.recipe\";\n\n", contract.name));

    // Component-level JSDoc.
    out.push_str("/**\n");
    out.push_str(&format!(" * {}\n", contract.description));
    if let Some(url) = &contract.docs {
        out.push_str(" *\n");
        out.push_str(&format!(" * @see {url}\n"));
    }
    out.push_str(" */\n");

    // Props: a plain alias when no modifier adds props (Switch — which also
    // sidesteps the primitive's union props type that `interface extends` can't
    // widen); an `interface extends` carrying the variant-prop fields otherwise.
    if contract.modifiers.is_empty() {
        out.push_str(&format!(
            "export type {pascal}Props = {pascal}PrimitiveProps;\n\n"
        ));
    } else {
        out.push_str(&format!(
            "export interface {pascal}Props extends {pascal}PrimitiveProps {{\n"
        ));
        for group in &contract.modifiers {
            out.push_str("  /**\n");
            out.push_str(&format!("   * {}\n", group.description));
            for option in &group.options {
                out.push_str(&format!("   * - `{}` — {}\n", option.name, option.description));
            }
            out.push_str(&format!("   * @default \"{}\"\n", group.default));
            if let Some(url) = &contract.docs {
                out.push_str(&format!("   * @see {url}\n"));
            }
            out.push_str("   */\n");
            let union = group
                .options
                .iter()
                .map(|option| format!("\"{}\"", option.name))
                .collect::<Vec<_>>()
                .join(" | ");
            out.push_str(&format!("  {}?: {union};\n", group.prop()));
        }
        out.push_str("}\n\n");
    }

    let props = contract
        .modifiers
        .iter()
        .map(|group| group.prop())
        .collect::<Vec<_>>()
        .join(", ");
    let (destructure, recipe_call) = if props.is_empty() {
        ("className, ...props".to_string(), format!("{binding}()"))
    } else {
        (
            format!("{props}, className, ...props"),
            format!("{binding}({{ {props} }})"),
        )
    };
    out.push_str(&format!(
        "export function {pascal}({{ {destructure} }}: {pascal}Props) {{\n"
    ));

    let class_expr = format!("[{recipe_call}, className].filter(Boolean).join(\" \")");
    if contract.parts.is_empty() {
        out.push_str(&format!(
            "  return <{pascal}Primitive className={{{class_expr}}} {{...props}} />;\n"
        ));
    } else {
        // A compound with decorative slots: render the Root and fill each slot
        // with its part class so the consumer writes a single self-closing tag.
        out.push_str(&format!(
            "  return (\n    <{pascal}Primitive.Root className={{{class_expr}}} {{...props}}>\n"
        ));
        for part in &contract.parts {
            out.push_str(&format!(
                "      <{pascal}Primitive.{} className=\"{}\" />\n",
                pascal_case(&part.name),
                part.class
            ));
        }
        out.push_str(&format!("    </{pascal}Primitive.Root>\n  );\n"));
    }
    out.push_str("}\n");
    out
}

/// The generated-file banner: names the component, points at the contract, and
/// states the wrapper's role.
fn header(name: &str, pascal: &str) -> String {
    format!(
        "/*\n \
         * {pascal} — styled wrapper, generated from contract.json.\n \
         *\n \
         * Do not edit by hand: change registry/r/{name}/contract.json and regenerate.\n \
         * A typed props surface over the headless @primitiv-ui/react component + the\n \
         * generated recipe — the primary DX (RFC 0004 §3.5 / D51).\n \
         */\n"
    )
}

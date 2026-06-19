//! `contract → styled wrapper` generator (RFC 0004 §3.5 / D51, D53). The wrapper
//! is the primary DX: a typed `<Button variant size>` props surface over the
//! headless `@primitiv-ui/react` component + the generated recipe. Variant-prop
//! JSDoc is generated from the contract; the headless props' JSDoc flows through
//! `ComponentPropsWithRef` for free. The styled props are the headless props
//! plus the variant props — same API, same `ref`, plus the conveniences (D59).

use crate::contract::{
    pascal_case, recipe_binding, subcomponent_binding, subcomponent_pascal, Contract, ModifierGroup,
};

/// Generate a component's styled wrapper from its contract. Three shapes:
/// a single-element component (Button), a decorative-slot compound whose wrapper
/// auto-renders the subtree (Switch), and a **structural** compound (Tabs) — N
/// thin per-part wrappers the consumer composes themselves (D56).
pub fn emit_wrapper(contract: &Contract) -> String {
    if !contract.subcomponents.is_empty() {
        return emit_structural_wrapper(contract);
    }

    let binding = recipe_binding(&contract.name);
    let pascal = pascal_case(&contract.name);

    let mut out = header(&contract.name, &pascal);
    out.push_str(&format!(
        "import {{ {pascal} as {pascal}Primitive }} from \"@primitiv-ui/react\";\n"
    ));
    out.push_str("import { type ComponentPropsWithRef } from \"react\";\n");
    out.push_str(&format!("import {{ {binding} }} from \"./{}.recipe\";\n\n", contract.name));

    // The element the wrapper renders — and the source of its props (incl. ref).
    // A decorative-slot compound (Switch) renders `.Root`; a single element
    // (Button) renders the component itself.
    let root_value = if contract.parts.is_empty() {
        format!("{pascal}Primitive")
    } else {
        format!("{pascal}Primitive.Root")
    };
    emit_component_jsdoc(&mut out, &contract.description, contract.docs.as_deref());
    emit_props(
        &mut out,
        &pascal,
        &format!("ComponentPropsWithRef<typeof {root_value}>"),
        &contract.modifiers,
        contract.docs.as_deref(),
    );

    let (destructure, recipe_call) = destructure_and_call(&binding, &contract.modifiers);
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

/// A structural compound: one thin wrapper per part (the root + each
/// subcomponent), each applying its part class via its own recipe and forwarding
/// the rest. The consumer composes them exactly like the headless API — there is
/// no canonical subtree to auto-render (D56). Only the root carries the
/// component-level JSDoc; each part derives its props (incl. ref) from the
/// headless part via `ComponentPropsWithRef` (D59).
fn emit_structural_wrapper(contract: &Contract) -> String {
    let pascal = pascal_case(&contract.name);
    let root_component = contract.root.component.as_deref().unwrap_or("Root");

    let mut out = header(&contract.name, &pascal);

    // Import just the headless compound; each part's props (incl. its correctly
    // typed ref) are derived from the part component with `ComponentPropsWithRef`.
    out.push_str(&format!(
        "import {{ {pascal} as {pascal}Primitive }} from \"@primitiv-ui/react\";\n"
    ));
    out.push_str("import { type ComponentPropsWithRef } from \"react\";\n");

    let bindings = std::iter::once(recipe_binding(&contract.name))
        .chain(
            contract
                .subcomponents
                .iter()
                .map(|sub| subcomponent_binding(&contract.name, &sub.name)),
        )
        .collect::<Vec<_>>()
        .join(", ");
    out.push_str(&format!("import {{ {bindings} }} from \"./{}.recipe\";\n\n", contract.name));

    // Root part — the one that carries the component description.
    emit_component_jsdoc(&mut out, &contract.description, contract.docs.as_deref());
    emit_props(
        &mut out,
        &pascal,
        &format!("ComponentPropsWithRef<typeof {pascal}Primitive.{root_component}>"),
        &contract.modifiers,
        contract.docs.as_deref(),
    );
    emit_part_function(
        &mut out,
        &pascal,
        &recipe_binding(&contract.name),
        root_component,
        &pascal,
        &contract.modifiers,
    );

    // Each structural subcomponent — a thin wrapper, separated by a blank line.
    for sub in &contract.subcomponents {
        let sub_pascal = subcomponent_pascal(&contract.name, &sub.name);
        out.push('\n');
        emit_props(
            &mut out,
            &sub_pascal,
            &format!("ComponentPropsWithRef<typeof {pascal}Primitive.{}>", sub.component),
            &sub.modifiers,
            contract.docs.as_deref(),
        );
        emit_part_function(
            &mut out,
            &sub_pascal,
            &subcomponent_binding(&contract.name, &sub.name),
            &sub.component,
            &pascal,
            &sub.modifiers,
        );
    }
    out
}

/// The component-level JSDoc: the contract description, plus a `@see` line when
/// the contract carries a docs URL.
fn emit_component_jsdoc(out: &mut String, description: &str, docs: Option<&str>) {
    out.push_str("/**\n");
    out.push_str(&format!(" * {description}\n"));
    if let Some(url) = docs {
        out.push_str(" *\n");
        out.push_str(&format!(" * @see {url}\n"));
    }
    out.push_str(" */\n");
}

/// A part's props type. `primitive` is a `ComponentPropsWithRef<typeof X>` over
/// the headless part, so the styled props are **exactly** what the headless
/// component accepts — every prop, the `children`, and the correctly typed
/// `ref` (the imperative handle for `Tabs.Root`, the DOM node elsewhere) —
/// which the wrapper forwards by spreading `{...props}` (D59). With no modifier
/// it's a plain alias; otherwise a `type` intersection adds the variant props.
/// Always a `type` intersection, never `interface extends`: a primitive's props
/// are often a controlled/uncontrolled union, and an `interface` cannot extend a
/// union (TS2312), whereas intersection distributes over it (D57).
fn emit_props(
    out: &mut String,
    styled: &str,
    primitive: &str,
    modifiers: &[ModifierGroup],
    docs: Option<&str>,
) {
    if modifiers.is_empty() {
        out.push_str(&format!("export type {styled}Props = {primitive};\n\n"));
        return;
    }

    out.push_str(&format!("export type {styled}Props = {primitive} & {{\n"));
    for group in modifiers {
        out.push_str("  /**\n");
        out.push_str(&format!("   * {}\n", group.description));
        for option in &group.options {
            out.push_str(&format!("   * - `{}` — {}\n", option.name, option.description));
        }
        out.push_str(&format!("   * @default \"{}\"\n", group.default));
        if let Some(url) = docs {
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
    out.push_str("};\n\n");
}

/// One part's function component: destructure the variant props + `className`,
/// merge the recipe class, and forward the rest to `{Primitive}.{Component}`.
fn emit_part_function(
    out: &mut String,
    styled: &str,
    binding: &str,
    component: &str,
    primitive: &str,
    modifiers: &[ModifierGroup],
) {
    let (destructure, recipe_call) = destructure_and_call(binding, modifiers);
    let class_expr = format!("[{recipe_call}, className].filter(Boolean).join(\" \")");
    out.push_str(&format!(
        "export function {styled}({{ {destructure} }}: {styled}Props) {{\n"
    ));
    out.push_str(&format!(
        "  return <{primitive}Primitive.{component} className={{{class_expr}}} {{...props}} />;\n"
    ));
    out.push_str("}\n");
}

/// The function's parameter destructure and recipe call for a set of modifiers:
/// `("className, ...props", "recipe()")` with none, otherwise the variant props
/// are pulled out and passed to the recipe.
fn destructure_and_call(binding: &str, modifiers: &[ModifierGroup]) -> (String, String) {
    let props = modifiers
        .iter()
        .map(|group| group.prop())
        .collect::<Vec<_>>()
        .join(", ");
    if props.is_empty() {
        ("className, ...props".to_string(), format!("{binding}()"))
    } else {
        (
            format!("{props}, className, ...props"),
            format!("{binding}({{ {props} }})"),
        )
    }
}

/// The generated-file banner: names the component, points at the contract, and
/// states the wrapper's role.
fn header(name: &str, pascal: &str) -> String {
    format!(
        "/*\n \
         * {pascal} — styled wrapper, generated from contract.json.\n \
         *\n \
         * Do not edit by hand: change registry/components/{name}/contract.json and regenerate.\n \
         * A typed props surface over the headless @primitiv-ui/react component + the\n \
         * generated recipe — the primary DX (RFC 0004 §3.5 / D51).\n \
         */\n"
    )
}

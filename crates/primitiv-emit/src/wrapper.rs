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
    // The text-child label-wrapping is a single-element-only convenience (Button).
    let wrap_text = contract.wrap_text_children && contract.parts.is_empty();

    let mut out = header(&contract.name, &pascal);
    out.push_str(&format!(
        "import {{ {pascal} as {pascal}Primitive }} from \"@primitiv-ui/react\";\n"
    ));
    if wrap_text {
        out.push_str(
            "import { Children, type ComponentPropsWithRef, type ReactNode } from \"react\";\n",
        );
    } else {
        out.push_str("import { type ComponentPropsWithRef } from \"react\";\n");
    }
    out.push_str(&format!("import {{ {binding} }} from \"./{}.recipe\";\n\n", contract.name));

    emit_distributive_omit_helper(&mut out, contract);

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

    if wrap_text {
        emit_wrap_text_helper(&mut out, &contract.root.class);
    }

    let (destructure, recipe_call) =
        destructure_and_call(&binding, &contract.modifiers, contract.label || wrap_text);
    out.push_str(&format!(
        "export function {pascal}({{ {destructure} }}: {pascal}Props) {{\n"
    ));
    let class_expr = format!("[{recipe_call}, className].filter(Boolean).join(\" \")");
    if contract.parts.is_empty() {
        if wrap_text {
            // The styled element wraps text children in a `…__label` span via the
            // `wrapTextNodes` helper, so it renders an open/close tag.
            out.push_str(&format!(
                "  return (\n    <{pascal}Primitive className={{{class_expr}}} {{...props}}>\n"
            ));
            out.push_str("      {wrapTextNodes(children)}\n");
            out.push_str(&format!("    </{pascal}Primitive>\n  );\n"));
        } else {
            out.push_str(&format!(
                "  return <{pascal}Primitive className={{{class_expr}}} {{...props}} />;\n"
            ));
        }
    } else if contract.label {
        // A framed control with an inline label: the parts nest inside a
        // `…__control` box, and a `…__label` span carries the wrapper's
        // `children` — omitted when there are none, so the bare box still works.
        out.push_str(&format!(
            "  return (\n    <{pascal}Primitive.Root className={{{class_expr}}} {{...props}}>\n"
        ));
        out.push_str(&format!(
            "      <span className=\"{}__control\">\n",
            contract.root.class
        ));
        for part in &contract.parts {
            out.push_str(&format!(
                "        <{pascal}Primitive.{} className=\"{}\" />\n",
                pascal_case(&part.name),
                part.class
            ));
        }
        out.push_str("      </span>\n");
        out.push_str(&format!(
            "      {{children != null && <span className=\"{}__label\">{{children}}</span>}}\n",
            contract.root.class
        ));
        out.push_str(&format!("    </{pascal}Primitive.Root>\n  );\n"));
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
    // Text-child label-wrapping can also be opted into per structural subcomponent
    // (ToggleGroup.Item), independent of the single-element-only `wrap_text_children`.
    let any_wrap_text = contract.subcomponents.iter().any(|sub| sub.wrap_text_children);

    let mut out = header(&contract.name, &pascal);

    // Import just the headless compound; each part's props (incl. its correctly
    // typed ref) are derived from the part component with `ComponentPropsWithRef`.
    out.push_str(&format!(
        "import {{ {pascal} as {pascal}Primitive }} from \"@primitiv-ui/react\";\n"
    ));
    if any_wrap_text {
        out.push_str(
            "import { Children, type ComponentPropsWithRef, type ReactNode } from \"react\";\n",
        );
    } else {
        out.push_str("import { type ComponentPropsWithRef } from \"react\";\n");
    }

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

    emit_distributive_omit_helper(&mut out, contract);

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
        false,
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
        if sub.wrap_text_children {
            emit_structural_wrap_text_helper(&mut out, &sub_pascal, &sub.class);
        }
        emit_part_function(
            &mut out,
            &sub_pascal,
            &subcomponent_binding(&contract.name, &sub.name),
            &sub.component,
            &pascal,
            &sub.modifiers,
            sub.wrap_text_children,
        );
    }
    out
}

/// Emit the `DistributiveOmit` helper `emit_props` relies on — but only when the
/// wrapper has a modifier group to omit (a no-modifier file needs none). It is
/// distributive, not a plain `Omit`, so omitting a styled prop from the primitive
/// keeps the controlled / uncontrolled prop union intact for the `{...props}`
/// spread (a plain `Omit` collapses the union and breaks assignability).
fn emit_distributive_omit_helper(out: &mut String, contract: &Contract) {
    let has_modifiers = !contract.modifiers.is_empty()
        || contract
            .subcomponents
            .iter()
            .any(|sub| !sub.modifiers.is_empty());
    if has_modifiers {
        out.push_str(
            "type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;\n\n",
        );
    }
}

/// The `wrapTextNodes` helper for a text-wrapping single-element wrapper: it maps
/// string/number children into a `…__label` span (so `text-box-trim` sits on the
/// label, not the flex box) and passes element children — icons — through
/// untouched, leaving the icon↔label gap intact.
fn emit_wrap_text_helper(out: &mut String, root_class: &str) {
    out.push_str("function wrapTextNodes(children: ReactNode): ReactNode {\n");
    out.push_str("  return Children.map(children, (child) =>\n");
    out.push_str("    typeof child === \"string\" || typeof child === \"number\"\n");
    out.push_str(&format!(
        "      ? <span className=\"{root_class}__label\">{{child}}</span>\n"
    ));
    out.push_str("      : child,\n");
    out.push_str("  );\n");
    out.push_str("}\n\n");
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

    // The styled wrapper owns its modifier prop names, so omit them from the
    // primitive props before intersecting the variant union: otherwise a modifier
    // that shadows a native attribute (e.g. `size` on `<input>`, typed `number`)
    // intersects to `never` and the styled prop is unusable (D59). The omit is
    // `DistributiveOmit` (emitted by `emit_distributive_omit_helper`) so it keeps
    // the primitive's controlled / uncontrolled prop union intact for the spread.
    let omit = modifiers
        .iter()
        .map(|group| format!("\"{}\"", group.prop()))
        .collect::<Vec<_>>()
        .join(" | ");
    out.push_str(&format!(
        "export type {styled}Props = DistributiveOmit<{primitive}, {omit}> & {{\n"
    ));
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
/// When `wrap_text` is set (the part opted into `wrapTextChildren`), `children`
/// joins the destructure and the part renders an open/close tag whose content is
/// run through the part's own `wrap{Styled}TextNodes` helper instead of a bare
/// self-closing tag.
fn emit_part_function(
    out: &mut String,
    styled: &str,
    binding: &str,
    component: &str,
    primitive: &str,
    modifiers: &[ModifierGroup],
    wrap_text: bool,
) {
    let (destructure, recipe_call) = destructure_and_call(binding, modifiers, wrap_text);
    let class_expr = format!("[{recipe_call}, className].filter(Boolean).join(\" \")");
    out.push_str(&format!(
        "export function {styled}({{ {destructure} }}: {styled}Props) {{\n"
    ));
    if wrap_text {
        out.push_str(&format!(
            "  return (\n    <{primitive}Primitive.{component} className={{{class_expr}}} {{...props}}>\n"
        ));
        out.push_str(&format!("      {{wrap{styled}TextNodes(children)}}\n"));
        out.push_str(&format!(
            "    </{primitive}Primitive.{component}>\n  );\n"
        ));
    } else {
        out.push_str(&format!(
            "  return <{primitive}Primitive.{component} className={{{class_expr}}} {{...props}} />;\n"
        ));
    }
    out.push_str("}\n");
}

/// The `wrap{Sub}TextNodes` helper for a text-wrapping structural subcomponent:
/// mirrors [`emit_wrap_text_helper`] but is named per subcomponent so multiple
/// structural parts can each opt in without colliding, and wraps into a
/// `{sub_class}-label` span (a BEM element already ends in `__part`, so `-label`
/// reads as a sibling qualifier rather than nesting another `__`).
fn emit_structural_wrap_text_helper(out: &mut String, sub_pascal: &str, sub_class: &str) {
    out.push_str(&format!(
        "function wrap{sub_pascal}TextNodes(children: ReactNode): ReactNode {{\n"
    ));
    out.push_str("  return Children.map(children, (child) =>\n");
    out.push_str("    typeof child === \"string\" || typeof child === \"number\"\n");
    out.push_str(&format!(
        "      ? <span className=\"{sub_class}-label\">{{child}}</span>\n"
    ));
    out.push_str("      : child,\n");
    out.push_str("  );\n");
    out.push_str("}\n\n");
}

/// The function's parameter destructure and recipe call for a set of modifiers:
/// `("className, ...props", "recipe()")` with none, otherwise the variant props
/// are pulled out and passed to the recipe. When `children` is set (the
/// inline-label shape), it is pulled out of the rest before the `…props` spread
/// so the label span can render it without it leaking back onto the element.
fn destructure_and_call(
    binding: &str,
    modifiers: &[ModifierGroup],
    children: bool,
) -> (String, String) {
    let props = modifiers
        .iter()
        .map(|group| group.prop())
        .collect::<Vec<_>>()
        .join(", ");
    let tail = if children {
        "children, ...props"
    } else {
        "...props"
    };
    if props.is_empty() {
        (format!("className, {tail}"), format!("{binding}()"))
    } else {
        (
            format!("{props}, className, {tail}"),
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

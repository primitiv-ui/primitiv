import type { DocsContractProp } from "./docs-data";

/**
 * The four density modes of the Context system.
 *
 * Density is deliberately NOT a component prop — it is an ancestor
 * (`data-density`) that re-points every Context token beneath it, which is why
 * the playground applies it to a wrapper rather than passing it down. Showing it
 * beside `variant`/`size` is the point: it demos two different system concepts
 * side by side (docs-site-planning.md §1.19).
 */
export const DENSITIES = ["dense", "compact", "comfortable", "spacious"] as const;
export type Density = (typeof DENSITIES)[number];
export const DEFAULT_DENSITY: Density = "comfortable";

export type PlaygroundControl = {
  readonly name: string;
  readonly options: readonly string[];
  readonly defaultValue: string;
  readonly description: string;
};

/**
 * Turns a contract prop into a playground control.
 *
 * The options come from parsing the prop's TYPE — the generated docs-data
 * records `size` as the literal string `"xs" | "sm" | "md" | "lg" | "xl"`, so
 * the control set is derived from the contract rather than hand-listed here.
 * That is what makes the playground work for any component with no extra
 * configuration: add a modifier to a `contract.json` and a control appears.
 *
 * Returns null for anything that is not a closed union of string literals (a
 * `boolean` or freeform `string` modifier), because those need a different
 * control shape than a set of segments.
 */
export const toControl = (prop: DocsContractProp): PlaygroundControl | null => {
  const options = [...prop.type.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  if (options.length < 2) return null;
  return {
    name: prop.name,
    options,
    defaultValue: prop.default ?? options[0],
    description: prop.description,
  };
};

export const toControls = (
  props: readonly DocsContractProp[] | undefined,
): readonly PlaygroundControl[] =>
  (props ?? []).map(toControl).filter((c): c is PlaygroundControl => c !== null);

/**
 * Every contract-derived control for a component, gathered across ALL its parts.
 *
 * Reading `subComponents[0].contractProps` looks right and works for Button,
 * whose one part IS the contract root — but it silently produces an empty
 * control set for any compound whose modifiers live on a child part. Select is
 * exactly that: `size`/`mode`/`placement` are declared on `Select.Trigger`,
 * while `Select.Root` (part 0) has no modifiers at all, so the playground
 * rendered zero controls and a snippet reading `<Select />`. It failed silently
 * because an empty control list is a legitimate state — a component may have no
 * modifiers.
 *
 * Deduped by name because one modifier can be declared on more than one part:
 * `size` re-points the frame on the trigger AND the panel sizing on Content, so
 * a flat concatenation would render the control twice. First declaration wins,
 * which is the contract's own reading order.
 *
 * Which part each value is APPLIED to stays the spec's business — the render
 * function receives the whole `values` bag and decides. That split is what lets
 * one control drive two parts (Select's `size` reaches both) without this
 * function knowing anything about the component.
 */
export const contractControls = (
  subs: readonly { readonly contractProps?: readonly DocsContractProp[] }[],
): readonly PlaygroundControl[] => {
  const seen = new Set<string>();
  return toControls(subs.flatMap((s) => s.contractProps ?? [])).filter((c) => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  });
};

/** The initial `{ prop: value }` state for a control set. */
export const initialValues = (
  controls: readonly PlaygroundControl[],
): Record<string, string> =>
  Object.fromEntries(controls.map((c) => [c.name, c.defaultValue]));

/**
 * Renders a JSX snippet for the current playground state.
 *
 * EVERY control is written out, including props sitting at their default value.
 *
 * That is deliberate, and it was wrong the other way round first: omitting
 * defaults produces the code someone would idiomatically *write*, but a
 * playground snippet is a readout of the current state, not a style guide. With
 * defaults omitted, selecting `variant="primary"` and `size="md"` renders a bare
 * `<Button>` — so the snippet appears not to respond to the controls at all,
 * which is exactly the opposite of the thing being demonstrated. The Figma frame
 * agrees: it shows `<Button variant="primary" size="md">Button</Button>` with
 * both props at their defaults.
 *
 * `children` is passed separately because it is not a control.
 */
export const toJsx = ({
  component,
  values,
  controls,
  children,
}: {
  component: string;
  values: Record<string, string>;
  controls: readonly PlaygroundControl[];
  children?: string;
}): string => {
  const attrs = controls.map((c) => `${c.name}="${values[c.name]}"`);

  const open = [component, ...attrs].join(" ");
  if (!children) return `<${open} />`;

  // Break onto multiple lines once the single-line form gets unwieldy, matching
  // how the snippet would be formatted in a real file.
  const oneLine = `<${open}>${children}</${component}>`;
  if (oneLine.length <= 72) return oneLine;
  return [
    `<${component}`,
    ...attrs.map((a) => `  ${a}`),
    `>`,
    `  ${children}`,
    `</${component}>`,
  ].join("\n");
};

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

/** The initial `{ prop: value }` state for a control set. */
export const initialValues = (
  controls: readonly PlaygroundControl[],
): Record<string, string> =>
  Object.fromEntries(controls.map((c) => [c.name, c.defaultValue]));

/**
 * Renders a JSX snippet for the current playground state.
 *
 * A prop at its default value is OMITTED, so the generated code is what someone
 * would actually write rather than a fully-specified call with every default
 * spelled out. `children` is passed separately because it is not a control.
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
  const attrs = controls
    .filter((c) => values[c.name] !== c.defaultValue)
    .map((c) => `${c.name}="${values[c.name]}"`);

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

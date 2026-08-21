import type { DocsContractProp } from "./docs-data";
import type { Mode } from "@/site/preferences";

/**
 * Names a compound's parts the way the CURRENT MODE actually exports them.
 *
 * The two modes do not agree, and a snippet that ignores the switch is wrong in
 * one of them:
 *
 * - **headless** — one compound export from `@primitiv-ui/react`, so the parts
 *   are reached through it: `Select.Trigger`. These are also the names the props
 *   tables use, because they come from the same source.
 * - **styled** — `primitiv add` copies a file of flat named exports, so the part
 *   is a symbol of its own: `SelectTrigger`. It exists ONLY in that file.
 *
 * Button never exposed this because its snippet is `<Button variant="…">` in
 * both modes — a single-part component has no part names to disagree about.
 * Select does: `SelectTrigger` does not exist in headless mode, which is the
 * site's default, so the page shipped a snippet naming a symbol the reader
 * cannot import.
 *
 * Figma mode gets the dot form too. It is the closer read — the Figma sets are
 * themselves named `Select / Trigger` — but JSX is not really the right artifact
 * for a designer at all; see the handoff's outstanding list.
 *
 * For COMPOUNDS only. A single-part component's spec writes its own name
 * literally, since there is nothing to vary.
 */
export const partNamer =
  (mode: Mode, component: string) =>
  (part: string): string =>
    mode === "styled"
      ? part === "Root"
        ? component
        : `${component}${part}`
      : `${component}.${part}`;

/**
 * The import lines a snippet needs, for the current mode.
 *
 * Worth generating rather than hardcoding, because the import is the clearest
 * statement of what the mode switch actually changes — and the two shapes are
 * genuinely different, not just a different path:
 *
 * - **headless** — ONE symbol from the package, with the parts reached through
 *   it. `import { Select } from "@primitiv-ui/react"` and then `Select.Trigger`.
 * - **styled** — every part is its own named export from the file `primitiv add`
 *   copied into your project, so they are all listed.
 *
 * Showing it also makes the naming difference self-evidencing: the reader can
 * see that `SelectTrigger` is imported in one mode and absent in the other,
 * rather than having to take the prose's word for it.
 *
 * `icons` is separate because glyphs come from `@primitiv-ui/icons` in BOTH
 * modes — they are not part of what the switch changes, and a reader who omits
 * that line gets a confusing "Check is not defined" rather than an unstyled
 * component.
 */
export const importBlock = ({
  mode,
  component,
  componentId,
  parts = [],
  icons = [],
}: {
  mode: Mode;
  /** The exported root name, e.g. `"Select"`. */
  component: string;
  /** The registry id, for the styled copy's path — e.g. `"select"`. */
  componentId: string;
  /** Part names used by the snippet, e.g. `["Trigger", "Content"]`. */
  parts?: readonly string[];
  icons?: readonly string[];
}): string => {
  const lines: string[] = [];

  if (mode === "styled") {
    const named = [component, ...parts.map((p) => `${component}${p}`)];
    lines.push(
      `import { ${named.join(", ")} } from "@/components/ui/${componentId}";`,
    );
  } else {
    lines.push(`import { ${component} } from "@primitiv-ui/react";`);
  }

  if (icons.length > 0) {
    lines.push(`import { ${icons.join(", ")} } from "@primitiv-ui/icons";`);
  }

  return lines.join("\n");
};

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

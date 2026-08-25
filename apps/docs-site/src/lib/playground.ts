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
 * Button never exposed this because it is a single part, so there are no part
 * names to disagree about. Select does: `SelectTrigger` does not exist in
 * headless mode — which was the site's default at the time — so the page
 * shipped a snippet naming a symbol the reader cannot import.
 *
 * (An earlier version of this note said Button's snippet is
 * `<Button variant="...">` "in both modes" — true of what shipped, and the bug
 * `contractAttr` below now fixes: `variant` is not a headless prop either.)
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
 * Renders a STYLED-LAYER CONTRACT PROP inside a snippet, for the current mode.
 *
 * `variant`, `size` and `placement` are not props of the headless primitive —
 * they are the copied styled file's contract. The generated docs-data already
 * says so (they arrive as `contractProps`, and §1.24's `From` column prints it
 * in the table), but the snippets ignored it: every code block on the Button
 * page printed `<Button variant="primary">` under the Headless switch, naming a
 * prop the reader cannot pass. Exactly the bug `partNamer` fixes for part names,
 * one level down — and worse, because a wrong part name fails at import while a
 * wrong prop fails silently.
 *
 * Returns a LEADING space, so it interpolates straight after the tag name and
 * still closes cleanly when it renders nothing: `<Button${attr}>` gives
 * `<Button variant="primary">` or plain `<Button>`.
 *
 * `headlessClass` decides between the two honest headless readings:
 *
 * - **omitted** — the prop simply goes. Right when the prop is incidental to
 *   what the example demonstrates (the Disabled example is about `disabled`).
 * - **supplied** — the prop becomes a `className`. Right when the prop IS the
 *   subject: dropping `variant` from the Variants example leaves five identical
 *   `<Button>` lines beside a preview of five different buttons, and the honest
 *   headless answer to "how do I get a primary button" is "you write the class".
 *   The name shown is illustrative, which is the point — in this mode it is the
 *   reader's to choose.
 */
export const contractAttr = ({
  mode,
  prop,
  value,
  headlessClass,
}: {
  mode: Mode;
  prop: string;
  value: string;
  /** Stand-in class for headless mode. Omit to drop the prop instead. */
  headlessClass?: string;
}): string => {
  if (mode !== "headless") return ` ${prop}="${value}"`;
  return headlessClass ? ` className="${headlessClass}"` : "";
};

/**
 * The comment that precedes a snippet whose contract props were swapped for
 * class names — so the substitution is stated rather than left to be noticed.
 *
 * Spread into the snippet's line array; it is empty in every other mode.
 */
export const contractNote = (mode: Mode, props = "`variant` and `size`"): readonly string[] =>
  mode === "headless"
    ? [
        // Phrased to read correctly for one prop or several, since callers pass
        // either ("`variant`" on the Variants example, the default elsewhere).
        `// ${props}: styled-layer contract, absent from the headless primitive`,
        `// — so the class names below are yours to define.`,
        ``,
      ]
    : [];

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
/**
 * Controls that lead, in this order, whatever a contract's own order is.
 *
 * `size` and `variant` are the two axes nearly every component has, so a reader
 * moving between pages finds them in the same place rather than hunting for
 * them behind a component-specific axis — Badge declared `tone` first, Select
 * `mode`. Everything else keeps the contract's reading order behind them.
 */
const CONTROL_ORDER = ["size", "variant"];

export const contractControls = (
  subs: readonly { readonly contractProps?: readonly DocsContractProp[] }[],
): readonly PlaygroundControl[] => {
  const seen = new Set<string>();
  const controls = toControls(subs.flatMap((s) => s.contractProps ?? [])).filter(
    (c) => {
      if (seen.has(c.name)) return false;
      seen.add(c.name);
      return true;
    },
  );

  /* A stable sort: anything not named keeps its relative order, so this only
     lifts the two to the front rather than reshuffling the rest. */
  const rank = (name: string) => {
    const i = CONTROL_ORDER.indexOf(name);
    return i === -1 ? CONTROL_ORDER.length : i;
  };
  return [...controls].sort((a, b) => rank(a.name) - rank(b.name));
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
 *
 * Under Headless the caller passes NO controls, so this correctly renders the
 * bare `<Button>` the paragraph above argues against — the difference being that
 * there is then nothing on screen for the snippet to be out of step with, since
 * the controls are gone too. Every control is a `contract.json` modifier, i.e.
 * the styled layer's, and printing one in headless mode names a prop that does
 * not exist (see `contractAttr`).
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

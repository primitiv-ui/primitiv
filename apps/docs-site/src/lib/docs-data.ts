/*
 * The generated docs-data contract.
 *
 * Props tables on this site are NEVER hand-authored — that is a hard
 * architectural constraint (docs-site-planning.md §1.5), because three
 * consumption modes × N components means hand-maintained tables drift
 * immediately and silently. The JSON under `src/docs-data/` is produced from
 * source by `scripts/docs-data/extract-docs-data.mjs`, which reads the headless
 * half out of each `*Props` type's JSDoc via the TypeScript compiler API and
 * the styled half straight out of the registry `contract.json`.
 *
 * Regenerate with, from the repo root:
 *   node scripts/docs-data/extract-docs-data.mjs select
 *   cp scripts/docs-data/select.docs.json apps/docs-site/src/docs-data/
 *
 * Known gap, inherited from the extractor and NOT fixable here: a
 * discriminated union collapses. `Select.Root`'s controlled/uncontrolled pair
 * (`value` + `onValueChange` XOR `defaultValue`) flattens into a plain prop
 * list, so the mutual exclusivity has to be stated in prose on the page.
 */

import buttonDocs from "@/docs-data/button.docs.json";
import selectDocs from "@/docs-data/select.docs.json";

export type DocsProp = {
  readonly name: string;
  readonly type: string;
  readonly required: boolean;
  readonly default: string | null;
  readonly description: string;
};

export type DocsContractProp = {
  readonly name: string;
  readonly type: string;
  readonly default: string | null;
  readonly description: string;
};

export type DocsSubComponent = {
  readonly name: string;
  readonly extends: string | null;
  readonly props: readonly DocsProp[];
  readonly contractProps?: readonly DocsContractProp[];
  readonly dataAttributes?: readonly { name: string; description: string }[];
};

export type DocsCustomProperty = {
  readonly name: string;
  readonly defaultsTo: string;
};

export type ComponentDocs = {
  readonly id: string;
  readonly displayName: string;
  readonly status: string;
  readonly description: string;
  readonly headless: {
    readonly package: string;
    readonly importPath: string;
    readonly subComponents: readonly DocsSubComponent[];
  };
  readonly styled: {
    readonly installCommand: string;
    readonly rootClass: string;
    readonly customProperties: readonly DocsCustomProperty[];
  };
  /** Figma node id, so the page can deep-link to the component set. */
  readonly figma: { readonly componentSetKey: string };
};

const DOCS = {
  button: buttonDocs as unknown as ComponentDocs,
  select: selectDocs as unknown as ComponentDocs,
} as const;

export type ComponentId = keyof typeof DOCS;

export const getDocs = (id: ComponentId): ComponentDocs => DOCS[id];

export const ALL_DOCS: readonly ComponentDocs[] = Object.values(DOCS);

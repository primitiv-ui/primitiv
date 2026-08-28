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

import alertDocs from "@/docs-data/alert.docs.json";
import badgeDocs from "@/docs-data/badge.docs.json";
import buttonDocs from "@/docs-data/button.docs.json";
import inputDocs from "@/docs-data/input.docs.json";
import accordionDocs from "@/docs-data/accordion.docs.json";
import checkboxCardDocs from "@/docs-data/checkbox-card.docs.json";
import checkboxDocs from "@/docs-data/checkbox.docs.json";
import emptyStateDocs from "@/docs-data/empty-state.docs.json";
import fieldDocs from "@/docs-data/field.docs.json";
import inputGroupDocs from "@/docs-data/input-group.docs.json";
import modalDocs from "@/docs-data/modal.docs.json";
import progressDocs from "@/docs-data/progress.docs.json";
import radioCardDocs from "@/docs-data/radio-card.docs.json";
import radioDocs from "@/docs-data/radio.docs.json";
import segmentedControlDocs from "@/docs-data/segmented-control.docs.json";
import selectDocs from "@/docs-data/select.docs.json";
import sliderDocs from "@/docs-data/slider.docs.json";
import switchDocs from "@/docs-data/switch.docs.json";
import textareaDocs from "@/docs-data/textarea.docs.json";
import tabsDocs from "@/docs-data/tabs.docs.json";
import toggleGroupDocs from "@/docs-data/toggle-group.docs.json";
import dividerDocs from "@/docs-data/divider.docs.json";
import boxDocs from "@/docs-data/box.docs.json";
import stackDocs from "@/docs-data/stack.docs.json";
import gridDocs from "@/docs-data/grid.docs.json";
import containerDocs from "@/docs-data/container.docs.json";
import centerDocs from "@/docs-data/center.docs.json";
import spacerDocs from "@/docs-data/spacer.docs.json";
import aspectRatioDocs from "@/docs-data/aspect-ratio.docs.json";
import rosterData from "@/docs-data/roster.json";

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
  /**
   * True when the registry adds this part and `@primitiv-ui/react` does not
   * export it — Modal's `Header`, `Body` and `Footer`, which are layout the
   * copied file supplies.
   *
   * The heading above a props table is NOT inside the mode tabs, so it is
   * written in the headless dot spelling for every part. On a styled-only part
   * that spelling names an import that does not exist, so the table says so
   * instead. Derived by the extractor from which file the props type was found
   * in, not hand-maintained.
   */
  readonly styledOnly?: boolean;
  /**
   * True when only the headless compound exports this part — Checkbox's
   * `Indicator`, which the copied `Checkbox` renders internally rather than
   * exporting. The mirror of {@link DocsSubComponent.styledOnly}, derived the
   * same way: from what the registry file actually exports.
   */
  readonly headlessOnly?: boolean;
  readonly props: readonly DocsProp[];
  readonly contractProps?: readonly DocsContractProp[];
  /**
   * The registry class for this part, or null when it has none.
   *
   * What a STYLED-mode reader writes in their CSS to reach the element the data
   * attributes land on. Null in headless mode's world by definition — there the
   * element is the consumer's, so the part name is the only identifier.
   */
  readonly class: string | null;
  /**
   * The data attributes THIS part emits, as full rows.
   *
   * Was declared as `{ name, description }` and optional, which the extractor
   * never emitted — it wrote names only, and now writes the same
   * `{ name, value, when }` rows the section renders. Corrected rather than
   * cast at the call site: the type existed but described nothing real, so it
   * type-checked a shape that could not occur while hiding the one that did.
   *
   * Always present, empty when the part emits nothing.
   */
  readonly dataAttributes: readonly DocsDataAttribute[];
};

export type DocsCustomProperty = {
  readonly name: string;
  readonly defaultsTo: string;
};

/**
 * One row of the "Data attributes" section, straight from `contract.json`.
 *
 * `value` is why this is a triple rather than the bare name list the props
 * tables carry: `data-state` is declared twice with different values
 * (`checked`/`unchecked`), so keying on the name alone loses a row.
 */
export type DocsDataAttribute = {
  readonly name: string;
  readonly value: string;
  readonly when: string;
};

/**
 * The component groups on the /components index, in display order.
 *
 * The names and the order are the canonical set the repo already uses — the
 * kitchen-sink's `PAGE_TOC` and the Figma file's page-section dividers — so the
 * three surfaces group a component the same way and a reader who learns one
 * learns all three.
 *
 * A union rather than `string`: `category` arrives from generated docs-data, and
 * typing it here means a typo in `scripts/docs-data/registry.mjs` fails the
 * typecheck instead of silently dropping that component's card off the page.
 */
export const CATEGORY_ORDER = [
  "Layout",
  "Buttons",
  "Forms",
  "Collections & Selection",
  "Typography",
  "Overlays",
  "Feedback & Status",
  "Disclosure",
  "Navigation",
  "Data Display",
] as const;

export type Category = (typeof CATEGORY_ORDER)[number];

/** Anchor id for a group heading — shared by the index and its TOC rail. */
export const categorySlug = (category: Category): string =>
  category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * One entry per registry component, documented or not.
 *
 * Generated by `scripts/docs-data/sync-docs-data.mjs` from `registry.json` plus
 * each component's `contract.json`, so the index can show the whole library —
 * the shape of that page can only be judged with every group populated, and 60
 * of the 63 have no docs page yet. `documented` is what decides whether a card
 * links anywhere.
 */
export type RosterEntry = {
  readonly id: string;
  readonly displayName: string;
  readonly category: Category;
  readonly description: string;
  readonly documented: boolean;
};

export const ROSTER = rosterData as readonly RosterEntry[];

export type ComponentDocs = {
  readonly id: string;
  readonly displayName: string;
  /**
   * `registry-only` means there is NO headless primitive — the component ships
   * solely as a copied styled surface (Badge, Kbd, Tag and the other prose
   * leaves). It changes what Installation can honestly say: `npm i
   * @primitiv-ui/react` does not give you one of these.
   */
  readonly kind: string;
  readonly status: string;
  readonly category: Category;
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
    readonly dataAttributes: readonly DocsDataAttribute[];
  };
  /**
   * Figma node id, so the page can deep-link to the component set.
   *
   * **Optional, because not every component has a set.** `input-group` is the
   * first: the Figma file draws Input's adornment case as a note on Input's own
   * entry rather than as a component set of its own. Pointing the link at Input
   * instead would land a designer on a different component — a wrong link is
   * worse than no link — so the header omits the Figma link when this is absent.
   */
  readonly figma: { readonly componentSetKey?: string };
};

const DOCS = {
  alert: alertDocs as unknown as ComponentDocs,
  badge: badgeDocs as unknown as ComponentDocs,
  button: buttonDocs as unknown as ComponentDocs,
  input: inputDocs as unknown as ComponentDocs,
  accordion: accordionDocs as unknown as ComponentDocs,
  checkbox: checkboxDocs as unknown as ComponentDocs,
  "checkbox-card": checkboxCardDocs as unknown as ComponentDocs,
  "empty-state": emptyStateDocs as unknown as ComponentDocs,
  field: fieldDocs as unknown as ComponentDocs,
  "input-group": inputGroupDocs as unknown as ComponentDocs,
  modal: modalDocs as unknown as ComponentDocs,
  progress: progressDocs as unknown as ComponentDocs,
  radio: radioDocs as unknown as ComponentDocs,
  "radio-card": radioCardDocs as unknown as ComponentDocs,
  "segmented-control": segmentedControlDocs as unknown as ComponentDocs,
  select: selectDocs as unknown as ComponentDocs,
  slider: sliderDocs as unknown as ComponentDocs,
  switch: switchDocs as unknown as ComponentDocs,
  textarea: textareaDocs as unknown as ComponentDocs,
  tabs: tabsDocs as unknown as ComponentDocs,
  "toggle-group": toggleGroupDocs as unknown as ComponentDocs,
  divider: dividerDocs as unknown as ComponentDocs,
  box: boxDocs as unknown as ComponentDocs,
  stack: stackDocs as unknown as ComponentDocs,
  grid: gridDocs as unknown as ComponentDocs,
  container: containerDocs as unknown as ComponentDocs,
  center: centerDocs as unknown as ComponentDocs,
  spacer: spacerDocs as unknown as ComponentDocs,
  "aspect-ratio": aspectRatioDocs as unknown as ComponentDocs,
} as const;

export type ComponentId = keyof typeof DOCS;

export const getDocs = (id: ComponentId): ComponentDocs => DOCS[id];

export const ALL_DOCS: readonly ComponentDocs[] = Object.values(DOCS);

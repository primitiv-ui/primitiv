"use client";

import { useState } from "react";

import { Button } from "@/components/button";
import {
  Tree,
  TreeBranch,
  TreeBranchContent,
  TreeBranchControl,
  TreeBranchIndicator,
  TreeItem,
  TreeSelectionPath,
} from "@/components/tree";
import { contractAttr, importBlock, partNamer } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import { glyph, withGlyphs } from "./glyphs";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";
type Connectors = "lines" | "none";

/** A file-tree node model, so the live demos map one shape rather than repeating
 *  the recursive JSX. A node with `children` is a branch; otherwise a leaf. */
type Node = { value: string; label: string; children?: Node[]; disabled?: boolean };

const FILE_TREE: Node[] = [
  {
    value: "src",
    label: "src",
    children: [
      {
        value: "components",
        label: "components",
        children: [
          { value: "Button.tsx", label: "Button.tsx" },
          { value: "Card.tsx", label: "Card.tsx" },
        ],
      },
      { value: "index.ts", label: "index.ts" },
      { value: "app.tsx", label: "app.tsx" },
    ],
  },
  {
    value: "public",
    label: "public",
    children: [{ value: "favicon.ico", label: "favicon.ico" }],
  },
  { value: "README.md", label: "README.md" },
  { value: "package.json", label: "package.json" },
];

/**
 * The live recursive renderer. A branch nests a `TreeBranchControl` (the row,
 * with its own chevron `TreeBranchIndicator`) beside a `TreeBranchContent` (the
 * children); a leaf is a `TreeItem`. This is the shape a consumer authors by
 * hand — there is no `data` prop, by design.
 */
const TreeNodes = ({ nodes }: { nodes: Node[] }) => (
  <>
    {nodes.map((n) =>
      n.children ? (
        <TreeBranch key={n.value} value={n.value} label={n.label} disabled={n.disabled}>
          <TreeBranchControl>
            <TreeBranchIndicator />
            {n.label}
          </TreeBranchControl>
          <TreeBranchContent>
            <TreeNodes nodes={n.children} />
          </TreeBranchContent>
        </TreeBranch>
      ) : (
        <TreeItem key={n.value} value={n.value} label={n.label} disabled={n.disabled}>
          {n.label}
        </TreeItem>
      ),
    )}
  </>
);

const PARTS = [
  "Branch",
  "BranchControl",
  "BranchContent",
  "BranchIndicator",
  "Item",
] as const;

const imports = (mode: Mode, parts: readonly string[] = PARTS) =>
  importBlock({ mode, component: "Tree", componentId: "tree", parts });

/**
 * A representative subtree in the current mode's spelling — most of every
 * snippet, built once. Shows one branch (with a nested branch) and a leaf.
 */
const treeBody = (mode: Mode, indent = "  ") => {
  const p = partNamer(mode, "Tree");
  return [
    `${indent}<${p("Branch")} value="src" label="src">`,
    `${indent}  <${p("BranchControl")}>`,
    `${indent}    <${p("BranchIndicator")} />`,
    `${indent}    src`,
    `${indent}  </${p("BranchControl")}>`,
    `${indent}  <${p("BranchContent")}>`,
    `${indent}    <${p("Item")} value="index.ts" label="index.ts">index.ts</${p("Item")}>`,
    `${indent}    {/* ...more items and nested branches */}`,
    `${indent}  </${p("BranchContent")}>`,
    `${indent}</${p("Branch")}>`,
    `${indent}<${p("Item")} value="readme" label="README.md">README.md</${p("Item")}>`,
  ];
};

/** The controlled example's live half — owns both the expanded set and the
 *  selection, with buttons that drive expansion from outside the tree. */
const ControlledExample = () => {
  const allBranches = ["src", "components", "public"];
  const [expanded, setExpanded] = useState<string[]>(["src"]);
  const [selected, setSelected] = useState<string | null>("index.ts");

  return (
    <div className="docs-example-stack" style={{ inlineSize: "100%" }}>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <Button size="sm" variant="secondary" onClick={() => setExpanded(allBranches)}>
          Expand all
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setExpanded([])}>
          Collapse all
        </Button>
      </div>
      <p className="docs-prop-description">
        Selected: {selected ?? "nothing"}
      </p>
      <Tree
        expandedValues={expanded}
        onExpandedChange={setExpanded}
        selectedValue={selected}
        onSelectedValueChange={setSelected}
      >
        <TreeNodes nodes={FILE_TREE} />
      </Tree>
    </div>
  );
};


/* ------------------------------------------------------------------ *
 * Elements markup (RFC 0033) — the `@primitiv-ui/web` custom elements in
 * the shape `primitiv add tree --styled` prints. The headless tab is
 * derived from it by stripping the classes.
 * ------------------------------------------------------------------ */

const T = "primitiv-tree";

/** Tree size → the Breadcrumb size its selection path uses, one tier down. */
const PATH_SIZE: Record<Size, string> = { xs: "xs", sm: "xs", md: "sm", lg: "md", xl: "lg" };

/** `nodes` as Elements markup: a collapsed branch's group carries `hidden`. */
const elementsNodes = (nodes: Node[], expanded: readonly string[], indent: string): string[] =>
  nodes.flatMap((n) => {
    const disabled = n.disabled ? " disabled" : "";
    if (!n.children)
      return [
        `${indent}<${T}-item value="${n.value}" label="${n.label}" class="${T}__item"${disabled}><span class="${T}__item-spacer"></span><span class="${T}__item-label">${n.label}</span></${T}-item>`,
      ];
    const hidden = expanded.includes(n.value) ? "" : " hidden";
    return [
      `${indent}<${T}-branch value="${n.value}" label="${n.label}" class="${T}__branch"${disabled}>`,
      `${indent}  <${T}-branch-control class="${T}__branch-control"><${T}-branch-indicator class="${T}__branch-indicator">${glyph("chevron-right")}</${T}-branch-indicator><span class="${T}__branch-control-label">${n.label}</span></${T}-branch-control>`,
      `${indent}  <${T}-branch-content class="${T}__branch-content"${hidden}>`,
      `${indent}    <span class="${T}__branch-content-inner"><span class="${T}__branch-content-body">`,
      ...elementsNodes(n.children, expanded, `${indent}      `),
      `${indent}    </span></span>`,
      `${indent}  </${T}-branch-content>`,
      `${indent}</${T}-branch>`,
    ];
  });

/** The selection path: a Breadcrumb `<template>` the element stamps once per trail. */
const elementsPath = (size: Size, indent = "  ") =>
  [
    `<${T}-selection-path class="${T}__selection-path">`,
    `  <template>`,
    `    <nav class="primitiv-breadcrumb primitiv-breadcrumb--${PATH_SIZE[size]}" aria-label="Breadcrumb">`,
    `      <ol class="primitiv-breadcrumb__list">`,
    `        <li class="primitiv-breadcrumb__item"><span data-tree-selection-segment></span></li>`,
    `        <li class="primitiv-breadcrumb__separator" role="presentation" aria-hidden="true">/</li>`,
    `        <li class="primitiv-breadcrumb__item"><span class="primitiv-breadcrumb__page" aria-current="page" data-tree-selection-segment></span></li>`,
    `      </ol>`,
    `    </nav>`,
    `  </template>`,
    `</${T}-selection-path>`,
  ].map((line) => indent + line);

const elementsTree = ({
  size = "md",
  connectors = "lines",
  expanded = ["src"],
  value = ["index.ts"],
  multiple = false,
  path = false,
  nodes = FILE_TREE,
}: {
  size?: Size;
  connectors?: Connectors;
  expanded?: string[];
  value?: string[];
  multiple?: boolean;
  path?: boolean;
  nodes?: Node[];
} = {}) =>
  [
    `<${T} class="${T} ${T}--${size} ${T}--connectors-${connectors}" aria-label="Files"` +
      (multiple ? ` selection-mode="multiple"` : "") +
      ` expanded="${expanded.join(" ")}"` +
      (value.length ? ` value="${value.join(" ")}"` : "") +
      `>`,
    ...(path ? elementsPath(size) : []),
    ...elementsNodes(nodes, expanded, "  "),
    `</${T}>`,
  ].join("\n");

const glyphPreview = (_density: unknown, code: string) => withGlyphs(code);

/** The controlled example's Elements preview: the buttons and readout the script drives. */
const controlledElementsPreview = () =>
  withGlyphs(
    [
      `<div class="docs-example-stack" style="inline-size: 100%">`,
      `<div style="display: flex; gap: 0.75rem; flex-wrap: wrap">`,
      `<button type="button" class="primitiv-button primitiv-button--secondary primitiv-button--sm" data-expand-all>Expand all</button>`,
      `<button type="button" class="primitiv-button primitiv-button--secondary primitiv-button--sm" data-collapse-all>Collapse all</button>`,
      `</div>`,
      `<p class="docs-prop-description">Selected: <span data-selected-node>index.ts</span></p>`,
      elementsTree(),
      `</div>`,
    ].join("\n"),
  );

/** Drives the controlled example as the code tab's script does. */
const wireControlled = (root: HTMLElement) => {
  const tree = root.querySelector<HTMLElement & { expanded: string }>("primitiv-tree");
  const readout = root.querySelector("[data-selected-node]");
  const expandAll = root.querySelector("[data-expand-all]");
  const collapseAll = root.querySelector("[data-collapse-all]");
  if (!tree || !readout || !expandAll || !collapseAll) return;
  const onChange = (event: Event) => {
    const { value } = (event as CustomEvent<{ value: string[] }>).detail;
    readout.textContent = value[0] ?? "nothing";
  };
  const expand = () => (tree.expanded = "src components public");
  const collapse = () => (tree.expanded = "");
  tree.addEventListener("primitiv-tree-change", onChange);
  expandAll.addEventListener("click", expand);
  collapseAll.addEventListener("click", collapse);
  return () => {
    tree.removeEventListener("primitiv-tree-change", onChange);
    expandAll.removeEventListener("click", expand);
    collapseAll.removeEventListener("click", collapse);
  };
};

/**
 * Tree's page content.
 *
 * The WAI-ARIA tree view — a recursive composition, not a data-driven one. The
 * keyboard model is the pattern's own (arrow keys move over *visible* rows,
 * left/right collapse/expand), so it earns a section; the standout feature is
 * `Tree.SelectionPath`, a breadcrumb of the selected node's ancestry.
 */
export const treeSpec: ComponentSpec = {
  playground: {
    component: "Tree",
    /* Hand-written: a compound authored recursively, so the generated `toJsx`
       would print a childless `<Tree size="md" connectors="lines" />`. */
    snippet: (values, mode) => {
      if (mode === "elements")
        return elementsTree({ size: values.size as Size, connectors: values.connectors as Connectors });
      const p = partNamer(mode, "Tree");
      const mods =
        contractAttr({ mode, prop: "size", value: values.size }) +
        contractAttr({ mode, prop: "connectors", value: values.connectors });
      return [
        imports(mode),
        ``,
        `<${p("Root")}${mods} defaultExpandedValues={["src"]} defaultSelectedValue="index.ts">`,
        ...treeBody(mode),
        `</${p("Root")}>`,
      ].join("\n");
    },
    elementsPreview: (code) => withGlyphs(code),
    fill: true,
    render: (values) => (
      <div style={{ inlineSize: "100%" }}>
        <Tree
          size={values.size as Size}
          connectors={values.connectors as Connectors}
          defaultExpandedValues={["src"]}
          defaultSelectedValue="index.ts"
        >
          <TreeNodes nodes={FILE_TREE} />
        </Tree>
      </div>
    ),
  },

  anatomyMeta:
    "Seven parts, authored recursively — there is no `data` prop. A **branch** is a `Tree.Branch` wrapping a `Tree.BranchControl` (the clickable row, which holds its own `Tree.BranchIndicator` chevron and the label) and a `Tree.BranchContent` (the collapsible group of its children). A **leaf** is a `Tree.Item`. `Tree.SelectionPath` is optional — a breadcrumb of the selected node's ancestry that reads the selection from context and composes the `Breadcrumb` component.",

  anatomy: [
    {
      label: "Parts",
      code: (mode) => {
        if (mode === "elements")
          return [
            `<${T} class="${T}">`,
            `  <${T}-selection-path class="${T}__selection-path">`,
            `    <template>…a Breadcrumb trail…</template>   <!-- optional -->`,
            `  </${T}-selection-path>`,
            `  <${T}-branch value="src" class="${T}__branch">`,
            `    <${T}-branch-control class="${T}__branch-control">`,
            `      <${T}-branch-indicator class="${T}__branch-indicator">…</${T}-branch-indicator>`,
            `    </${T}-branch-control>`,
            `    <${T}-branch-content class="${T}__branch-content">`,
            `      <${T}-item value="index.ts" class="${T}__item">…</${T}-item>   <!-- a leaf, or another branch -->`,
            `    </${T}-branch-content>`,
            `  </${T}-branch>`,
            `  <${T}-item value="readme" class="${T}__item">…</${T}-item>`,
            `</${T}>`,
          ].join("\n");
        const p = partNamer(mode, "Tree");
        return [
          `<${p("Root")}>`,
          `  <${p("SelectionPath")} />        {/* optional — the ancestry breadcrumb */}`,
          `  <${p("Branch")}>`,
          `    <${p("BranchControl")}>`,
          `      <${p("BranchIndicator")} />`,
          `    </${p("BranchControl")}>`,
          `    <${p("BranchContent")}>`,
          `      <${p("Item")} />        {/* a leaf, or another Branch */}`,
          `    </${p("BranchContent")}>`,
          `  </${p("Branch")}>`,
          `  <${p("Item")} />`,
          `</${p("Root")}>`,
        ].join("\n");
      },
    },
  ],

  keyboardMeta:
    "The rows share a **single tab stop** (a roving tabindex), and movement runs over the *visible* rows in depth-first order — collapsed subtrees and disabled nodes are skipped. `Home`/`End` still land on non-disabled neighbours. This is the WAI-ARIA tree pattern; `ArrowLeft`/`ArrowRight` keep their meaning under `dir=\"rtl\"`, since the tree is vertical.",

  keyboard: [
    {
      keys: ["ArrowDown", "ArrowUp"],
      behaviour: "Move focus to the next / previous visible row.",
    },
    {
      keys: ["ArrowRight"],
      behaviour:
        "On a collapsed branch, expand it; on an open branch, move to its first child. A no-op on a leaf.",
    },
    {
      keys: ["ArrowLeft"],
      behaviour:
        "On an open branch, collapse it; otherwise move focus to the parent branch. A no-op at the root.",
    },
    { keys: ["Home", "End"], behaviour: "Focus the first / last visible row." },
    {
      keys: ["Enter", "Space"],
      behaviour:
        "Select the focused row. On a branch this also toggles its expansion in the same gesture.",
    },
  ],

  examples: [
    {
      id: "file-tree",
      title: "A file tree",
      render: () => (
        <InteractiveExample
          elementsCaption={"Author the tree as nested markup: `<primitiv-tree-branch>`es and `<primitiv-tree-item>` leaves, each with a `value` unique within the tree and a `label` the selection path reads. The root's `expanded` attribute lists the open branches and its `value` the selected node, both space-separated. Write `hidden` on a collapsed branch's `<primitiv-tree-branch-content>` so nothing shows before the script loads. The indicator is yours to fill \u2014 a chevron here \u2014 and the stylesheet rotates it open."}
          elementsPreview={glyphPreview}
          caption="The canonical shape: `Tree.Branch`es and `Tree.Item` leaves, authored recursively. `defaultExpandedValues` seeds which branches start open and `defaultSelectedValue` which node starts selected (single selection is the default). Every node needs a `value` unique within the tree; `label` feeds the node registry that `Tree.SelectionPath` reads. The `Tree.BranchIndicator` needs no icon — it ships its own chevron and the stylesheet rotates it open."
          code={(_density, mode) => {
            if (mode === "elements") return elementsTree({ value: ["index.ts"] });
            const p = partNamer(mode, "Tree");
            return [
              imports(mode),
              ``,
              `<${p("Root")} defaultExpandedValues={["src"]} defaultSelectedValue="index.ts">`,
              ...treeBody(mode),
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <Tree defaultExpandedValues={["src"]} defaultSelectedValue="index.ts">
                <TreeNodes nodes={FILE_TREE} />
              </Tree>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "selection-path",
      title: "Selection path",
      render: () => (
        <InteractiveExample
          elementsCaption={"`<primitiv-tree-selection-path>` renders the selected node's root-to-leaf ancestry from the Breadcrumb markup in its `<template>`: the first `[data-tree-selection-segment]` is stamped once per ancestor, the last is the current node, and the separator goes between. An empty selection sets `data-empty`. Load the `breadcrumb` styles beside the tree's, and pick a Breadcrumb size one tier below the tree's. **Select a node** to watch the trail update."}
          elementsPreview={glyphPreview}
          caption="`Tree.SelectionPath` renders a breadcrumb of the selected node's root-to-leaf ancestry — the editor path bar. It reads the selection from context, so it needs no props beyond its `size`, and it composes the `Breadcrumb` component (installed with the tree). Select a node below and watch the trail update; the current node is marked by weight. Its `size` is the **tree's** size and maps one tier down, so the bar reads compact beside the rows."
          code={(_density, mode) => {
            if (mode === "elements") return elementsTree({ expanded: ["src", "components"], value: ["Button.tsx"], path: true });
            const p = partNamer(mode, "Tree");
            return [
              imports(mode, ["SelectionPath", "Branch", "BranchControl", "BranchContent", "BranchIndicator", "Item"]),
              ``,
              `<${p("Root")} defaultExpandedValues={["src"]} defaultSelectedValue="index.ts">`,
              `  <${p("SelectionPath")} />`,
              ...treeBody(mode),
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <Tree defaultExpandedValues={["src", "components"]} defaultSelectedValue="Button.tsx">
                <TreeSelectionPath />
                <TreeNodes nodes={FILE_TREE} />
              </Tree>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "multiple-selection",
      title: "Multiple selection",
      render: () => (
        <InteractiveExample
          elementsCaption={"`selection-mode=\"multiple\"` lets several nodes be selected at once \u2014 `Ctrl`/`Cmd`+click adds or removes one, `Shift`+click selects a contiguous range, and a plain click resets to a single node. The root's `value` then lists every selected node, in the order they were selected, and the selection path renders one trail each."}
          elementsPreview={glyphPreview}
          caption={"`selectionMode=\"multiple\"` lets several nodes be selected at once — `Ctrl`/`Cmd`+click adds or removes one, `Shift`+click selects a contiguous range, and a plain click resets to a single node. Seed it with `defaultSelectedValues`. `Tree.SelectionPath` then renders one trail per selected node."}
          code={(_density, mode) => {
            if (mode === "elements") return elementsTree({ multiple: true, value: ["index.ts", "app.tsx"] });
            const p = partNamer(mode, "Tree");
            return [
              imports(mode),
              ``,
              `<${p("Root")}`,
              `  selectionMode="multiple"`,
              `  defaultExpandedValues={["src"]}`,
              `  defaultSelectedValues={["index.ts", "app.tsx"]}`,
              `>`,
              ...treeBody(mode),
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <Tree
                selectionMode="multiple"
                defaultExpandedValues={["src"]}
                defaultSelectedValues={["index.ts", "app.tsx"]}
              >
                <TreeNodes nodes={FILE_TREE} />
              </Tree>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "controlled",
      title: "Controlled",
      render: () => (
        <InteractiveExample
          elementsCaption={"The root's attributes are the state: set `expanded` and `value` from the server, in markup, or through the properties of the same name, to drive the tree from elsewhere \u2014 the Expand all / Collapse all buttons here. Listen for `primitiv-tree-change` (`detail.value`) and `primitiv-tree-expanded-change` (`detail.expanded`) to follow the user; each fires before the change applies and is cancelable, so `preventDefault()` keeps the tree as it is."}
          elementsPreview={controlledElementsPreview}
          wire={wireControlled}
          caption="Pass `expandedValues` / `onExpandedChange` and `selectedValue` / `onSelectedValueChange` and the parent owns the state — needed to drive expansion from elsewhere (the Expand all / Collapse all buttons here), to persist it, or to react to selection. Expansion and selection are independent axes, each controlled or uncontrolled on its own: mix a controlled selection with an uncontrolled `defaultExpandedValues` if that is all you need. `selectedValue`/`selectedValues` is only for the matching `selectionMode` — the two shapes are mutually exclusive."
          code={(_density, mode) => {
            if (mode === "elements") return [
                `<!-- The attributes are the state: set them, and listen to follow the user. -->`,
                `<primitiv-tree class="primitiv-tree primitiv-tree--md" expanded="src" value="index.ts">`,
                `  <!-- ... the same branches and items ... -->`,
                `</primitiv-tree>`,
                ``,
                `<script type="module">`,
                `  const tree = document.querySelector("primitiv-tree");`,
                `  tree.addEventListener("primitiv-tree-change", (event) => {`,
                `    console.log(event.detail.value); // preventDefault() vetoes it`,
                `  });`,
                `  expandAll.addEventListener("click", () => (tree.expanded = "src components public"));`,
                `  collapseAll.addEventListener("click", () => (tree.expanded = ""));`,
                `</script>`,
              ].join("\n");
            const p = partNamer(mode, "Tree");
            return [
              `import { useState } from "react";`,
              imports(mode),
              `import { Button } from "@/components/ui/button";`,
              ``,
              `const [expanded, setExpanded] = useState(["src"]);`,
              `const [selected, setSelected] = useState("index.ts");`,
              ``,
              `<Button onClick={() => setExpanded(["src", "components", "public"])}>Expand all</Button>`,
              `<Button onClick={() => setExpanded([])}>Collapse all</Button>`,
              ``,
              `<${p("Root")}`,
              `  expandedValues={expanded}`,
              `  onExpandedChange={setExpanded}`,
              `  selectedValue={selected}`,
              `  onSelectedValueChange={setSelected}`,
              `>`,
              ...treeBody(mode),
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => <ControlledExample />}
        </InteractiveExample>
      ),
    },
    {
      id: "disabled",
      title: "Disabled nodes",
      render: () => (
        <InteractiveExample
          elementsCaption={"`disabled` on a `<primitiv-tree-item>` or `<primitiv-tree-branch>` sets `aria-disabled` and stops it taking selection or (for a branch) toggling \u2014 but it stays in the roving order, so a keyboard user still finds it, and `Home`/`End` land on enabled neighbours. A disabled branch does **not** disable its children."}
          elementsPreview={glyphPreview}
          caption="`disabled` on a `Tree.Item` or `Tree.Branch` dims it and stops it taking selection or (for a branch) toggling — but it stays in the DOM and in the roving order, so a keyboard user still finds it, and `Home`/`End` land on non-disabled neighbours. A disabled branch keeps its children rendered and does **not** disable them."
          code={(_density, mode) => {
            if (mode === "elements") return elementsTree({
                nodes: [
                  { value: "src", label: "src", children: [{ value: "index.ts", label: "index.ts" }, { value: "app.tsx", label: "app.tsx", disabled: true }] },
                  { value: "public", label: "public", disabled: true, children: [{ value: "favicon.ico", label: "favicon.ico" }] },
                  { value: "README.md", label: "README.md" },
                ],
              });
            const p = partNamer(mode, "Tree");
            return [
              imports(mode),
              ``,
              `<${p("Root")} defaultExpandedValues={["src"]}>`,
              `  <${p("Branch")} value="src" label="src">`,
              `    <${p("BranchControl")}><${p("BranchIndicator")} />src</${p("BranchControl")}>`,
              `    <${p("BranchContent")}>`,
              `      <${p("Item")} value="index.ts" label="index.ts">index.ts</${p("Item")}>`,
              `      <${p("Item")} value="app.tsx" label="app.tsx" disabled>app.tsx</${p("Item")}>`,
              `    </${p("BranchContent")}>`,
              `  </${p("Branch")}>`,
              `  <${p("Branch")} value="public" label="public" disabled>`,
              `    <${p("BranchControl")}><${p("BranchIndicator")} />public</${p("BranchControl")}>`,
              `    <${p("BranchContent")}>{/* still rendered, not disabled */}</${p("BranchContent")}>`,
              `  </${p("Branch")}>`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <Tree defaultExpandedValues={["src"]} defaultSelectedValue="index.ts">
                <TreeBranch value="src" label="src">
                  <TreeBranchControl>
                    <TreeBranchIndicator />
                    src
                  </TreeBranchControl>
                  <TreeBranchContent>
                    <TreeItem value="index.ts" label="index.ts">
                      index.ts
                    </TreeItem>
                    <TreeItem value="app.tsx" label="app.tsx" disabled>
                      app.tsx
                    </TreeItem>
                  </TreeBranchContent>
                </TreeBranch>
                <TreeBranch value="public" label="public" disabled>
                  <TreeBranchControl>
                    <TreeBranchIndicator />
                    public
                  </TreeBranchControl>
                  <TreeBranchContent>
                    <TreeItem value="favicon.ico" label="favicon.ico">
                      favicon.ico
                    </TreeItem>
                  </TreeBranchContent>
                </TreeBranch>
                <TreeItem value="README.md" label="README.md">
                  README.md
                </TreeItem>
              </Tree>
            </div>
          )}
        </InteractiveExample>
      ),
    },
  ],

  elements: {
    description:
      "A hierarchical list of nodes — a file tree, a nested outline — that a user expands, collapses and selects from. Seven custom elements over the WAI-ARIA tree view, authored as nested markup: a single tab stop, arrow keys over the visible rows, single or multiple selection, and an optional breadcrumb of the selected node's ancestry.",
    anatomyMeta:
      "Seven elements, nested as the tree is. `<primitiv-tree>` is the `tree` and holds the state in two attributes: `expanded` (the open branches) and `value` (the selection). A **branch** is a `<primitiv-tree-branch>` holding a `<primitiv-tree-branch-control>` (its row, with a `<primitiv-tree-branch-indicator>` for the chevron) and a `<primitiv-tree-branch-content>` (the group of its children). A **leaf** is a `<primitiv-tree-item>`. `<primitiv-tree-selection-path>` is optional and stamps a Breadcrumb from its `<template>`. The `__item-spacer`, `__*-label` and `__branch-content-inner`/`-body` spans are styling-only and drop out of the headless markup.",
    accessibility: [
      "The root gets `role=\"tree\"` (and `aria-multiselectable` in multiple mode); each row is a `treeitem` with `aria-level`, `aria-selected`, and `aria-expanded` on branches. A branch's row is the `treeitem`, labelled from its control, and its content is the `group`.",
      "The rows share **one tab stop**. Tab moves into the tree and out again; the arrows, Home and End move between visible rows, and Left / Right collapse and expand.",
      "`disabled` sets `aria-disabled` and stops a node taking selection or toggling, but it stays in the roving order so a keyboard user can still find it.",
      "A collapsed group gets `hidden` and `aria-hidden`, so a screen reader never reads a subtree that looks closed. With `force-mount` it stays rendered for the stylesheet to animate, and `aria-hidden` still hides it. Write `hidden` in your markup so nothing shows before the script loads.",
      "The indicator is decorative (`aria-hidden`), since `aria-expanded` already announces the state.",
      "Every user change fires a cancelable `primitiv-tree-change` or `primitiv-tree-expanded-change` first. A missing `value` or a misplaced part is reported once in the console and left alone; nothing throws, because a server-rendered page has no error boundary.",
      "The selection path is a Breadcrumb `nav`; the current node is set apart by weight as well as colour.",
    ],
  },

  accessibility: [
    "The Root is a `role=\"tree\"`; each row is a `treeitem` carrying `aria-level`, `aria-selected`, and `aria-expanded` on branches — the WAI-ARIA tree view, so a screen reader announces the depth, the open/closed state and the selection.",
    "The rows share **one tab stop**. Tab moves into the tree and then out of it; the arrow keys, Home and End move between rows, and left/right collapse and expand. A tree of real controls would make a keyboard user Tab through every node — the roving tabindex is what the pattern requires instead.",
    "`disabled` rows stay in the DOM and in the roving order, so they remain discoverable by keyboard; they only stop taking selection and pointer events. A control a keyboard user cannot reach is one they never learn exists.",
    "`Tree.BranchIndicator` is decorative (`aria-hidden`) — the expanded state is announced through `aria-expanded` on the branch, so a labelled chevron would say it twice.",
    "A collapsed `Tree.BranchContent` is hidden from assistive technology (`aria-hidden`) even though it stays mounted to animate, so a screen reader never reads a subtree that looks closed.",
    "`Tree.SelectionPath` composes `Breadcrumb`, inheriting its navigation semantics; the current node is distinguished by **both** weight and colour, since colour alone is easy to miss at the small end of the size ramp.",
  ],
};

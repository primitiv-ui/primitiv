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
    "The rows share a **single tab stop** (a roving tabindex), and movement runs over the *visible* rows in depth-first order — collapsed subtrees and disabled nodes are skipped. `Home`/`End` still land on non-disabled neighbours. This is the WAI-ARIA tree pattern, mirrored under `dir=\"rtl\"`.",

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
          caption="The canonical shape: `Tree.Branch`es and `Tree.Item` leaves, authored recursively. `defaultExpandedValues` seeds which branches start open and `defaultSelectedValue` which node starts selected (single selection is the default). Every node needs a `value` unique within the tree; `label` feeds the node registry that `Tree.SelectionPath` reads. The `Tree.BranchIndicator` needs no icon — it ships its own chevron and the stylesheet rotates it open."
          code={(_density, mode) => {
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
          caption="`Tree.SelectionPath` renders a breadcrumb of the selected node's root-to-leaf ancestry — the editor path bar. It reads the selection from context, so it needs no props beyond its `size`, and it composes the `Breadcrumb` component (installed with the tree). Select a node below and watch the trail update; the current node is marked by weight. Its `size` is the **tree's** size and maps one tier down, so the bar reads compact beside the rows."
          code={(_density, mode) => {
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
          caption={"`selectionMode=\"multiple\"` lets several nodes be selected at once — `Ctrl`/`Cmd`+click adds or removes one, `Shift`+click selects a contiguous range, and a plain click resets to a single node. Seed it with `defaultSelectedValues`. `Tree.SelectionPath` then renders one trail per selected node."}
          code={(_density, mode) => {
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
          caption="Pass `expandedValues` / `onExpandedChange` and `selectedValue` / `onSelectedValueChange` and the parent owns the state — needed to drive expansion from elsewhere (the Expand all / Collapse all buttons here), to persist it, or to react to selection. Expansion and selection are independent axes, each controlled or uncontrolled on its own: mix a controlled selection with an uncontrolled `defaultExpandedValues` if that is all you need. `selectedValue`/`selectedValues` is only for the matching `selectionMode` — the two shapes are mutually exclusive."
          code={(_density, mode) => {
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
          caption="`disabled` on a `Tree.Item` or `Tree.Branch` dims it and stops it taking selection or (for a branch) toggling — but it stays in the DOM and in the roving order, so a keyboard user still finds it, and `Home`/`End` land on non-disabled neighbours. A disabled branch keeps its children rendered and does **not** disable them."
          code={(_density, mode) => {
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

  accessibility: [
    "The Root is a `role=\"tree\"`; each row is a `treeitem` carrying `aria-level`, `aria-selected`, and `aria-expanded` on branches — the WAI-ARIA tree view, so a screen reader announces the depth, the open/closed state and the selection.",
    "The rows share **one tab stop**. Tab moves into the tree and then out of it; the arrow keys, Home and End move between rows, and left/right collapse and expand. A tree of real controls would make a keyboard user Tab through every node — the roving tabindex is what the pattern requires instead.",
    "`disabled` rows stay in the DOM and in the roving order, so they remain discoverable by keyboard; they only stop taking selection and pointer events. A control a keyboard user cannot reach is one they never learn exists.",
    "`Tree.BranchIndicator` is decorative (`aria-hidden`) — the expanded state is announced through `aria-expanded` on the branch, so a labelled chevron would say it twice.",
    "A collapsed `Tree.BranchContent` is hidden from assistive technology (`aria-hidden`) even though it stays mounted to animate, so a screen reader never reads a subtree that looks closed.",
    "`Tree.SelectionPath` composes `Breadcrumb`, inheriting its navigation semantics; the current node is distinguished by **both** weight and colour, since colour alone is easy to miss at the small end of the size ramp.",
  ],
};

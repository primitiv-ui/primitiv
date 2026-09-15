"use client";

import { useMemo, useState } from "react";

import { useMillerColumnsSelection } from "@primitiv-ui/react";

import {
  MillerColumns,
  MillerColumnsColumn,
  MillerColumnsItem,
  MillerColumnsItemIndicator,
  MillerColumnsPreviewPanel,
  MillerColumnsResizeHandle,
} from "@/components/miller-columns";
import { contractAttr, importBlock, partNamer } from "@/lib/playground";
import { InteractiveExample } from "@/site/InteractiveExample";
import type { Mode } from "@/site/preferences";
import type { ComponentSpec } from "./types";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

type FileNode = { id: string; label: string; meta?: string; children?: FileNode[] };

const TREE: FileNode[] = [
  {
    id: "documents",
    label: "Documents",
    children: [
      {
        id: "work",
        label: "Work",
        children: [
          { id: "report", label: "report.pdf", meta: "PDF document · 248 KB" },
          { id: "budget", label: "budget.xlsx", meta: "Spreadsheet · 62 KB" },
          { id: "notes", label: "notes.txt", meta: "Plain text · 4 KB" },
        ],
      },
      {
        id: "personal",
        label: "Personal",
        children: [{ id: "taxes", label: "taxes.pdf", meta: "PDF document · 1.2 MB" }],
      },
    ],
  },
  {
    id: "pictures",
    label: "Pictures",
    children: [
      { id: "logo", label: "logo.png", meta: "Image · 88 KB" },
      // A branch with no children — selecting it opens an empty column.
      { id: "archive", label: "Archive", children: [] },
    ],
  },
  {
    id: "music",
    label: "Music",
    children: [{ id: "playlist", label: "playlist.m3u", meta: "Playlist · 2 KB" }],
  },
  { id: "readme", label: "README.md", meta: "Markdown · 6 KB" },
];

/** Flat id → node lookup, for the preview pane and the controlled path readout. */
const INDEX = new Map<string, FileNode>();
(function index(nodes: FileNode[]) {
  for (const n of nodes) {
    INDEX.set(n.id, n);
    if (n.children) index(n.children);
  }
})(TREE);

/**
 * One node, rendered recursively. An item becomes a *branch* by nesting a
 * `MillerColumnsColumn` among its children (even an empty one, like Archive);
 * an item with no nested column is a *leaf*. Child columns are written nested
 * but projected into the strip so they sit side by side.
 */
const Node = ({ node }: { node: FileNode }) => (
  <MillerColumnsItem value={node.id}>
    {node.label}
    {node.children ? (
      <>
        <MillerColumnsItemIndicator />
        <MillerColumnsColumn>
          <MillerColumnsResizeHandle
            aria-label={`Resize ${node.label}`}
            minWidth={140}
            maxWidth={320}
          />
          {node.children.map((child) => (
            <Node key={child.id} node={child} />
          ))}
        </MillerColumnsColumn>
      </>
    ) : null}
  </MillerColumnsItem>
);

/** Reads the selection itself — the pane only mounts for a selected leaf. */
const FilePreview = () => {
  const { selectedValue } = useMillerColumnsSelection();
  const node = selectedValue ? INDEX.get(selectedValue) : undefined;
  if (!node) return null;
  return (
    <div style={{ display: "grid", gap: "0.25rem", textAlign: "center" }}>
      <strong>{node.label}</strong>
      {node.meta && <span className="docs-prop-description">{node.meta}</span>}
    </div>
  );
};

const PARTS = ["Column", "Item", "ItemIndicator", "ResizeHandle"] as const;

const imports = (mode: Mode, parts: readonly string[] = PARTS) =>
  importBlock({ mode, component: "MillerColumns", componentId: "miller-columns", parts });

/**
 * The recursive `Node` helper + the root strip, in the current mode's spelling —
 * shared by the playground and most examples, which differ only in the root's
 * props and whether a preview pane follows.
 */
const compositionLines = (
  mode: Mode,
  { rootAttrs = "", preview = false }: { rootAttrs?: string; preview?: boolean } = {},
) => {
  const p = partNamer(mode, "MillerColumns");
  return [
    `function Node({ node }) {`,
    `  return (`,
    `    <${p("Item")} value={node.id}>`,
    `      {node.label}`,
    `      {node.children ? (`,
    `        <>`,
    `          <${p("ItemIndicator")} />`,
    `          <${p("Column")}>`,
    `            <${p("ResizeHandle")} aria-label={\`Resize \${node.label}\`} />`,
    `            {node.children.map((child) => <Node key={child.id} node={child} />)}`,
    `          </${p("Column")}>`,
    `        </>`,
    `      ) : null}`,
    `    </${p("Item")}>`,
    `  );`,
    `}`,
    ``,
    `<${p("Root")} aria-label="Files"${rootAttrs}>`,
    `  <${p("Column")}>`,
    `    <${p("ResizeHandle")} aria-label="Resize column" minWidth={140} maxWidth={320} />`,
    `    {tree.map((node) => <Node key={node.id} node={node} />)}`,
    `  </${p("Column")}>`,
    ...(preview ? [`  <${p("PreviewPanel")}><FilePreview /></${p("PreviewPanel")}>`] : []),
    `</${p("Root")}>`,
  ];
};

/** The controlled example's live half — owns the selection path and shows it. */
const ControlledExample = () => {
  const [path, setPath] = useState<string[]>(["documents", "work"]);
  const trail = useMemo(
    () => path.map((id) => INDEX.get(id)?.label ?? id).join(" › "),
    [path],
  );
  return (
    <div className="docs-example-stack" style={{ inlineSize: "100%" }}>
      <p className="docs-prop-description">Path: {trail || "nothing selected"}</p>
      <MillerColumns aria-label="Files" value={path} onValueChange={setPath}>
        <MillerColumnsColumn>
          <MillerColumnsResizeHandle aria-label="Resize column" minWidth={140} maxWidth={320} />
          {TREE.map((node) => (
            <Node key={node.id} node={node} />
          ))}
        </MillerColumnsColumn>
      </MillerColumns>
    </div>
  );
};

/**
 * Miller Columns' page content.
 *
 * The macOS Finder column view — a horizontal strip of vertical lists where
 * selecting a node reveals its children in the next column. Authored by
 * recursive composition, not a data prop; the keyboard model (into-child /
 * to-parent) and the resize splitter are the primitive's, so a keyboard
 * section earns its place.
 */
export const millerColumnsSpec: ComponentSpec = {
  playground: {
    component: "MillerColumns",
    snippet: (values, mode) => {
      const size = contractAttr({ mode, prop: "size", value: values.size });
      return [
        imports(mode),
        ``,
        ...compositionLines(mode, { rootAttrs: `${size} defaultValue={["documents", "work"]}` }),
      ].join("\n");
    },
    fill: true,
    render: (values) => (
      <div style={{ inlineSize: "100%" }}>
        <MillerColumns
          size={values.size as Size}
          aria-label="Files"
          defaultValue={["documents", "work"]}
        >
          <MillerColumnsColumn>
            <MillerColumnsResizeHandle aria-label="Resize column" minWidth={140} maxWidth={320} />
            {TREE.map((node) => (
              <Node key={node.id} node={node} />
            ))}
          </MillerColumnsColumn>
        </MillerColumns>
      </div>
    ),
  },

  anatomyMeta:
    "Six parts, authored recursively — there is no `data` prop. A `MillerColumns.Item` becomes a **branch** by nesting a `MillerColumns.Column` among its children (with a `MillerColumns.ItemIndicator` chevron and a `MillerColumns.ResizeHandle`); an item with no nested column is a **leaf**. Every column is projected into the strip so they sit side by side. `MillerColumns.PreviewPanel` is an optional trailing pane — a sibling of the tree (a `role=\"tree\"` may own only tree items), whose content you supply and drive from `useMillerColumnsSelection`.",

  anatomy: [
    {
      label: "Parts",
      code: (mode) => {
        const p = partNamer(mode, "MillerColumns");
        return [
          `<${p("Root")}>`,
          `  <${p("Column")}>`,
          `    <${p("ResizeHandle")} />`,
          `    <${p("Item")}>          {/* a leaf */}`,
          `    <${p("Item")}>          {/* a branch: */}`,
          `      <${p("ItemIndicator")} />`,
          `      <${p("Column")}>...</${p("Column")}>   {/* projected beside its parent */}`,
          `    </${p("Item")}>`,
          `  </${p("Column")}>`,
          `  <${p("PreviewPanel")} />   {/* optional trailing pane */}`,
          `</${p("Root")}>`,
        ].join("\n");
      },
    },
  ],

  keyboardMeta:
    "The rows share a **single tab stop** (a roving tabindex). Movement is within the focused column, and the horizontal arrows step between columns — into a branch's child column and back to its parent — the WAI-ARIA tree model, mirrored under `dir=\"rtl\"`. Selection is single only: the selection *is* the path, so each column exists because exactly one item in the column before it is chosen. The `MillerColumns.ResizeHandle` is a **separate** WAI-ARIA window splitter — focus it and the arrow keys resize the column (bounded by `minWidth` / `maxWidth`, stepped by `step`).",

  keyboard: [
    {
      keys: ["ArrowDown", "ArrowUp"],
      behaviour: "Move focus within the current column.",
    },
    { keys: ["Home", "End"], behaviour: "Focus the first / last item in the column." },
    {
      keys: ["ArrowRight"],
      behaviour: "Open a branch and step into its child column. A no-op on a leaf.",
    },
    { keys: ["ArrowLeft"], behaviour: "Return focus to the parent column." },
    { keys: ["Enter", "Space"], behaviour: "Select the focused item." },
    {
      keys: ["character"],
      literal: true,
      behaviour: "Typeahead — jump to the next item in the column whose label starts with the typed characters.",
    },
  ],

  examples: [
    {
      id: "file-browser",
      title: "A file browser",
      render: () => (
        <InteractiveExample
          caption="The canonical column view: selecting a folder reveals its contents in the next column. The tree is authored by **recursive composition** — an item is a branch when it nests a `MillerColumns.Column`, a leaf when it does not (`Archive` nests an empty column, so it opens a blank one). `defaultValue` is the selection **path** — an array of ids, root first. Every column carries a `MillerColumns.ResizeHandle`: drag the seam between columns, or focus it and use the arrow keys."
          code={(_density, mode) =>
            [imports(mode), ``, ...compositionLines(mode, { rootAttrs: ` defaultValue={["documents", "work"]}` })].join("\n")
          }
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <MillerColumns aria-label="Files" defaultValue={["documents", "work"]}>
                <MillerColumnsColumn>
                  <MillerColumnsResizeHandle aria-label="Resize column" minWidth={140} maxWidth={320} />
                  {TREE.map((node) => (
                    <Node key={node.id} node={node} />
                  ))}
                </MillerColumnsColumn>
              </MillerColumns>
            </div>
          )}
        </InteractiveExample>
      ),
    },
    {
      id: "preview-pane",
      title: "With a preview pane",
      render: () => (
        <InteractiveExample
          caption={"Add a `MillerColumns.PreviewPanel` after the columns and it fills the strip's remaining width — Finder's rightmost pane. It is content-agnostic: read the current selection with `useMillerColumnsSelection` (from the headless package — the registry surface does not re-export it) and render whatever the selection warrants. The pane mounts for a selected leaf, so drill into a file to see it. Select `Documents › Work › report.pdf`."}
          code={(_density, mode) => {
            const p = partNamer(mode, "MillerColumns");
            return [
              imports(mode, ["Column", "Item", "ItemIndicator", "ResizeHandle", "PreviewPanel"]),
              `import { useMillerColumnsSelection } from "@primitiv-ui/react";`,
              ``,
              `function FilePreview() {`,
              `  const { selectedValue } = useMillerColumnsSelection();`,
              `  const node = selectedValue ? lookup(selectedValue) : undefined;`,
              `  if (!node) return null;`,
              `  return <FileCard node={node} />;`,
              `}`,
              ``,
              ...compositionLines(mode, { rootAttrs: ` defaultValue={["documents", "work"]}`, preview: true }),
            ].join("\n");
          }}
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <MillerColumns aria-label="Files" defaultValue={["documents", "work"]}>
                <MillerColumnsColumn>
                  <MillerColumnsResizeHandle aria-label="Resize column" minWidth={140} maxWidth={320} />
                  {TREE.map((node) => (
                    <Node key={node.id} node={node} />
                  ))}
                </MillerColumnsColumn>
                <MillerColumnsPreviewPanel>
                  <FilePreview />
                </MillerColumnsPreviewPanel>
              </MillerColumns>
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
          caption="Pass `value` and `onValueChange` and the parent owns the selection **path** (an array of ids, root first) — needed to drive a breadcrumb elsewhere, deep-link into a folder, or persist where the user was. `onValueChange` fires with the full new path on every change. Omit `value` (or pass `defaultValue`) for the uncontrolled form. There is no multi-select: the selection is the path, so a column can have only one chosen item."
          code={(_density, mode) => {
            const p = partNamer(mode, "MillerColumns");
            return [
              imports(mode),
              `import { useState } from "react";`,
              ``,
              `const [path, setPath] = useState(["documents", "work"]);`,
              ``,
              `<${p("Root")} aria-label="Files" value={path} onValueChange={setPath}>`,
              `  <${p("Column")}>`,
              `    <${p("ResizeHandle")} aria-label="Resize column" />`,
              `    {tree.map((node) => <Node key={node.id} node={node} />)}`,
              `  </${p("Column")}>`,
              `</${p("Root")}>`,
            ].join("\n");
          }}
        >
          {() => <ControlledExample />}
        </InteractiveExample>
      ),
    },
  ],

  accessibility: [
    "`MillerColumns.Root` renders the scroll strip and, inside it, the `role=\"tree\"` widget that holds the columns — so `aria-label` / `aria-labelledby` land on the inner tree, which is what names the widget. Each item is a `role=\"treeitem\"` carrying `aria-level` and `aria-expanded`.",
    "The rows share **one tab stop**. Tab moves into the widget and then out of it; the arrow keys move within and between columns (right steps into a branch, left back to the parent). A grid of focusable rows would make a keyboard user Tab through everything — the roving tabindex is the tree pattern's answer.",
    "`MillerColumns.ResizeHandle` is a WAI-ARIA window splitter with `aria-valuemin` / `aria-valuemax` / `aria-valuenow` — **give it an `aria-label`**, or it announces as an unnamed separator. It is operable by both pointer drag and the keyboard.",
    "`MillerColumns.ItemIndicator` is a decorative `aria-hidden` chevron — the branch state is announced through `aria-expanded`, so a labelled chevron would say it twice.",
    "The `MillerColumns.PreviewPanel` sits **outside** the `role=\"tree\"` (a tree may own only tree items and groups), so its content is not announced as part of the tree. Drive it from `useMillerColumnsSelection` and give it its own structure and labelling.",
    "Related: reach for [Tree](/components/tree/) when the hierarchy should show its depth in one vertical list rather than a strip of columns. Miller Columns is the wide, drill-in view where each level gets its own column.",
  ],
};

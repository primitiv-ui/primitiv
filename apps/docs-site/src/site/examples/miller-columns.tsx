"use client";

import { useState } from "react";

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

type FileNode = { id: string; label: string; meta?: string; image?: string; children?: FileNode[] };

/** An inline SVG "photo", so an image preview needs no asset and works offline. */
const photo = (top: string, bottom: string, sun: string, hill: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 200'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${top}'/><stop offset='1' stop-color='${bottom}'/></linearGradient></defs><rect width='320' height='200' fill='url(#g)'/><circle cx='250' cy='58' r='30' fill='${sun}'/><path d='M0 200 L95 120 L165 165 L245 110 L320 175 L320 200 Z' fill='${hill}'/></svg>`,
  )}`;

const PHOTOS = {
  beach: photo("#38bdf8", "#bae6fd", "#fde68a", "#166534"),
  sunset: photo("#f59e0b", "#7c2d12", "#fef3c7", "#3f1d0b"),
  logo: photo("#7c3aed", "#ec4899", "#f5d0fe", "#4c1d95"),
  cover: photo("#0ea5e9", "#6366f1", "#e0f2fe", "#1e3a8a"),
  wallpaper: photo("#16a34a", "#065f46", "#bbf7d0", "#052e16"),
};

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
      {
        id: "vacation",
        label: "Vacation",
        children: [
          { id: "beach", label: "beach.jpg", meta: "JPEG image · 1.8 MB", image: PHOTOS.beach },
          { id: "sunset", label: "sunset.jpg", meta: "JPEG image · 2.1 MB", image: PHOTOS.sunset },
        ],
      },
      { id: "logo", label: "logo.png", meta: "PNG image · 88 KB", image: PHOTOS.logo },
      // A branch with no children — selecting it opens an empty column.
      { id: "archive", label: "Archive", children: [] },
    ],
  },
  {
    id: "music",
    label: "Music",
    children: [{ id: "playlist", label: "playlist.m3u", meta: "Playlist · 2 KB" }],
  },
  { id: "cover", label: "cover.jpg", meta: "JPEG image · 1.4 MB", image: PHOTOS.cover },
  { id: "wallpaper", label: "wallpaper.png", meta: "PNG image · 3.2 MB", image: PHOTOS.wallpaper },
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

/** Reads the selection itself — the pane only mounts for a selected leaf, and
 *  shows the file's image when it has one (the pane is content-agnostic). */
const FilePreview = () => {
  const { selectedValue } = useMillerColumnsSelection();
  const node = selectedValue ? INDEX.get(selectedValue) : undefined;
  if (!node) return null;
  return (
    <div style={{ display: "grid", gap: "0.5rem", justifyItems: "center", textAlign: "center" }}>
      {node.image && (
        <img
          src={node.image}
          alt=""
          style={{ inlineSize: "100%", maxInlineSize: "12rem", borderRadius: "0.5rem", display: "block" }}
        />
      )}
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

/** The `FilePreview` snippet — mode-independent consumer code, shared by the
 *  playground and the Preview pane example. It shows the file's image when it
 *  has one; the pane is content-agnostic, so this is entirely yours. */
const filePreviewLines = () => [
  `// nodeById: your own Map<id, node>, built from the tree data you render.`,
  `function FilePreview() {`,
  `  const { selectedValue } = useMillerColumnsSelection();`,
  `  const node = selectedValue ? nodeById.get(selectedValue) : undefined;`,
  `  if (!node) return null;`,
  `  return (`,
  `    <div>`,
  `      {node.image && <img src={node.image} alt="" />}`,
  `      <strong>{node.label}</strong>`,
  `      <span>{node.meta}</span>`,
  `    </div>`,
  `  );`,
  `}`,
];

/**
 * The selection-path example's live half. The selection IS the path, so a
 * controlled `value` gives you the full root-to-leaf trail directly — rendered
 * here as a breadcrumb whose crumbs navigate back up when clicked.
 */
const SelectionPathExample = () => {
  const [path, setPath] = useState<string[]>(["documents", "work", "report"]);
  return (
    <div className="docs-example-stack" style={{ inlineSize: "100%" }}>
      <nav
        aria-label="File path"
        style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.375rem" }}
      >
        {path.length === 0 ? (
          <span className="docs-prop-description">Nothing selected</span>
        ) : (
          path.map((id, i) => (
            <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
              {i > 0 && (
                <span aria-hidden="true" className="docs-prop-description">
                  ›
                </span>
              )}
              <button
                type="button"
                onClick={() => setPath(path.slice(0, i + 1))}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  font: "inherit",
                  cursor: "pointer",
                  color: "inherit",
                  fontWeight: i === path.length - 1 ? 600 : 400,
                }}
              >
                {INDEX.get(id)?.label ?? id}
              </button>
            </span>
          ))
        )}
      </nav>
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


// ── Elements (RFC 0033) ──────────────────────────────────────────────────────

/** The chevron the styled ItemIndicator draws, sized so the headless form stays small. */
const CHEVRON =
  `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true"><path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>`;

/**
 * The same tree as Elements markup: the `<primitiv-miller-columns>` elements,
 * in the shape `primitiv add miller-columns --surface elements` prints. Columns
 * are written as siblings — each after the first names its branch with
 * `parent` — and the markup is server-correct: a column off the path, and the
 * preview panel unless the path ends on a file, are already `hidden`.
 */
const elementsStrip = ({
  size = "md",
  value = [],
  preview,
}: {
  size?: string;
  value?: readonly string[];
  /** The preview panel's content, or none. */
  preview?: string;
} = {}) => {
  const open = new Set<string | null>([null, ...value]);
  const columns: string[] = [];
  const column = (nodes: FileNode[], parent: FileNode | null) => {
    const shown = open.has(parent?.id ?? null);
    columns.push(
      `    <primitiv-miller-columns-column${parent ? ` parent="${parent.id}"` : ""} class="primitiv-miller-columns__column"${shown ? "" : " hidden"}>`,
      `      <primitiv-miller-columns-resize-handle aria-label="${parent ? `Resize ${parent.label}` : "Resize column"}" min-width="140" max-width="320" class="primitiv-miller-columns__resize-handle"></primitiv-miller-columns-resize-handle>`,
      ...nodes.flatMap((node) => [
        `      <primitiv-miller-columns-item value="${node.id}" class="primitiv-miller-columns__item">`,
        `        <span class="primitiv-miller-columns__item-label">${node.label}</span>`,
        ...(node.children
          ? [`        <primitiv-miller-columns-item-indicator class="primitiv-miller-columns__item-indicator">${CHEVRON}</primitiv-miller-columns-item-indicator>`]
          : []),
        `      </primitiv-miller-columns-item>`,
      ]),
      `    </primitiv-miller-columns-column>`,
    );
    for (const node of nodes) if (node.children) column(node.children, node);
  };
  column(TREE, null);
  const terminal = value.length ? INDEX.get(value[value.length - 1]) : undefined;
  return [
    `<primitiv-miller-columns value="${value.join(" ")}" class="primitiv-miller-columns primitiv-miller-columns--${size}">`,
    `  <primitiv-miller-columns-tree aria-label="Files">`,
    ...columns,
    `  </primitiv-miller-columns-tree>`,
    ...(preview === undefined
      ? []
      : [
          `  <primitiv-miller-columns-preview-panel class="primitiv-miller-columns__preview"${terminal && !terminal.children ? "" : " hidden"}>`,
          `    ${preview}`,
          `  </primitiv-miller-columns-preview-panel>`,
        ]),
    `</primitiv-miller-columns>`,
  ].join("\n");
};

/** What a file preview shows for `node` — the same as FilePreview renders. */
const previewHtml = (node: FileNode | undefined) =>
  node
    ? `${node.image ? `<img src="${node.image}" alt="" style="inline-size: 100%; max-inline-size: 12rem; border-radius: 0.5rem; display: block">` : ""}<strong>${node.label}</strong>${node.meta ? `<span class="docs-prop-description">${node.meta}</span>` : ""}`
    : "";

/** The preview pane's script, as the code tab prints it. */
const PREVIEW_SCRIPT = [
  `<script type="module">`,
  `  // nodeById: your own Map<id, node>, built from the tree data you render.`,
  `  const strip = document.querySelector("primitiv-miller-columns");`,
  `  const preview = strip.querySelector("[data-file-preview]");`,
  `  strip.addEventListener("primitiv-miller-columns-change", (event) => {`,
  `    const node = nodeById.get(event.detail.value.at(-1));`,
  `    if (!node) return;`,
  `    preview.innerHTML = (node.image ? \`<img src="\${node.image}" alt="">\` : "")`,
  `      + \`<strong>\${node.label}</strong><span>\${node.meta}</span>\`;`,
  `  });`,
  `</script>`,
].join("\n");

/** Keeps the preview pane on the selected file, as the code tab's script does. */
const wirePreview = (root: HTMLElement) => {
  const strip = root.querySelector("primitiv-miller-columns");
  const preview = root.querySelector("[data-file-preview]");
  if (!strip || !preview) return;
  const onChange = (event: Event) => {
    const node = INDEX.get((event as CustomEvent<{ value: string[] }>).detail.value.at(-1) ?? "");
    if (node) preview.innerHTML = previewHtml(node);
  };
  strip.addEventListener("primitiv-miller-columns-change", onChange);
  return () => strip.removeEventListener("primitiv-miller-columns-change", onChange);
};

/** The preview panel's starting content for `value`, wrapped where the script finds it. */
const previewSlot = (value: readonly string[], html = false) =>
  html
    ? `<div data-file-preview style="display: grid; gap: 0.5rem; justify-items: center; text-align: center">${previewHtml(INDEX.get(value[value.length - 1]))}</div>`
    : `<div data-file-preview></div>`;

const PATH_SCRIPT = [
  `<script type="module">`,
  `  // nodeById: your own Map<id, node>, built from the tree data you render.`,
  `  const strip = document.querySelector("primitiv-miller-columns");`,
  `  const trail = document.querySelector("[data-file-path]");`,
  `  const render = (path) => {`,
  `    trail.replaceChildren(...path.map((id, i) => {`,
  `      const crumb = document.createElement("button");`,
  `      crumb.type = "button";`,
  `      crumb.textContent = nodeById.get(id).label;`,
  `      crumb.addEventListener("click", () => {`,
  `        strip.value = path.slice(0, i + 1).join(" ");`,
  `        render(path.slice(0, i + 1));`,
  `      });`,
  `      return crumb;`,
  `    }));`,
  `  };`,
  `  render(strip.value.split(" ").filter(Boolean));`,
  `  strip.addEventListener("primitiv-miller-columns-change", (event) => render(event.detail.value));`,
  `</script>`,
].join("\n");

const PATH_START = ["documents", "work", "report"];

/** Renders the breadcrumb and keeps it on the path, as the code tab's script does. */
const wirePath = (root: HTMLElement) => {
  const strip = root.querySelector<HTMLElement>("primitiv-miller-columns");
  const trail = root.querySelector("[data-file-path]");
  if (!strip || !trail) return;
  const render = (path: string[]) => {
    trail.replaceChildren(
      ...path.map((id, i) => {
        const crumb = document.createElement("button");
        crumb.type = "button";
        crumb.className = "primitiv-button primitiv-button--ghost primitiv-button--sm";
        crumb.textContent = INDEX.get(id)?.label ?? id;
        crumb.addEventListener("click", () => {
          strip.setAttribute("value", path.slice(0, i + 1).join(" "));
          render(path.slice(0, i + 1));
        });
        return crumb;
      }),
    );
  };
  // The attribute, not the property: the preview loads the element on demand,
  // so this can run before <primitiv-miller-columns> is upgraded.
  render((strip.getAttribute("value") ?? "").split(" ").filter(Boolean));
  const onChange = (event: Event) => render((event as CustomEvent<{ value: string[] }>).detail.value);
  strip.addEventListener("primitiv-miller-columns-change", onChange);
  return () => strip.removeEventListener("primitiv-miller-columns-change", onChange);
};

/** A preview fills the card, as the React demos do with their full-width wrapper. */
const filling = (markup: string) => [`<div class="docs-example-stack">`, markup, `</div>`].join("\n");

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
      if (mode === "elements")
        return [
          elementsStrip({ size: values.size, value: ["cover"], preview: previewSlot(["cover"]) }),
          ``,
          PREVIEW_SCRIPT,
        ].join("\n");
      const size = contractAttr({ mode, prop: "size", value: values.size });
      return [
        imports(mode, [...PARTS, "PreviewPanel"]),
        `import { useMillerColumnsSelection } from "@primitiv-ui/react";`,
        ``,
        ...filePreviewLines(),
        ``,
        ...compositionLines(mode, {
          rootAttrs: `${size} defaultValue={["cover"]}`,
          preview: true,
        }),
      ].join("\n");
    },
    fill: true,
    elementsPreview: (code) =>
      filling(code.slice(0, code.indexOf("\n\n<script")).replace(previewSlot(["cover"]), previewSlot(["cover"], true))),
    elementsWire: wirePreview,
    render: (values) => (
      <div style={{ inlineSize: "100%" }}>
        <MillerColumns
          size={values.size as Size}
          aria-label="Files"
          defaultValue={["cover"]}
        >
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
    ),
  },

  anatomyMeta:
    "Six parts, authored recursively — there is no `data` prop. A `MillerColumns.Item` becomes a **branch** by nesting a `MillerColumns.Column` among its children (with a `MillerColumns.ItemIndicator` chevron and a `MillerColumns.ResizeHandle`); an item with no nested column is a **leaf**. Every column is projected into the strip so they sit side by side. `MillerColumns.PreviewPanel` is an optional trailing pane — a sibling of the tree (a `role=\"tree\"` may own only tree items), whose content you supply and drive from `useMillerColumnsSelection`.",

  anatomy: [
    {
      label: "Parts",
      code: (mode) => {
        if (mode === "elements")
          return [
            `<primitiv-miller-columns>`,
            `  <primitiv-miller-columns-tree>`,
            `    <primitiv-miller-columns-column>                 <!-- the root column -->`,
            `      <primitiv-miller-columns-resize-handle />`,
            `      <primitiv-miller-columns-item>                 <!-- a leaf -->`,
            `      <primitiv-miller-columns-item>                 <!-- a branch: -->`,
            `        <primitiv-miller-columns-item-indicator />`,
            `      </primitiv-miller-columns-item>`,
            `    </primitiv-miller-columns-column>`,
            `    <primitiv-miller-columns-column parent="…">   <!-- the branch's children, a sibling -->`,
            `  </primitiv-miller-columns-tree>`,
            `  <primitiv-miller-columns-preview-panel />      <!-- optional trailing pane -->`,
            `</primitiv-miller-columns>`,
          ].join("\n");
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
          elementsPreview={(_density, code) => filling(code)}
          elementsCaption="The canonical column view: selecting a folder reveals its contents in the next column. The columns are written **as siblings**: each one after the first names the item it lists the children of with `parent`, and the strip shows the columns on the path and hides the rest (`Archive` has an empty column, so it opens a blank one). `value` on `<primitiv-miller-columns>` is the selection **path** — ids, root first, space-separated. Every column carries a `<primitiv-miller-columns-resize-handle>`: drag the seam between columns, or focus it and use the arrow keys."
          caption="The canonical column view: selecting a folder reveals its contents in the next column. The tree is authored by **recursive composition** — an item is a branch when it nests a `MillerColumns.Column`, a leaf when it does not (`Archive` nests an empty column, so it opens a blank one). `defaultValue` is the selection **path** — an array of ids, root first. Every column carries a `MillerColumns.ResizeHandle`: drag the seam between columns, or focus it and use the arrow keys."
          code={(_density, mode) =>
            mode === "elements"
              ? elementsStrip({ value: ["documents", "work"] })
              : [imports(mode), ``, ...compositionLines(mode, { rootAttrs: ` defaultValue={["documents", "work"]}` })].join("\n")
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
          elementsPreview={() =>
            filling(elementsStrip({ value: ["wallpaper"], preview: previewSlot(["wallpaper"], true) }))
          }
          wire={wirePreview}
          elementsCaption={"Add a `<primitiv-miller-columns-preview-panel>` after the tree and it fills the strip's remaining width — Finder's rightmost pane. The element shows it only while the deepest selected item is a file, and leaves what it shows to you: listen for `primitiv-miller-columns-change`, whose `detail.value` is the new path, and render whatever the selection warrants — here a thumbnail for an image file. Render the starting content in your markup too, so the page is right before the script loads."}
          caption={"Add a `MillerColumns.PreviewPanel` after the columns and it fills the strip's remaining width — Finder's rightmost pane. It is content-agnostic: read the current selection with `useMillerColumnsSelection` (from the headless package — the registry surface does not re-export it) and render whatever the selection warrants — here a thumbnail for an image file. The pane mounts for a selected leaf; pick another file or drill into a folder to see it update (a document shows just its details)."}
          code={(_density, mode) =>
            mode === "elements"
              ? [elementsStrip({ value: ["wallpaper"], preview: previewSlot(["wallpaper"]) }), ``, PREVIEW_SCRIPT].join("\n")
              : [
              imports(mode, ["Column", "Item", "ItemIndicator", "ResizeHandle", "PreviewPanel"]),
              `import { useMillerColumnsSelection } from "@primitiv-ui/react";`,
              ``,
              ...filePreviewLines(),
              ``,
              ...compositionLines(mode, {
                rootAttrs: ` defaultValue={["wallpaper"]}`,
                preview: true,
              }),
            ].join("\n")
          }
        >
          {() => (
            <div style={{ inlineSize: "100%" }}>
              <MillerColumns aria-label="Files" defaultValue={["wallpaper"]}>
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
      id: "selection-path",
      title: "Selection path",
      render: () => (
        <InteractiveExample
          elementsPreview={() =>
            filling(
              [
                `<nav aria-label="File path" data-file-path style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.375rem"></nav>`,
                elementsStrip({ value: PATH_START }),
              ].join("\n"),
            )
          }
          wire={wirePath}
          elementsCaption="The selection **is** the path — ids, root first, in the `value` attribute — so the full root-to-leaf trail is always there to read. That is what you render as a breadcrumb of where the user is; here each crumb navigates back up when clicked, by setting `value`. `primitiv-miller-columns-change` fires with the whole new path on every change, before it applies, and is cancelable. There is no multi-select: the selection is the path, so a column can have only one chosen item."
          caption="The selection **is** the path — an array of ids, root first — so a controlled `value` hands you the full root-to-leaf trail directly (or read it from `useMillerColumnsSelection().path` in an uncontrolled strip). That is what you render as a breadcrumb of where the user is; here each crumb navigates back up when clicked. `onValueChange` fires with the whole new path on every change. There is no multi-select: the selection is the path, so a column can have only one chosen item."
          code={(_density, mode) => {
            if (mode === "elements")
              return [`<nav aria-label="File path" data-file-path></nav>`, ``, elementsStrip({ value: PATH_START }), ``, PATH_SCRIPT].join("\n");
            const p = partNamer(mode, "MillerColumns");
            return [
              imports(mode),
              `import { useState } from "react";`,
              ``,
              `const [path, setPath] = useState(["documents", "work", "report"]);`,
              `// nodeById: your own Map<id, node>, built from the tree data you render.`,
              ``,
              `{/* the path is the value — render it as a breadcrumb */}`,
              `<nav aria-label="File path">`,
              `  {path.map((id, i) => (`,
              `    <button key={id} onClick={() => setPath(path.slice(0, i + 1))}>`,
              `      {nodeById.get(id).label}`,
              `    </button>`,
              `  ))}`,
              `</nav>`,
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
          {() => <SelectionPathExample />}
        </InteractiveExample>
      ),
    },
  ],

  elements: {
    description:
      "A horizontal strip of vertical lists — the macOS Finder column view — where selecting a folder reveals its contents in the next column. `<primitiv-miller-columns>` keeps the selection path in its `value` attribute; the columns are written as siblings, each naming the item it lists the children of with `parent`, so a server can render the whole tree, only the open columns, or send a column when its folder is opened. To load a folder lazily, render its column **empty** up front (`<primitiv-miller-columns-column parent=\"docs\"></primitiv-miller-columns-column>`), since an item is a branch only while a column names it, then fill it when `primitiv-miller-columns-show` fires from that column.",
    anatomyMeta:
      "Seven elements, written flat — no nesting. `<primitiv-miller-columns>` is the strip and holds the path; inside it `<primitiv-miller-columns-tree>` is the `role=\"tree\"` widget holding the columns. Each `<primitiv-miller-columns-column>` after the first names its branch with `parent`; an item is a **branch** while some column names it, a **leaf** otherwise. The root shows the columns on the path and sets `hidden` on the rest. `<primitiv-miller-columns-preview-panel>` is an optional trailing pane beside the tree (a `role=\"tree\"` may own only tree items), whose content is yours.",
    keyboardMeta:
      "The rows share a **single tab stop** (a roving `tabindex`). Movement is within the focused column, and the horizontal arrows step between columns — into a branch's column and back to its parent — the WAI-ARIA tree model, mirrored under `dir=\"rtl\"`. Selection is single only: the selection *is* the path. A `<primitiv-miller-columns-resize-handle>` is a **separate** window splitter — focus it and the arrow keys resize its column (bounded by `min-width` / `max-width`, stepped by `step`).",
    keyboard: [
      { keys: ["ArrowDown", "ArrowUp"], behaviour: "Move focus within the current column." },
      { keys: ["Home", "End"], behaviour: "Focus the first / last item in the column." },
      {
        keys: ["ArrowRight"],
        behaviour: "Open a branch and step into its column. A no-op on a leaf. Under `dir=\"rtl\"`, `ArrowLeft`.",
      },
      { keys: ["ArrowLeft"], behaviour: "Return focus to the parent column. Under `dir=\"rtl\"`, `ArrowRight`." },
      { keys: ["Enter", "Space"], behaviour: "Select the focused item." },
      {
        keys: ["character"],
        literal: true,
        behaviour: "Typeahead — jump to the next item in the column whose text starts with the typed characters.",
      },
    ],
    accessibility: [
      "`<primitiv-miller-columns-tree>` is the `role=\"tree\"` widget, so give it the `aria-label` or `aria-labelledby` that names it. The elements write `role=\"group\"` on each column and `role=\"treeitem\"` with `aria-level`, `aria-selected` and, on a branch, `aria-expanded` on each item.",
      "The rows share **one tab stop**. Tab moves into the widget and then out of it; the arrow keys move within and between columns. A strip of focusable rows would make a keyboard user Tab through everything — the roving `tabindex` is the tree pattern's answer.",
      "A column off the path carries `hidden`. Write it on those columns in your own markup too, so the page is right before the script loads and stays right if it never does.",
      "`<primitiv-miller-columns-resize-handle>` is a WAI-ARIA window splitter with `aria-valuemin` / `aria-valuemax` / `aria-valuenow` — **give it an `aria-label`**, or it announces as an unnamed separator. It is operable by both pointer drag and the keyboard.",
      "`<primitiv-miller-columns-item-indicator>` is decorative and `aria-hidden` — the branch state is announced through `aria-expanded`, so a labelled chevron would say it twice.",
      "The preview panel sits **outside** the `role=\"tree\"`, so its content is not announced as part of the tree. Give it its own structure and labelling.",
      "Related: reach for [Tree](/components/tree/) when the hierarchy should show its depth in one vertical list rather than a strip of columns.",
    ],
  },

  accessibility: [
    "`MillerColumns.Root` renders the scroll strip and, inside it, the `role=\"tree\"` widget that holds the columns — so `aria-label` / `aria-labelledby` land on the inner tree, which is what names the widget. Each item is a `role=\"treeitem\"` carrying `aria-level` and `aria-expanded`.",
    "The rows share **one tab stop**. Tab moves into the widget and then out of it; the arrow keys move within and between columns (right steps into a branch, left back to the parent). A grid of focusable rows would make a keyboard user Tab through everything — the roving tabindex is the tree pattern's answer.",
    "`MillerColumns.ResizeHandle` is a WAI-ARIA window splitter with `aria-valuemin` / `aria-valuemax` / `aria-valuenow` — **give it an `aria-label`**, or it announces as an unnamed separator. It is operable by both pointer drag and the keyboard.",
    "`MillerColumns.ItemIndicator` is a decorative `aria-hidden` chevron — the branch state is announced through `aria-expanded`, so a labelled chevron would say it twice.",
    "The `MillerColumns.PreviewPanel` sits **outside** the `role=\"tree\"` (a tree may own only tree items and groups), so its content is not announced as part of the tree. Drive it from `useMillerColumnsSelection` and give it its own structure and labelling.",
    "Related: reach for [Tree](/components/tree/) when the hierarchy should show its depth in one vertical list rather than a strip of columns. Miller Columns is the wide, drill-in view where each level gets its own column.",
  ],
};

import {
  MillerColumns,
  Modal,
  useMillerColumnsSelection,
} from "@primitiv/react";
import { ChevronRight } from "@primitiv/icons";

import "./MillerColumnsExample.scss";

type FileNode = {
  id: string;
  label: string;
  children?: FileNode[];
};

const tree: FileNode[] = [
  {
    id: "documents",
    label: "Documents",
    children: [
      {
        id: "work",
        label: "Work",
        children: [
          { id: "report", label: "report.pdf" },
          { id: "notes", label: "notes.txt" },
          { id: "budget", label: "budget.xlsx" },
        ],
      },
      {
        id: "personal",
        label: "Personal",
        children: [
          { id: "taxes", label: "taxes.pdf" },
          { id: "letter", label: "letter.docx" },
        ],
      },
      { id: "readme", label: "README.md" },
    ],
  },
  {
    id: "pictures",
    label: "Pictures",
    children: [
      {
        id: "holiday",
        label: "Holiday",
        children: [
          { id: "beach", label: "beach.jpg" },
          { id: "sunset", label: "sunset.jpg" },
        ],
      },
      { id: "profile", label: "profile.png" },
    ],
  },
  {
    id: "music",
    label: "Music",
    children: [{ id: "song", label: "song.mp3" }],
  },
];

const nodeById = new Map<string, FileNode>();

function indexTree(nodes: FileNode[]) {
  for (const node of nodes) {
    nodeById.set(node.id, node);
    if (node.children) {
      indexTree(node.children);
    }
  }
}

indexTree(tree);

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];

function isImageFile(label: string): boolean {
  const lower = label.toLowerCase();
  return IMAGE_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

/** A self-contained, on-the-fly stand-in image so the demo needs no assets. */
function imageDataUri(label: string): string {
  const hue =
    [...label].reduce((sum, character) => sum + character.charCodeAt(0), 0) %
    360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420">
    <rect width="640" height="420" fill="hsl(${hue}, 62%, 56%)"/>
    <rect width="640" height="420" fill="hsl(${(hue + 40) % 360}, 62%, 46%)" opacity="0.45" transform="skewX(-18)"/>
    <text x="320" y="220" font-family="sans-serif" font-size="34" fill="rgba(255,255,255,0.92)" text-anchor="middle">${label}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function Node({ node }: { node: FileNode }) {
  const isDirectory = Boolean(node.children?.length);

  return (
    <MillerColumns.Item value={node.id} className="miller__item">
      <span className="miller__label">{node.label}</span>
      {isDirectory ? (
        <>
          <MillerColumns.ItemIndicator className="miller__chevron">
            <ChevronRight />
          </MillerColumns.ItemIndicator>
          <MillerColumns.Column className="miller__column">
            <MillerColumns.ResizeHandle className="miller__resize" />
            {node.children?.map((child) => (
              <Node key={child.id} node={child} />
            ))}
          </MillerColumns.Column>
        </>
      ) : null}
    </MillerColumns.Item>
  );
}

/**
 * Lives inside the PreviewPanel and reads the current selection itself.
 * The MillerColumns component does not know how to preview a node — that
 * is entirely the consumer's call. Here, an image file gets its name and
 * a button that opens a Modal lightbox.
 */
function FilePreview() {
  const { selectedValue } = useMillerColumnsSelection();
  const node = selectedValue ? nodeById.get(selectedValue) : undefined;

  if (!node) {
    return <p className="miller__preview-hint">Select an item to preview.</p>;
  }

  if (node.children) {
    return (
      <div className="miller__preview-card">
        <strong className="miller__preview-name">{node.label}</strong>
        <span className="miller__preview-meta">
          Folder &middot; {node.children.length} items
        </span>
      </div>
    );
  }

  if (!isImageFile(node.label)) {
    return (
      <div className="miller__preview-card">
        <strong className="miller__preview-name">{node.label}</strong>
        <span className="miller__preview-meta">No preview available</span>
      </div>
    );
  }

  const source = imageDataUri(node.label);

  return (
    <div className="miller__preview-card">
      <strong className="miller__preview-name">{node.label}</strong>
      <span className="miller__preview-meta">Image</span>
      <Modal.Root>
        <Modal.Trigger className="miller__preview-button">
          Preview
        </Modal.Trigger>
        <Modal.Portal>
          <Modal.Content className="miller-lightbox">
            <Modal.Title className="miller-lightbox__title">
              {node.label}
            </Modal.Title>
            <img
              className="miller-lightbox__image"
              src={source}
              alt={node.label}
            />
            <Modal.Close className="miller-lightbox__close">
              Close
            </Modal.Close>
          </Modal.Content>
        </Modal.Portal>
      </Modal.Root>
    </div>
  );
}

export function MillerColumnsExample() {
  return (
    <section className="miller-example">
      <h2>Miller Columns</h2>
      <p>
        Click a folder to reveal its contents in the next column. Drag a
        column's trailing edge to resize it, and select an image file to
        preview it in the trailing panel.
      </p>
      <MillerColumns.Root defaultValue={["pictures"]} className="miller">
        <MillerColumns.Column className="miller__column">
          <MillerColumns.ResizeHandle className="miller__resize" />
          {tree.map((node) => (
            <Node key={node.id} node={node} />
          ))}
        </MillerColumns.Column>
        <MillerColumns.PreviewPanel className="miller__preview">
          <FilePreview />
        </MillerColumns.PreviewPanel>
      </MillerColumns.Root>
    </section>
  );
}

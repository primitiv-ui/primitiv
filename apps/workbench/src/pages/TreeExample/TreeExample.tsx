import { useState } from "react";

import { Tree } from "@primitiv-ui/react";
import { ChevronRight, File, Folder } from "@primitiv-ui/icons";

import "./TreeExample.css";

type SelectionMode = "single" | "multiple";

type SelectionProps =
  | { defaultSelectedValue: string }
  | { selectionMode: "multiple"; defaultSelectedValues: string[] };

export function TreeExample() {
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("single");

  const selectionProps: SelectionProps =
    selectionMode === "single"
      ? { defaultSelectedValue: "readme" }
      : { selectionMode: "multiple", defaultSelectedValues: ["readme"] };

  return (
    <section className="tree-example">
      <header className="tree-example__header">
        <h1>Tree</h1>
        <p>
          A hierarchical tree view authored by recursive composition. Expand
          branches with their row, the chevron, or <kbd>ArrowRight</kbd> /{" "}
          <kbd>ArrowLeft</kbd>. Use <kbd>ArrowUp</kbd> / <kbd>ArrowDown</kbd>{" "}
          and <kbd>Home</kbd> / <kbd>End</kbd> to navigate; <kbd>Enter</kbd> or{" "}
          <kbd>Space</kbd> to activate.
        </p>

        <fieldset className="tree-example__modes">
          <legend>Selection mode</legend>
          <label>
            <input
              type="radio"
              name="tree-mode"
              value="single"
              checked={selectionMode === "single"}
              onChange={() => setSelectionMode("single")}
            />
            Single
          </label>
          <label>
            <input
              type="radio"
              name="tree-mode"
              value="multiple"
              checked={selectionMode === "multiple"}
              onChange={() => setSelectionMode("multiple")}
            />
            Multiple (Ctrl/Cmd + click, Shift + click)
          </label>
        </fieldset>
      </header>

      <div className="tree-example__panel">
        <Tree.Root
          className="tree-example__tree"
          defaultExpandedValues={["src", "components"]}
          {...selectionProps}
        >
          <Tree.Item
            value="readme"
            label="readme.md"
            className="tree-example__row"
          >
            <File size={16} />
            readme.md
          </Tree.Item>

          <Tree.Branch value="src" label="src">
            <Tree.BranchControl className="tree-example__row">
              <Tree.BranchIndicator className="tree-example__chevron" asChild>
                <ChevronRight size={16} />
              </Tree.BranchIndicator>
              <Folder size={16} />
              src
            </Tree.BranchControl>
            <Tree.BranchContent forceMount>
              <Tree.Item
                value="index"
                label="index.ts"
                className="tree-example__row"
              >
                <File size={16} />
                index.ts
              </Tree.Item>

              <Tree.Branch value="components" label="components">
                <Tree.BranchControl className="tree-example__row">
                  <Tree.BranchIndicator
                    className="tree-example__chevron"
                    asChild
                  >
                    <ChevronRight size={16} />
                  </Tree.BranchIndicator>
                  <Folder size={16} />
                  components
                </Tree.BranchControl>
                <Tree.BranchContent forceMount>
                  <Tree.Item
                    value="button"
                    label="button.tsx"
                    className="tree-example__row"
                  >
                    <File size={16} />
                    button.tsx
                  </Tree.Item>
                  <Tree.Item
                    value="dialog"
                    label="dialog.tsx"
                    className="tree-example__row"
                  >
                    <File size={16} />
                    dialog.tsx
                  </Tree.Item>
                  <Tree.Item
                    value="legacy"
                    label="legacy.tsx"
                    disabled
                    className="tree-example__row"
                  >
                    <File size={16} />
                    legacy.tsx (disabled)
                  </Tree.Item>
                </Tree.BranchContent>
              </Tree.Branch>

              <Tree.Item
                value="utils"
                label="utils.ts"
                className="tree-example__row"
              >
                <File size={16} />
                utils.ts
              </Tree.Item>
            </Tree.BranchContent>
          </Tree.Branch>

          <Tree.Branch value="docs" label="docs">
            <Tree.BranchControl className="tree-example__row">
              <Tree.BranchIndicator className="tree-example__chevron" asChild>
                <ChevronRight size={16} />
              </Tree.BranchIndicator>
              <Folder size={16} />
              docs
            </Tree.BranchControl>
            <Tree.BranchContent forceMount>
              <Tree.Item
                value="guides"
                label="guides.md"
                className="tree-example__row"
              >
                <File size={16} />
                guides.md
              </Tree.Item>
            </Tree.BranchContent>
          </Tree.Branch>

          <Tree.Item
            value="pkg"
            label="package.json"
            className="tree-example__row"
          >
            <File size={16} />
            package.json
          </Tree.Item>
          <Tree.SelectionPath
            className="tree-example__path-bar"
            separator={<ChevronRight />}
          />
        </Tree.Root>
      </div>
    </section>
  );
}

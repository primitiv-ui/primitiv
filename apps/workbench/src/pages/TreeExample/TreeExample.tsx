import { useState } from "react";

import { Tree } from "@primitiv/react";

import "./TreeExample.scss";

type SelectionMode = "single" | "multiple";

export function TreeExample() {
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("single");

  return (
    <section className="tree-example">
      <header className="tree-example__header">
        <h1>Tree</h1>
        <p>
          A hierarchical tree view authored by recursive composition.
          Expand branches with their row, the chevron, or{" "}
          <kbd>ArrowRight</kbd> / <kbd>ArrowLeft</kbd>. Use{" "}
          <kbd>ArrowUp</kbd> / <kbd>ArrowDown</kbd> and <kbd>Home</kbd> /{" "}
          <kbd>End</kbd> to navigate; <kbd>Enter</kbd> or <kbd>Space</kbd>{" "}
          to activate.
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

      {selectionMode === "single" ? (
        <Tree.Root
          className="tree-example__tree"
          defaultExpandedValues={["src", "components"]}
          defaultSelectedValue="readme"
        >
          {renderProject()}
        </Tree.Root>
      ) : (
        <Tree.Root
          className="tree-example__tree"
          selectionMode="multiple"
          defaultExpandedValues={["src", "components"]}
          defaultSelectedValues={["readme"]}
        >
          {renderProject()}
        </Tree.Root>
      )}
    </section>
  );
}

function renderProject() {
  return (
    <>
      <Tree.Item value="readme" className="tree-example__row">
        <span className="tree-example__indent" aria-hidden="true" />
        <span className="tree-example__glyph">📄</span>
        readme.md
      </Tree.Item>

      <Tree.Branch value="src">
        <Tree.BranchControl className="tree-example__row">
          <span className="tree-example__indent" aria-hidden="true" />
          <Tree.BranchIndicator className="tree-example__chevron">
            ▸
          </Tree.BranchIndicator>
          <span className="tree-example__glyph">📁</span>
          src
        </Tree.BranchControl>
        <Tree.BranchContent>
          <Tree.Item value="index" className="tree-example__row">
            <span className="tree-example__indent" aria-hidden="true" />
            <span className="tree-example__glyph">📄</span>
            index.ts
          </Tree.Item>

          <Tree.Branch value="components">
            <Tree.BranchControl className="tree-example__row">
              <span className="tree-example__indent" aria-hidden="true" />
              <Tree.BranchIndicator className="tree-example__chevron">
                ▸
              </Tree.BranchIndicator>
              <span className="tree-example__glyph">📁</span>
              components
            </Tree.BranchControl>
            <Tree.BranchContent>
              <Tree.Item value="button" className="tree-example__row">
                <span className="tree-example__indent" aria-hidden="true" />
                <span className="tree-example__glyph">📄</span>
                button.tsx
              </Tree.Item>
              <Tree.Item value="dialog" className="tree-example__row">
                <span className="tree-example__indent" aria-hidden="true" />
                <span className="tree-example__glyph">📄</span>
                dialog.tsx
              </Tree.Item>
              <Tree.Item
                value="legacy"
                disabled
                className="tree-example__row"
              >
                <span className="tree-example__indent" aria-hidden="true" />
                <span className="tree-example__glyph">📄</span>
                legacy.tsx (disabled)
              </Tree.Item>
            </Tree.BranchContent>
          </Tree.Branch>

          <Tree.Item value="utils" className="tree-example__row">
            <span className="tree-example__indent" aria-hidden="true" />
            <span className="tree-example__glyph">📄</span>
            utils.ts
          </Tree.Item>
        </Tree.BranchContent>
      </Tree.Branch>

      <Tree.Branch value="docs">
        <Tree.BranchControl className="tree-example__row">
          <span className="tree-example__indent" aria-hidden="true" />
          <Tree.BranchIndicator className="tree-example__chevron">
            ▸
          </Tree.BranchIndicator>
          <span className="tree-example__glyph">📁</span>
          docs
        </Tree.BranchControl>
        <Tree.BranchContent>
          <Tree.Item value="guides" className="tree-example__row">
            <span className="tree-example__indent" aria-hidden="true" />
            <span className="tree-example__glyph">📄</span>
            guides.md
          </Tree.Item>
        </Tree.BranchContent>
      </Tree.Branch>

      <Tree.Item value="pkg" className="tree-example__row">
        <span className="tree-example__indent" aria-hidden="true" />
        <span className="tree-example__glyph">📦</span>
        package.json
      </Tree.Item>
    </>
  );
}

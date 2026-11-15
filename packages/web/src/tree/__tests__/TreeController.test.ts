import type { TreeNode } from "@primitiv-ui/core";

import { TreeController, type TreeControllerHost } from "../TreeController";

type State = ReturnType<TreeControllerHost["state"]>;
type Recorded = TreeControllerHost & { selections: string[][]; expansions: string[][]; current: State };

/** docs (guides (intro), api), blog — each value a focusable element. */
const NODES: TreeNode[] = [
  { value: "docs", parent: null, isBranch: true, disabled: false },
  { value: "guides", parent: "docs", isBranch: true, disabled: false },
  { value: "intro", parent: "guides", isBranch: false, disabled: false },
  { value: "api", parent: "docs", isBranch: false, disabled: false },
  { value: "blog", parent: null, isBranch: false, disabled: false },
];

function hostWith(current: Partial<State> = {}, disabled: string[] = []): Recorded {
  document.body.innerHTML = NODES.map((n) => `<div id="${n.value}" tabindex="-1"></div>`).join("");
  const host: Recorded = {
    selections: [],
    expansions: [],
    current: { mode: "single", selected: [], expanded: [], ...current },
    state: () => host.current,
    nodes: () => NODES.map((node) => ({ ...node, disabled: disabled.includes(node.value) })),
    element: (value) => document.getElementById(value),
    select(next) {
      host.selections.push(next);
      host.current = { ...host.current, selected: next };
    },
    expand(next) {
      host.expansions.push(next);
      host.current = { ...host.current, expanded: next };
    },
  };
  return host;
}

const key = (k: string) => new KeyboardEvent("keydown", { key: k, cancelable: true });

afterEach(() => {
  document.body.replaceChildren();
});

describe("TreeController", () => {
  describe("clicks", () => {
    it("selects a clicked item", () => {
      // Arrange
      const host = hostWith();
      const controller = new TreeController(host);

      // Act
      controller.click("blog");

      // Assert
      expect(host.selections).toEqual([["blog"]]);
    });

    it("reports nothing for a click that changes nothing", () => {
      // Arrange
      const host = hostWith({ selected: ["blog"] });
      const controller = new TreeController(host);

      // Act
      controller.click("blog");

      // Assert
      expect(host.selections).toEqual([]);
    });

    it("ignores a click on a disabled item or branch row", () => {
      // Arrange
      const host = hostWith({}, ["blog", "docs"]);
      const controller = new TreeController(host);

      // Act
      controller.click("blog");
      controller.toggleClick("docs");

      // Assert
      expect(host.selections).toEqual([]);
      expect(host.expansions).toEqual([]);
    });

    it("toggles and selects a branch from its row", () => {
      // Arrange
      const host = hostWith();
      const controller = new TreeController(host);

      // Act
      controller.toggleClick("docs");

      // Assert
      expect(host.expansions).toEqual([["docs"]]);
      expect(host.selections).toEqual([["docs"]]);
    });

    it("ranges with Shift over the order as it was before a branch row's toggle", () => {
      // Arrange
      const host = hostWith({ mode: "multiple", expanded: ["docs"] });
      const controller = new TreeController(host);
      controller.click("blog");

      // Act
      controller.toggleClick("guides", { shift: true });

      // Assert
      expect(host.selections.at(-1)).toEqual(["guides", "api", "blog"]);
    });

    it("anchors a range at the last plain or Ctrl click", () => {
      // Arrange
      const host = hostWith({ mode: "multiple", expanded: ["docs", "guides"] });
      const controller = new TreeController(host);

      // Act
      controller.click("guides");
      controller.click("blog", { ctrl: true });
      controller.click("intro", { shift: true });

      // Assert
      expect(host.selections.at(-1)).toEqual(["intro", "api", "blog"]);
    });
  });

  describe("keyboard", () => {
    it("moves focus and claims the key", () => {
      // Arrange
      const host = hostWith({ expanded: ["docs"] });
      const controller = new TreeController(host);
      const event = key("ArrowDown");

      // Act
      controller.keydown("docs", event);

      // Assert
      expect(document.activeElement?.id).toBe("guides");
      expect(event.defaultPrevented).toBe(true);
    });

    it("expands with ArrowRight", () => {
      // Arrange
      const host = hostWith();
      const controller = new TreeController(host);

      // Act
      controller.keydown("docs", key("ArrowRight"));

      // Assert
      expect(host.expansions).toEqual([["docs"]]);
    });

    it("toggles and selects a branch with Enter", () => {
      // Arrange
      const host = hostWith({ expanded: ["docs"] });
      const controller = new TreeController(host);

      // Act
      controller.keydown("docs", key("Enter"));

      // Assert
      expect(host.expansions).toEqual([[]]);
      expect(host.selections).toEqual([["docs"]]);
    });

    it("claims Enter on a disabled item without acting", () => {
      // Arrange
      const host = hostWith({}, ["blog"]);
      const controller = new TreeController(host);
      const event = key("Enter");

      // Act
      controller.keydown("blog", event);

      // Assert
      expect(event.defaultPrevented).toBe(true);
      expect(host.selections).toEqual([]);
    });

    it("leaves a key it does not handle alone", () => {
      // Arrange
      const host = hostWith();
      const controller = new TreeController(host);
      const event = key("a");

      // Act
      controller.keydown("docs", event);

      // Assert
      expect(event.defaultPrevented).toBe(false);
    });

    it("anchors a keyboard selection, so a later Shift click ranges from it", () => {
      // Arrange
      const host = hostWith({ mode: "multiple", expanded: ["docs"] });
      const controller = new TreeController(host);

      // Act
      controller.keydown("api", key(" "));
      controller.click("blog", { shift: true });

      // Assert
      expect(host.selections.at(-1)).toEqual(["api", "blog"]);
    });
  });

  it("reports the visible order and the tab stop", () => {
    // Arrange
    const host = hostWith({ expanded: ["docs"] }, ["docs"]);
    const controller = new TreeController(host);

    // Act & Assert
    expect(controller.order()).toEqual(["docs", "guides", "api", "blog"]);
    expect(controller.tabStop(null)).toBe("guides");
    expect(controller.tabStop("api")).toBe("api");
  });
});

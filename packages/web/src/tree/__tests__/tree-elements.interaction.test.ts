import userEvent from "@testing-library/user-event";

import { treeHtml } from "./tree.fixtures";
import { control, listenerErrors, mount, node, path, root, settle } from "./mount";

afterEach(() => {
  expect(listenerErrors.splice(0)).toEqual([]);
  document.body.replaceChildren();
});

const heard = (type: string) => {
  const seen: unknown[] = [];
  document.body.addEventListener(type, (event) => {
    const { detail, bubbles, cancelable } = event as CustomEvent;
    seen.push({ detail, bubbles, cancelable, applied: root().getAttribute("value") });
  });
  return seen;
};

describe("<primitiv-tree> interaction", () => {
  it("announces a selection before it applies, as a bubbling, cancelable event", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(treeHtml());
    const seen = heard("primitiv-tree-change");

    // Act
    await user.click(node("blog"));

    // Assert
    expect(seen).toEqual([{ detail: { value: ["blog"] }, bubbles: true, cancelable: true, applied: null }]);
    expect(root().getAttribute("value")).toBe("blog");
  });

  it("announces an expansion before it applies, and joins several with spaces", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(treeHtml({ expanded: ["docs"] }));
    const seen: unknown[] = [];
    root().addEventListener("primitiv-tree-expanded-change", (event) =>
      seen.push([(event as CustomEvent).detail, root().getAttribute("expanded")]),
    );

    // Act
    await user.click(control("guides"));

    // Assert
    expect(seen).toEqual([[{ expanded: ["docs", "guides"] }, "docs"]]);
    expect(root().getAttribute("expanded")).toBe("docs guides");
  });

  it("lets a listener veto a selection or an expansion", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(treeHtml());
    root().addEventListener("primitiv-tree-change", (event) => event.preventDefault());
    root().addEventListener("primitiv-tree-expanded-change", (event) => event.preventDefault());

    // Act
    await user.click(control("docs"));

    // Assert
    expect(root().hasAttribute("value")).toBe(false);
    expect(root().hasAttribute("expanded")).toBe(false);
  });

  it("joins a multiple selection with spaces, and toggles with Meta", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(treeHtml({ multiple: true, selected: ["docs"] }));

    // Act
    await user.keyboard("{Meta>}");
    await user.click(node("blog"));
    await user.keyboard("{/Meta}");

    // Assert
    expect(root().getAttribute("value")).toBe("docs blog");
  });

  it("toggles a branch from inside its row, but not from the rest of the branch", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(
      treeHtml({ expanded: ["docs"] }).replace(
        "<primitiv-tree-branch-control>Guides",
        "<primitiv-tree-branch-control><span>Guides</span>",
      ),
    );

    // Act
    await user.click(control("guides").firstElementChild as HTMLElement);
    const fromRow = root().getAttribute("expanded");
    await user.click(node("guides"));

    // Assert
    expect(fromRow).toBe("docs guides");
    expect(root().getAttribute("expanded")).toBe("docs guides");
  });

  it("selects the item clicked inside a group, not its branch", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(treeHtml({ expanded: ["docs"] }));

    // Act
    await user.click(node("api"));

    // Assert
    expect(root().getAttribute("value")).toBe("api");
  });

  it("moves the tab stop to the item focus moves to", async () => {
    // Arrange
    await mount(treeHtml());

    // Act
    node("blog").focus();
    await settle();

    // Assert
    expect(node("blog").tabIndex).toBe(0);
    expect(node("docs").tabIndex).toBe(-1);
  });

  it("ignores clicks, keys and focus outside its items", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(treeHtml({ selected: ["blog"], selectionPath: true }).replace("</primitiv-tree>", '<button id="inside">In</button></primitiv-tree>'));
    const seen = heard("primitiv-tree-change");

    // Act
    await user.click(path());
    await user.click(document.getElementById("inside") as HTMLElement);
    await user.keyboard("{ArrowDown}");

    // Assert
    expect(seen).toEqual([]);
    expect(node("docs").tabIndex).toBe(0);
  });

  it("leaves a tree nested in one of its items to that tree", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(
      treeHtml({ id: "outer" }).replace(
        '<primitiv-tree-item value="blog" label="Blog">Blog</primitiv-tree-item>',
        '<primitiv-tree-item value="blog" label="Blog">Blog<primitiv-tree id="inner"><primitiv-tree-item value="post">Post</primitiv-tree-item></primitiv-tree></primitiv-tree-item>',
      ),
    );
    const post = document.querySelector('#inner [value="post"]') as HTMLElement;

    // Act
    await user.click(post);
    post.focus();
    await user.keyboard("{ArrowDown}");

    // Assert
    expect(document.getElementById("outer")?.hasAttribute("value")).toBe(false);
    expect(document.getElementById("inner")?.getAttribute("value")).toBe("post");
    expect(post.getAttribute("aria-level")).toBe("1");
  });
});

import userEvent from "@testing-library/user-event";

import { treeHtml } from "./tree.fixtures";
import { listenerErrors, mount, node, root, settle } from "./mount";

afterEach(() => {
  expect(listenerErrors.splice(0)).toEqual([]);
  document.body.replaceChildren();
});

describe("<primitiv-tree> lifecycle", () => {
  it("decorates an item that arrives after it rendered, and reaches it with the keys", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(treeHtml());

    // Act
    root().insertAdjacentHTML("beforeend", '<primitiv-tree-item value="news">News</primitiv-tree-item>');
    await settle();
    node("blog").focus();
    await user.keyboard("{ArrowDown}");

    // Assert
    expect(node("news").getAttribute("role")).toBe("treeitem");
    expect(document.activeElement).toBe(node("news"));
  });

  it("stops responding once removed from the document", async () => {
    // Arrange
    await mount(treeHtml());
    const element = root();
    const blog = node("blog");
    element.remove();

    // Act
    blog.click();
    await settle();

    // Assert
    expect(element.hasAttribute("value")).toBe(false);
  });

  it("handles each click once after a move", async () => {
    // Arrange
    const user = userEvent.setup();
    await mount(treeHtml({ multiple: true }));
    const element = root();

    // Act
    document.body.append(element);
    await settle();
    await user.keyboard("{Control>}");
    await user.click(node("blog"));
    await user.keyboard("{/Control}");

    // Assert
    expect(element.getAttribute("value")).toBe("blog");
  });
});

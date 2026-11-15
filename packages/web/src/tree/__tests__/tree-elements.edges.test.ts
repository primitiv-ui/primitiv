import userEvent from "@testing-library/user-event";

import { listenerErrors, mount, node, root } from "./mount";

afterEach(() => {
  expect(listenerErrors.splice(0)).toEqual([]);
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("<primitiv-tree> edge cases", () => {
  it("reports a node with no value once, and leaves it out", async () => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();
    const seen: unknown[] = [];
    document.body.addEventListener("primitiv-tree-change", (event) => seen.push((event as CustomEvent).detail));

    // Act
    await mount('<primitiv-tree><primitiv-tree-item>Nameless</primitiv-tree-item><primitiv-tree-item value="b">B</primitiv-tree-item></primitiv-tree>');
    await user.click(document.querySelector("primitiv-tree-item") as HTMLElement);
    const clicked = [...seen];
    root().setAttribute("value", "b");
    await Promise.resolve();

    // Assert
    expect(error).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith("<primitiv-tree-item> needs a value.", expect.any(HTMLElement));
    expect(document.querySelector("primitiv-tree-item")?.hasAttribute("role")).toBe(false);
    expect(root().getAttribute("value")).toBe("b");
    expect(clicked).toEqual([]);
  });

  it("reports a branch with no row", async () => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    await mount('<primitiv-tree><primitiv-tree-branch value="a"></primitiv-tree-branch></primitiv-tree>');

    // Assert
    expect(error).toHaveBeenCalledWith("<primitiv-tree-branch> needs a <primitiv-tree-branch-control> child, its row.", expect.any(HTMLElement));
    expect(node("a").hasAttribute("aria-labelledby")).toBe(false);
    expect(node("a").getAttribute("aria-expanded")).toBe("false");
  });

});

import { splitButtonHtml } from "./split-button.fixtures";
import { dropdown, mount, root, settle } from "./mount";

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("<primitiv-split-button> edge cases", () => {
  it.each([
    ["no element child", "<primitiv-split-button-action>Go</primitiv-split-button-action>"],
    [
      "two element children",
      '<primitiv-split-button-action><button type="button">A</button><button type="button">B</button></primitiv-split-button-action>',
    ],
  ])("reports an action with %s once, and leaves it inert", async (_case, part) => {
    // Arrange
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const html = splitButtonHtml().replace(/<primitiv-split-button-action>.*?<\/primitiv-split-button-action>/, part);

    // Act
    await mount(html);
    root().setAttribute("disabled", "");
    await settle();
    for (const button of document.querySelectorAll("primitiv-split-button-action button")) {
      button.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
    }
    await settle();

    // Assert
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0][0])).toContain("<primitiv-split-button-action>");
    expect(document.querySelectorAll("[data-split-button-action]")).toHaveLength(0);
    expect(dropdown().open).toBe(false);
  });

  it("is a group with no menu, and names nothing, without a dropdown", async () => {
    // Arrange & Act
    await mount(
      '<primitiv-split-button><primitiv-split-button-action><button type="button">Go</button></primitiv-split-button-action></primitiv-split-button>',
    );
    const button = document.querySelector("button") as HTMLButtonElement;
    const event = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true });
    button.dispatchEvent(event);

    // Assert
    expect(root().getAttribute("role")).toBe("group");
    expect(root().getAttribute("data-state")).toBe("closed");
    expect(button.getAttribute("data-split-button-action")).toBe("");
    expect(event.defaultPrevented).toBe(true);
  });

  it("leaves a trigger part without exactly one child to the dropdown", async () => {
    // Arrange
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    await mount(splitButtonHtml().replace(/<primitiv-dropdown-trigger>.*?<\/primitiv-dropdown-trigger>/, "<primitiv-dropdown-trigger></primitiv-dropdown-trigger>"));

    // Assert
    expect(document.querySelectorAll("[data-split-button-trigger]")).toHaveLength(0);
    expect(root().getAttribute("data-state")).toBe("closed");
  });

  it("keeps a nested split button's halves its own", async () => {
    // Arrange
    const inner = splitButtonHtml({ id: "inner" });
    const outer = splitButtonHtml({ id: "outer" }).replace("<li>Create a merge commit</li>", `<li>${inner}</li>`);

    // Act
    await mount(outer);

    // Assert
    const actions = [...document.querySelectorAll("[data-split-button-action]")].map((element) => element.id);
    const triggers = [...document.querySelectorAll("[data-split-button-trigger]")].map((element) => element.id);
    expect(actions).toEqual(["outer-action", "inner-action"]);
    expect(triggers).toEqual(["outer-trigger", "inner-trigger"]);
  });
});

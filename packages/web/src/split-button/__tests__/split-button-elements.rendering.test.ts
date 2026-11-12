import "../../dropdown/__tests__/popover-polyfill";

import { screen } from "@testing-library/dom";

import { defineSplitButton, type ElementRegistry } from "../elements";
import { splitButtonHtml } from "./split-button.fixtures";

afterEach(() => {
  document.body.replaceChildren();
});

/** Mount markup and let the root's first reconcile settle. */
async function mount(html: string) {
  // Defined inside each test rather than in beforeAll: a failure there would
  // skip the file, and a skipped test kills no mutant.
  defineSplitButton();
  document.body.innerHTML = html;
  await Promise.resolve();
}

const group = () => screen.getByRole("group");
const action = () => screen.getByRole("button", { name: "Squash and merge" });
const trigger = () => document.querySelector("primitiv-dropdown-trigger > button") as HTMLButtonElement;

describe("<primitiv-split-button> rendering", () => {
  it("defines its elements and the dropdown's, and defining twice is harmless", () => {
    // Arrange & Act
    defineSplitButton();
    defineSplitButton();

    // Assert
    expect(customElements.get("primitiv-split-button")).toBeDefined();
    expect(customElements.get("primitiv-split-button-action")).toBeDefined();
    expect(customElements.get("primitiv-dropdown")).toBeDefined();
    expect(customElements.get("primitiv-dropdown-item")).toBeDefined();
  });

  it("defines exactly its tag names on the registry it is given, skipping any already there", () => {
    // Arrange
    const defined: string[] = [];
    const registry: ElementRegistry = {
      get: (name: string) => (name.startsWith("primitiv-dropdown") || name === "primitiv-split-button-action" ? class {} : undefined) as never,
      define: (name: string) => {
        defined.push(name);
      },
    };

    // Act
    defineSplitButton(registry);

    // Assert
    expect(defined).toEqual(["primitiv-split-button"]);
  });

  it("does nothing where there is no registry", () => {
    // Arrange, Act & Assert
    expect(() => defineSplitButton(undefined)).not.toThrow();
  });

  it("is a group with the split-button hook, closed while its menu is", async () => {
    // Arrange & Act
    await mount(splitButtonHtml());

    // Assert
    expect(group().getAttribute("data-split-button")).toBe("");
    expect(group().getAttribute("data-state")).toBe("closed");
    expect(group().hasAttribute("data-disabled")).toBe(false);
  });

  it("is open while its menu is", async () => {
    // Arrange & Act
    await mount(splitButtonHtml({ open: true }));

    // Assert
    expect(group().getAttribute("data-state")).toBe("open");
  });

  it("marks the two halves apart and gives each an id from the root's", async () => {
    // Arrange & Act
    await mount(splitButtonHtml({ id: "merge" }));

    // Assert
    expect(action().getAttribute("data-split-button-action")).toBe("");
    expect(action().getAttribute("id")).toBe("merge-action");
    expect(trigger().getAttribute("data-split-button-trigger")).toBe("");
    expect(trigger().getAttribute("id")).toBe("merge-trigger");
    expect(action().hasAttribute("data-disabled")).toBe(false);
    expect(trigger().hasAttribute("data-disabled")).toBe(false);
  });

  it("generates the root's id when it has none", async () => {
    // Arrange & Act
    await mount(splitButtonHtml());

    // Assert
    expect(action().id).toMatch(/^primitiv-split-button-\d+-action$/);
    expect(trigger().id).toMatch(/^primitiv-split-button-\d+-trigger$/);
  });

  it("keeps ids the consumer wrote", async () => {
    // Arrange & Act
    await mount(splitButtonHtml({ actionAttrs: ' id="go"', triggerAttrs: ' id="more"' }));

    // Assert
    expect(action().getAttribute("id")).toBe("go");
    expect(trigger().getAttribute("id")).toBe("more");
    expect(trigger().getAttribute("aria-labelledby")).toBe("more go");
  });

  it("names the trigger by its own text then the action's", async () => {
    // Arrange & Act
    await mount(splitButtonHtml());

    // Assert
    expect(screen.getByRole("button", { name: "More merge options Squash and merge" })).toBe(trigger());
  });

  it.each([' aria-label="Options"', ' aria-labelledby="elsewhere"'])("leaves a trigger the consumer named with%s", async (attrs) => {
    // Arrange & Act
    await mount(splitButtonHtml({ triggerAttrs: attrs }) + '<span id="elsewhere">Options</span>');

    // Assert
    expect(screen.getByRole("button", { name: "Options" })).toBe(trigger());
  });

  it("disables both halves while the group is disabled", async () => {
    // Arrange & Act
    await mount(splitButtonHtml({ disabled: true }));

    // Assert
    expect(group().getAttribute("data-disabled")).toBe("");
    expect(action().getAttribute("disabled")).toBe("");
    expect(trigger().getAttribute("disabled")).toBe("");
    expect((action() as HTMLButtonElement).disabled).toBe(true);
    expect(action().getAttribute("data-disabled")).toBe("");
    expect((trigger() as HTMLButtonElement).disabled).toBe(true);
    expect(trigger().getAttribute("data-disabled")).toBe("");
  });

  it("disables the action half on its own", async () => {
    // Arrange & Act
    await mount(splitButtonHtml({ actionDisabled: true }));

    // Assert
    expect((action() as HTMLButtonElement).disabled).toBe(true);
    expect(action().getAttribute("data-disabled")).toBe("");
    expect((trigger() as HTMLButtonElement).disabled).toBe(false);
    expect(trigger().hasAttribute("data-disabled")).toBe(false);
    expect(group().hasAttribute("data-disabled")).toBe(false);
  });

  it("disables the trigger half on its own", async () => {
    // Arrange & Act
    await mount(splitButtonHtml({ triggerDisabled: true }));

    // Assert
    expect((trigger() as HTMLButtonElement).disabled).toBe(true);
    expect(trigger().getAttribute("data-disabled")).toBe("");
    expect((action() as HTMLButtonElement).disabled).toBe(false);
    expect(action().hasAttribute("data-disabled")).toBe(false);
  });

  it("writes nothing over markup that is already correct, so pre-rendered HTML is adopted as it is", async () => {
    // Arrange
    await mount(splitButtonHtml({ open: true }) + splitButtonHtml({ disabled: true }) + splitButtonHtml({ triggerDisabled: true }));
    const rendered = document.body.innerHTML;
    document.body.replaceChildren();
    const writes = vi.spyOn(Element.prototype, "setAttribute");
    const removals = vi.spyOn(Element.prototype, "removeAttribute");

    // Act
    document.body.innerHTML = rendered;
    await Promise.resolve();

    // Assert
    expect(writes.mock.calls.filter(([name]) => name !== "data-popover-open")).toEqual([]);
    expect(removals).not.toHaveBeenCalled();
    writes.mockRestore();
    removals.mockRestore();
  });

  it("writes no class and no style on anything", async () => {
    // Arrange & Act
    await mount(splitButtonHtml({ open: true }));

    // Assert
    expect(document.querySelectorAll("[class], [style]")).toHaveLength(0);
  });

  it("leaves the menu itself to the dropdown", async () => {
    // Arrange & Act
    await mount(splitButtonHtml());

    // Assert
    expect(trigger().getAttribute("aria-haspopup")).toBe("menu");
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(screen.getAllByRole("menuitem", { hidden: true })).toHaveLength(2);
  });
});

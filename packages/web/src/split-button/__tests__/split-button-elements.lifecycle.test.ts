import { splitButtonHtml } from "./split-button.fixtures";
import { action, dropdown, mount, root, settle, trigger } from "./mount";

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("<primitiv-split-button> lifecycle", () => {
  it("follows the menu opened and closed from outside", async () => {
    // Arrange
    await mount(splitButtonHtml());

    // Act
    dropdown().open = true;
    await settle();
    const opened = root().getAttribute("data-state");
    dropdown().open = false;
    await settle();

    // Assert
    expect(opened).toBe("open");
    expect(root().getAttribute("data-state")).toBe("closed");
  });

  it("disables both halves as the group becomes disabled", async () => {
    // Arrange
    await mount(splitButtonHtml());

    // Act
    root().setAttribute("disabled", "");
    await settle();

    // Assert
    expect(action().disabled).toBe(true);
    expect(trigger().disabled).toBe(true);
    expect(root().getAttribute("data-disabled")).toBe("");
  });

  it("names the trigger once the consumer's aria-labelledby is gone", async () => {
    // Arrange
    await mount(splitButtonHtml({ id: "merge", triggerAttrs: ' aria-labelledby="elsewhere"' }));

    // Act
    trigger().removeAttribute("aria-labelledby");
    await settle();

    // Assert
    expect(trigger().getAttribute("aria-labelledby")).toBe("merge-trigger merge-action");
  });

  it("forgets an action that stops being decoratable", async () => {
    // Arrange
    vi.spyOn(console, "error").mockImplementation(() => {});
    await mount(splitButtonHtml());
    const button = action();

    // Act
    button.after(document.createElement("span"));
    await settle();
    button.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
    await settle();

    // Assert
    expect(dropdown().open).toBe(false);
  });

  it("re-enables only the halves the group disabled", async () => {
    // Arrange
    await mount(splitButtonHtml({ actionDisabled: true }));
    root().setAttribute("disabled", "");
    await settle();

    // Act
    root().removeAttribute("disabled");
    await settle();

    // Assert
    expect(action().disabled).toBe(true);
    expect(action().getAttribute("data-disabled")).toBe("");
    expect(trigger().disabled).toBe(false);
    expect(trigger().hasAttribute("data-disabled")).toBe(false);
    expect(root().hasAttribute("data-disabled")).toBe(false);
  });

  it("re-derives the trigger's name when the action's id changes", async () => {
    // Arrange
    await mount(splitButtonHtml({ id: "merge" }));

    // Act
    action().id = "go";
    await settle();

    // Assert
    expect(trigger().getAttribute("aria-labelledby")).toBe("merge-trigger go");
  });

  it("re-derives the trigger's name on reconnecting, after the action's id changed while away", async () => {
    // Arrange
    await mount(splitButtonHtml({ id: "merge" }));
    const element = root();
    element.remove();
    (element.querySelector("primitiv-split-button-action > button") as HTMLElement).id = "go";

    // Act
    document.body.append(element);

    // Assert
    expect(trigger().getAttribute("aria-labelledby")).toBe("merge-trigger go");
  });

  it("drops its derived name once the consumer labels the trigger", async () => {
    // Arrange
    await mount(splitButtonHtml({ id: "merge" }));

    // Act
    trigger().setAttribute("aria-label", "Options");
    await settle();

    // Assert
    expect(trigger().hasAttribute("aria-labelledby")).toBe(false);
  });

  it("adopts a pre-rendered derived name as its own, and drops it once the consumer labels the trigger", async () => {
    // Arrange
    await mount(splitButtonHtml({ actionAttrs: ' id="go"', triggerAttrs: ' id="more" aria-labelledby="more go"' }));

    // Act
    trigger().setAttribute("aria-label", "Options");
    await settle();

    // Assert
    expect(trigger().hasAttribute("aria-labelledby")).toBe(false);
  });

  it("names the trigger again once the consumer's label is gone", async () => {
    // Arrange
    await mount(splitButtonHtml({ id: "merge", triggerAttrs: ' aria-label="Options"' }));

    // Act
    trigger().removeAttribute("aria-label");
    await settle();

    // Assert
    expect(trigger().getAttribute("aria-labelledby")).toBe("merge-trigger merge-action");
  });

  it("drops its derived name when the action leaves", async () => {
    // Arrange
    await mount(splitButtonHtml({ id: "merge" }));

    // Act
    (document.querySelector("primitiv-split-button-action") as HTMLElement).remove();
    await settle();

    // Assert
    expect(trigger().hasAttribute("aria-labelledby")).toBe(false);
  });

  it("decorates an action that arrives later", async () => {
    // Arrange
    await mount(splitButtonHtml({ id: "merge" }));
    const part = document.querySelector("primitiv-split-button-action") as HTMLElement;
    part.remove();
    await settle();

    // Act
    root().prepend(part);
    await settle();
    dropdown().open = false;
    action().dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
    await settle();

    // Assert
    expect(trigger().getAttribute("aria-labelledby")).toBe("merge-trigger merge-action");
    expect(dropdown().open).toBe(true);
  });

  it("stops listening once removed, and resumes when put back", async () => {
    // Arrange
    await mount(splitButtonHtml());
    const element = root();
    const press = () => action().dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));

    // Act
    element.remove();
    const detached = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true });
    (element.querySelector("primitiv-split-button-action > button") as HTMLElement).dispatchEvent(detached);
    document.body.append(element);
    await settle();
    press();
    await settle();

    // Assert
    expect(detached.defaultPrevented).toBe(false);
    expect(dropdown().open).toBe(true);
  });
});

import userEvent from "@testing-library/user-event";

import { RadioCardController, type RadioCardControllerHost } from "../RadioCardController";

type HostState = ReturnType<RadioCardControllerHost["state"]>;

/** A connected controller over one `<button>` per value; `disabled` ones registered as disabled. */
function connected(values: string[], overrides: Partial<HostState> = {}, disabled: string[] = []) {
  const state: HostState = { selected: undefined, orientation: "both", dir: "ltr", ...overrides };
  const changes: string[] = [];
  const root = document.createElement("div");
  const buttons = values.map((value) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = value;
    root.append(button);
    return button;
  });
  document.body.append(root);
  const controller = new RadioCardController(root, { state: () => state, change: (value) => changes.push(value) });
  values.forEach((value, index) => controller.registerTrigger(value, buttons[index], { disabled: disabled.includes(value) }));
  controller.connect();
  return { buttons, changes };
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("RadioCardController", () => {
  it("asks the host to select a clicked card, and nothing for a disabled one", async () => {
    // Arrange
    const user = userEvent.setup();
    const { buttons, changes } = connected(["basic", "pro", "team"], {}, ["team"]);

    // Act
    await user.click(buttons[1]);
    await user.click(buttons[2]);

    // Assert
    expect(changes).toEqual(["pro"]);
  });

  it("moves focus and selection with every arrow while both axes are live", async () => {
    // Arrange
    const user = userEvent.setup();
    const { buttons, changes } = connected(["basic", "pro", "team"], { selected: "basic" });
    buttons[0].focus();

    // Act
    await user.keyboard("{ArrowDown}{ArrowRight}");
    const afterTwo = document.activeElement;
    await user.keyboard("{ArrowUp}");

    // Assert
    expect(afterTwo).toBe(buttons[2]);
    expect(document.activeElement).toBe(buttons[1]);
    expect(changes).toEqual(["pro", "team", "pro"]);
  });
});

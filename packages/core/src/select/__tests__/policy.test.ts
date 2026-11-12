import { SELECT_OPTION_SELECTOR, selectKeydown } from "../policy";

describe("selectKeydown", () => {
  it("moves through the options as a menu does, wrapping", () => {
    // Arrange & Act
    const down = selectKeydown({ key: "ArrowDown", active: 2, count: 3 });
    const up = selectKeydown({ key: "ArrowUp", active: 0, count: 3 });

    // Assert
    expect(down).toEqual({ focus: 0 });
    expect(up).toEqual({ focus: 2 });
  });

  it("chooses the focused option on Enter", () => {
    // Arrange & Act
    const outcome = selectKeydown({ key: "Enter", active: 1, count: 3 });

    // Assert
    expect(outcome).toEqual({ activate: 1 });
  });

  it("closes on Escape", () => {
    // Arrange & Act
    const outcome = selectKeydown({ key: "Escape", active: 1, count: 3 });

    // Assert
    expect(outcome).toEqual({ open: false });
  });

  it("closes on Escape even with no options to move through", () => {
    // Arrange & Act
    const outcome = selectKeydown({ key: "Escape", active: -1, count: 0 });

    // Assert
    expect(outcome).toEqual({ open: false });
  });

  it("leaves every other key alone with no options", () => {
    // Arrange & Act
    const outcome = selectKeydown({ key: "ArrowDown", active: -1, count: 0 });

    // Assert
    expect(outcome).toBeNull();
  });
});

describe("SELECT_OPTION_SELECTOR", () => {
  it("names the enabled options", () => {
    // Arrange & Act & Assert
    expect(SELECT_OPTION_SELECTOR).toBe('[role="option"]:not([aria-disabled="true"])');
  });
});

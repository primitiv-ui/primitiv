import { checkboxCardToggle } from "../policy";

describe("checkboxCardToggle", () => {
  it.each([
    [false, true],
    [true, false],
    ["indeterminate", true],
  ] as const)("turns %j into %j", (checked, next) => {
    // Arrange & Act
    const outcome = checkboxCardToggle({ checked, disabled: false });

    // Assert
    expect(outcome).toBe(next);
  });

  it("does nothing while disabled", () => {
    // Arrange & Act
    const outcome = checkboxCardToggle({ checked: false, disabled: true });

    // Assert
    expect(outcome).toBeNull();
  });
});

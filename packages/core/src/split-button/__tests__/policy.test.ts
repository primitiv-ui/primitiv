import { splitButtonOpensMenu } from "../policy";

describe("splitButtonOpensMenu", () => {
  it("opens the menu on ArrowDown from the action", () => {
    // Arrange & Act
    const opens = splitButtonOpensMenu({ key: "ArrowDown", disabled: false });

    // Assert
    expect(opens).toBe(true);
  });

  it.each(["ArrowUp", "Enter", " ", "ArrowRight"])("leaves %j to the action", (key) => {
    // Arrange & Act
    const opens = splitButtonOpensMenu({ key, disabled: false });

    // Assert
    expect(opens).toBe(false);
  });

  it("does nothing while the action is disabled", () => {
    // Arrange & Act
    const opens = splitButtonOpensMenu({ key: "ArrowDown", disabled: true });

    // Assert
    expect(opens).toBe(false);
  });
});

import { navigationMenuToggle } from "../policy";

describe("navigationMenuToggle", () => {
  it("opens a closed entry", () => {
    // Arrange & Act
    const next = navigationMenuToggle({ open: "", arrival: undefined }, "docs");

    // Assert
    expect(next).toBe("docs");
  });

  it("closes the open entry", () => {
    // Arrange & Act
    const next = navigationMenuToggle({ open: "docs", arrival: undefined }, "docs");

    // Assert
    expect(next).toBe("");
  });

  it("switches from another open entry", () => {
    // Arrange & Act
    const next = navigationMenuToggle({ open: "blog", arrival: undefined }, "docs");

    // Assert
    expect(next).toBe("docs");
  });

  it("toggles against what was open when the pointer arrived, not what hover opened", () => {
    // Arrange & Act
    const next = navigationMenuToggle({ open: "docs", arrival: false }, "docs");

    // Assert
    expect(next).toBe("docs");
  });

  it("closes when the entry was already open as the pointer arrived", () => {
    // Arrange & Act
    const next = navigationMenuToggle({ open: "docs", arrival: true }, "docs");

    // Assert
    expect(next).toBe("");
  });
});

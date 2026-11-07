import { deriveId } from "../deriveId";

describe("deriveId", () => {
  it("joins rootId, suffix, and value with hyphens", () => {
    // Arrange & Act
    const id = deriveId("root", "trigger", "tab-1");

    // Assert
    expect(id).toBe("root-trigger-tab-1");
  });

  it("preserves React useId-style colon-bracketed root ids", () => {
    // Arrange & Act
    const id = deriveId(":r1:", "panel", "settings");

    // Assert
    expect(id).toBe(":r1:-panel-settings");
  });

  it("returns a stable result for the same inputs", () => {
    // Arrange & Act
    const a = deriveId("root", "panel", "x");
    const b = deriveId("root", "panel", "x");

    // Assert
    expect(a).toBe(b);
  });
});

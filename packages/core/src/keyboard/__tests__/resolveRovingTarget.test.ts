import { resolveRovingTarget } from "../resolveRovingTarget";

const navigable = ["a", "b", "c"];

describe("resolveRovingTarget", () => {
  describe("next / prev", () => {
    it("moves to the following key on next", () => {
      // Arrange & Act
      const result = resolveRovingTarget({ action: "next", navigable, currentKey: "a" });

      // Assert
      expect(result).toEqual({ target: "b" });
    });

    it("wraps from the last key to the first on next", () => {
      // Arrange & Act
      const result = resolveRovingTarget({ action: "next", navigable, currentKey: "c" });

      // Assert
      expect(result).toEqual({ target: "a" });
    });

    it("moves to the preceding key on prev", () => {
      // Arrange & Act
      const result = resolveRovingTarget({ action: "prev", navigable, currentKey: "b" });

      // Assert
      expect(result).toEqual({ target: "a" });
    });

    it("wraps from the first key to the last on prev", () => {
      // Arrange & Act
      const result = resolveRovingTarget({ action: "prev", navigable, currentKey: "a" });

      // Assert
      expect(result).toEqual({ target: "c" });
    });

    it("resolves nothing when the current key is not navigable", () => {
      // Arrange & Act
      const next = resolveRovingTarget({ action: "next", navigable, currentKey: "z" });
      const prev = resolveRovingTarget({ action: "prev", navigable, currentKey: "z" });

      // Assert
      expect(next).toBeNull();
      expect(prev).toBeNull();
    });
  });

  describe("first / last", () => {
    it("jumps to the first key", () => {
      // Arrange & Act
      const result = resolveRovingTarget({ action: "first", navigable, currentKey: "c" });

      // Assert
      expect(result).toEqual({ target: "a" });
    });

    it("jumps to the last key", () => {
      // Arrange & Act
      const result = resolveRovingTarget({ action: "last", navigable, currentKey: "a" });

      // Assert
      expect(result).toEqual({ target: "c" });
    });

    it("still jumps when the current key is not navigable", () => {
      // Arrange & Act
      const first = resolveRovingTarget({ action: "first", navigable, currentKey: "z" });
      const last = resolveRovingTarget({ action: "last", navigable, currentKey: "z" });

      // Assert
      expect(first).toEqual({ target: "a" });
      expect(last).toEqual({ target: "c" });
    });
  });

  describe("activate", () => {
    it("targets the current key", () => {
      // Arrange & Act
      const result = resolveRovingTarget({ action: "activate", navigable, currentKey: "b" });

      // Assert
      expect(result).toEqual({ target: "b" });
    });

    it("targets the current key even when it is not navigable", () => {
      // Arrange & Act
      const result = resolveRovingTarget({ action: "activate", navigable, currentKey: "z" });

      // Assert
      expect(result).toEqual({ target: "z" });
    });
  });

  it("resolves nothing when the key press mapped to no action", () => {
    // Arrange & Act
    const result = resolveRovingTarget({ action: undefined, navigable, currentKey: "a" });

    // Assert
    expect(result).toBeNull();
  });

  describe("an empty list", () => {
    it("resolves nothing for any action", () => {
      // Arrange
      const actions = ["next", "prev", "first", "last", "activate"] as const;

      // Act
      const results = actions.map((action) =>
        resolveRovingTarget({ action, navigable: [], currentKey: "a" }),
      );

      // Assert
      expect(results).toEqual([null, null, null, null, null]);
    });
  });

  it("can target a null key, which a bare `K | undefined` return could not express", () => {
    // Arrange & Act
    const result = resolveRovingTarget<string | null>({
      action: "first",
      navigable: [null, "a"],
      currentKey: "a",
    });

    // Assert
    expect(result).toEqual({ target: null });
  });
});

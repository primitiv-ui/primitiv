import { getKeyToActionMap, type RovingKeyAction } from "../getKeyToActionMap";

describe("getKeyToActionMap", () => {
  describe("horizontal orientation", () => {
    it("maps ArrowRight to next and ArrowLeft to prev in LTR", () => {
      // Arrange & Act
      const map = getKeyToActionMap({ orientation: "horizontal" });

      // Assert
      expect(map.ArrowRight).toBe<RovingKeyAction>("next");
      expect(map.ArrowLeft).toBe<RovingKeyAction>("prev");
      expect(map.ArrowUp).toBeUndefined();
      expect(map.ArrowDown).toBeUndefined();
    });

    it("inverts arrow keys in RTL", () => {
      // Arrange & Act
      const map = getKeyToActionMap({ orientation: "horizontal", dir: "rtl" });

      // Assert
      expect(map.ArrowRight).toBe<RovingKeyAction>("prev");
      expect(map.ArrowLeft).toBe<RovingKeyAction>("next");
    });
  });

  describe("both orientations", () => {
    it("maps all four arrow keys, inverting only the horizontal pair under RTL", () => {
      // Arrange & Act
      const ltr = getKeyToActionMap({ orientation: "both" });
      const rtl = getKeyToActionMap({ orientation: "both", dir: "rtl" });

      // Assert
      expect(ltr.ArrowRight).toBe<RovingKeyAction>("next");
      expect(ltr.ArrowLeft).toBe<RovingKeyAction>("prev");
      expect(ltr.ArrowDown).toBe<RovingKeyAction>("next");
      expect(ltr.ArrowUp).toBe<RovingKeyAction>("prev");
      // RTL only affects horizontal arrows
      expect(rtl.ArrowRight).toBe<RovingKeyAction>("prev");
      expect(rtl.ArrowLeft).toBe<RovingKeyAction>("next");
      expect(rtl.ArrowDown).toBe<RovingKeyAction>("next");
      expect(rtl.ArrowUp).toBe<RovingKeyAction>("prev");
    });
  });

  describe("vertical orientation", () => {
    it("maps ArrowDown to next and ArrowUp to prev (RTL has no effect)", () => {
      // Arrange & Act
      const ltr = getKeyToActionMap({ orientation: "vertical" });
      const rtl = getKeyToActionMap({ orientation: "vertical", dir: "rtl" });

      // Assert
      expect(ltr.ArrowDown).toBe<RovingKeyAction>("next");
      expect(ltr.ArrowUp).toBe<RovingKeyAction>("prev");
      expect(ltr.ArrowLeft).toBeUndefined();
      expect(ltr.ArrowRight).toBeUndefined();
      // RTL is a no-op for vertical orientation
      expect(rtl).toEqual(ltr);
    });
  });

  describe("optional homeEnd", () => {
    it("includes Home/End when homeEnd is true", () => {
      // Arrange & Act
      const map = getKeyToActionMap({
        orientation: "horizontal",
        homeEnd: true,
      });

      // Assert
      expect(map.Home).toBe<RovingKeyAction>("first");
      expect(map.End).toBe<RovingKeyAction>("last");
    });

    it("omits Home/End by default", () => {
      // Arrange & Act
      const map = getKeyToActionMap({ orientation: "horizontal" });

      // Assert
      expect(map.Home).toBeUndefined();
      expect(map.End).toBeUndefined();
    });
  });

  describe("optional activate", () => {
    it("maps Enter and Space to activate when activate is true", () => {
      // Arrange & Act
      const map = getKeyToActionMap({
        orientation: "horizontal",
        activate: true,
      });

      // Assert
      expect(map.Enter).toBe<RovingKeyAction>("activate");
      expect(map[" "]).toBe<RovingKeyAction>("activate");
    });

    it("omits Enter/Space by default", () => {
      // Arrange & Act
      const map = getKeyToActionMap({ orientation: "horizontal" });

      // Assert
      expect(map.Enter).toBeUndefined();
      expect(map[" "]).toBeUndefined();
    });
  });
});

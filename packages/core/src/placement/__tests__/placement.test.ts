import { panelPlacement } from "../placement";

/** A box from its left, top, width and height. */
const box = (left: number, top: number, width: number, height: number) => ({
  left,
  top,
  right: left + width,
  bottom: top + height,
});

const anchor = box(100, 100, 60, 20);

describe("panelPlacement", () => {
  it("finds the side of the anchor the panel landed on", () => {
    // Arrange & Act & Assert
    expect(panelPlacement(box(80, 40, 100, 50), anchor).side).toBe("top");
    expect(panelPlacement(box(80, 128, 100, 50), anchor).side).toBe("bottom");
    expect(panelPlacement(box(0, 85, 90, 50), anchor).side).toBe("left");
    expect(panelPlacement(box(170, 85, 90, 50), anchor).side).toBe("right");
  });

  it("takes the side the panel stands furthest out on, when it also overlaps another", () => {
    // Arrange — below the anchor, but reaching past its left edge too.
    const panel = box(40, 130, 200, 40);

    // Act & Assert
    expect(panelPlacement(panel, anchor).side).toBe("bottom");
  });

  it("aligns to the third of the panel facing the anchor's centre, along the side", () => {
    // Arrange & Act & Assert — the anchor's centre is at x = 130, y = 110.
    expect(panelPlacement(box(100, 40, 300, 50), anchor).align).toBe("left");
    expect(panelPlacement(box(30, 40, 200, 50), anchor).align).toBe("center");
    expect(panelPlacement(box(-140, 40, 300, 50), anchor).align).toBe("right");
    expect(panelPlacement(box(170, 100, 90, 300), anchor).align).toBe("top");
    expect(panelPlacement(box(170, 10, 90, 200), anchor).align).toBe("center");
    expect(panelPlacement(box(170, -170, 90, 300), anchor).align).toBe("bottom");
  });

  it("settles a tie between two sides on the first of top, bottom, left, right", () => {
    // Arrange — as far above the anchor as to its right.
    const panel = box(170, 40, 90, 50);

    // Act & Assert
    expect(panelPlacement(panel, anchor).side).toBe("top");
  });

  it("aligns a panel below the anchor along its horizontal edge", () => {
    // Arrange & Act & Assert
    expect(panelPlacement(box(100, 130, 300, 50), anchor).align).toBe("left");
  });

  it("counts the anchor's centre on a third's boundary as centred", () => {
    // Arrange & Act & Assert — the centre at exactly 1/3 and 2/3 of a 300px panel.
    expect(panelPlacement(box(30, 40, 300, 50), anchor).align).toBe("center");
    expect(panelPlacement(box(-70, 40, 300, 50), anchor).align).toBe("center");
  });
});

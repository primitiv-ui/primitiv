import { TOOLTIP_GRACE_MS, tooltipOpenDelay } from "../policy";

describe("tooltipOpenDelay", () => {
  it("waits the delay when no tooltip in the group was open just now", () => {
    // Arrange & Act & Assert
    expect(tooltipOpenDelay({ groupOpen: false, delay: 700 })).toBe(700);
  });

  it("opens at once while the group is still in its skip-delay window", () => {
    // Arrange & Act & Assert
    expect(tooltipOpenDelay({ groupOpen: true, delay: 700 })).toBe(0);
  });
});

describe("TOOLTIP_GRACE_MS", () => {
  it("gives the pointer 100ms to cross from the trigger onto the content", () => {
    // Arrange & Act & Assert
    expect(TOOLTIP_GRACE_MS).toBe(100);
  });
});

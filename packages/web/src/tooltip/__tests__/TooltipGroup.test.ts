import { TooltipGroup } from "../TooltipGroup";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("TooltipGroup", () => {
  it("starts closed", () => {
    // Arrange & Act & Assert
    expect(new TooltipGroup(() => 300).isOpen()).toBe(false);
  });

  it("is open from the moment a tooltip opens", () => {
    // Arrange
    const group = new TooltipGroup(() => 300);

    // Act
    group.opened();

    // Assert
    expect(group.isOpen()).toBe(true);
  });

  it("stays open for the skip delay after a tooltip closes, then closes", () => {
    // Arrange
    const group = new TooltipGroup(() => 300);
    group.opened();

    // Act
    group.closed();
    vi.advanceTimersByTime(299);
    const during = group.isOpen();
    vi.advanceTimersByTime(1);

    // Assert
    expect(during).toBe(true);
    expect(group.isOpen()).toBe(false);
  });

  it("reads the skip delay when it closes, so a changed delay applies", () => {
    // Arrange
    let skip = 300;
    const group = new TooltipGroup(() => skip);
    group.opened();
    skip = 50;

    // Act
    group.closed();
    vi.advanceTimersByTime(50);

    // Assert
    expect(group.isOpen()).toBe(false);
  });

  it("keeps the window open when another tooltip opens within it", () => {
    // Arrange
    const group = new TooltipGroup(() => 300);
    group.opened();
    group.closed();

    // Act
    vi.advanceTimersByTime(200);
    group.opened();
    vi.advanceTimersByTime(500);

    // Assert
    expect(group.isOpen()).toBe(true);
  });

  it("restarts the window on a second close rather than leaking the first timer", () => {
    // Arrange
    const group = new TooltipGroup(() => 300);
    group.opened();
    group.closed();
    vi.advanceTimersByTime(200);

    // Act
    group.closed();
    vi.advanceTimersByTime(200);
    const during = group.isOpen();
    vi.advanceTimersByTime(100);

    // Assert
    expect(during).toBe(true);
    expect(group.isOpen()).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("cancels a pending close when disposed", () => {
    // Arrange
    const group = new TooltipGroup(() => 300);
    group.opened();
    group.closed();

    // Act
    group.dispose();

    // Assert
    expect(vi.getTimerCount()).toBe(0);
  });
});
